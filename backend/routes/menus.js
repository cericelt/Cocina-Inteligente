const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');

const router = express.Router();
router.use(verificarToken);

const DIAS_ALERTA = 3;

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// GET /api/menus/sugerencias
router.get('/sugerencias', async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    // Despensa del usuario: solo lo que existe y no está vencido
    const [stockFilas] = await pool.query(
      `SELECT alimento_id,
              SUM(cantidad) AS cantidad,
              MIN(DATEDIFF(fecha_vencimiento, CURDATE())) AS dias_para_vencer
       FROM inventario_alimentos
       WHERE usuario_id = ? AND cantidad > 0
         AND (fecha_vencimiento IS NULL OR fecha_vencimiento >= CURDATE())
       GROUP BY alimento_id`,
      [usuarioId]
    );
    const stock = new Map();
    for (const f of stockFilas) {
      stock.set(f.alimento_id, {
        cantidad: Number(f.cantidad),
        dias: f.dias_para_vencer === null ? null : Number(f.dias_para_vencer),
      });
    }

    // Alergias del perfil nutricional (texto separado por comas)
    const [perfil] = await pool.query(
      'SELECT alergias FROM perfiles_nutricionales WHERE usuario_id = ?',
      [usuarioId]
    );
    const alergias = (perfil[0]?.alergias || '')
      .split(',')
      .map(normalizar)
      .filter(Boolean);

    // Todas las recetas con sus ingredientes
    const [filas] = await pool.query(
      `SELECT r.id AS receta_id, r.nombre AS receta, r.instrucciones, r.tiempo_preparacion,
              ri.alimento_id, a.nombre AS alimento, a.unidad_medida,
              c.nombre AS categoria, ri.cantidad_necesaria
       FROM recetas r
       JOIN receta_ingredientes ri ON ri.receta_id = r.id
       JOIN alimentos a ON a.id = ri.alimento_id
       JOIN categorias_alimentos c ON c.id = a.categoria_id
       ORDER BY r.id`
    );

    const recetas = new Map();
    for (const f of filas) {
      if (!recetas.has(f.receta_id)) {
        recetas.set(f.receta_id, {
          receta_id: f.receta_id,
          nombre: f.receta,
          instrucciones: f.instrucciones,
          tiempo_preparacion: f.tiempo_preparacion,
          ingredientes: [],
        });
      }
      recetas.get(f.receta_id).ingredientes.push(f);
    }

    const sugerencias = [];
    for (const receta of recetas.values()) {
      // Excluir recetas con ingredientes a los que el usuario es alérgico
      const contieneAlergia = receta.ingredientes.some((i) => {
        const nombre = normalizar(i.alimento);
        const categoria = normalizar(i.categoria);
        return alergias.some((a) => nombre.includes(a) || categoria.includes(a));
      });
      if (contieneAlergia) continue;

      const faltantes = [];
      const porVencer = [];
      let disponibles = 0;

      for (const ing of receta.ingredientes) {
        const necesaria = Number(ing.cantidad_necesaria);
        const enStock = stock.get(ing.alimento_id);

        if (enStock && enStock.cantidad >= necesaria) {
          disponibles++;
          if (enStock.dias !== null && enStock.dias <= DIAS_ALERTA) {
            porVencer.push(ing.alimento);
          }
        } else {
          faltantes.push({
            alimento: ing.alimento,
            falta: necesaria - (enStock ? enStock.cantidad : 0),
            unidad: ing.unidad_medida,
          });
        }
      }

      sugerencias.push({
        receta_id: receta.receta_id,
        nombre: receta.nombre,
        tiempo_preparacion: receta.tiempo_preparacion,
        instrucciones: receta.instrucciones,
        puede_cocinar: faltantes.length === 0,
        cobertura: Math.round((disponibles / receta.ingredientes.length) * 100),
        ingredientes_por_vencer: porVencer,
        faltantes,
      });
    }

    // Orden: se puede cocinar, más ingredientes por vencer, mayor cobertura
    sugerencias.sort(
      (a, b) =>
        Number(b.puede_cocinar) - Number(a.puede_cocinar) ||
        b.ingredientes_por_vencer.length - a.ingredientes_por_vencer.length ||
        b.cobertura - a.cobertura
    );

    res.json(sugerencias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar las sugerencias de menú' });
  }
});
// POST /api/menus/confirmar  -> body: { "receta_id": 6, "fecha": "2026-10-11" }
router.post('/confirmar', verificarToken, async (req, res) => {
  const { receta_id, fecha } = req.body;
  if (!receta_id) {
    return res.status(400).json({ error: 'Falta receta_id' });
  }
  const fechaPlan = fecha || new Date().toISOString().slice(0, 10);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Ingredientes de la receta
    const [ingredientes] = await conn.query(
      `SELECT ri.alimento_id, ri.cantidad_necesaria, a.nombre
       FROM receta_ingredientes ri
       JOIN alimentos a ON a.id = ri.alimento_id
       WHERE ri.receta_id = ?`,
      [receta_id]
    );
    if (ingredientes.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Receta no encontrada' });
    }

    // 2. Descontar cada ingrediente, primero lo que vence antes
    const faltantes = [];
    for (const ing of ingredientes) {
      let pendiente = Number(ing.cantidad_necesaria);

      const [lotes] = await conn.query(
        `SELECT id, cantidad FROM inventario_alimentos
         WHERE usuario_id = ? AND alimento_id = ? AND cantidad > 0
           AND (fecha_vencimiento IS NULL OR fecha_vencimiento >= CURDATE())
         ORDER BY fecha_vencimiento IS NULL, fecha_vencimiento ASC
         FOR UPDATE`,
        [req.usuario.id, ing.alimento_id]
      );

      for (const lote of lotes) {
        if (pendiente <= 0) break;
        const usar = Math.min(Number(lote.cantidad), pendiente);
        await conn.query(
          'UPDATE inventario_alimentos SET cantidad = cantidad - ? WHERE id = ?',
          [usar, lote.id]
        );
        pendiente -= usar;
      }

      if (pendiente > 0) {
        faltantes.push({ alimento: ing.nombre, falta: pendiente });
      }
    }

    // 3. Si falta algo, se cancela todo
    if (faltantes.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        error: 'No hay ingredientes suficientes',
        faltantes
      });
    }

    // 4. Limpiar lotes agotados y guardar el menú
    await conn.query(
      'DELETE FROM inventario_alimentos WHERE usuario_id = ? AND cantidad <= 0',
      [req.usuario.id]
    );
    const [resultado] = await conn.query(
      `INSERT INTO menus (usuario_id, receta_id, fecha_planificada, estado)
       VALUES (?, ?, ?, 'confirmado')`,
      [req.usuario.id, receta_id, fechaPlan]
    );

    await conn.commit();
    res.status(201).json({ mensaje: 'Menú confirmado', menu_id: resultado.insertId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al confirmar el menú' });
  } finally {
    conn.release();
  }
});

// GET /api/menus/nutricion -> calorías y macros de cada receta (valores aproximados)
router.get('/nutricion', verificarToken, async (req, res) => {
  try {
    const [filas] = await pool.query(
      `SELECT r.id AS receta_id, r.porciones, r.tipo_comida,
              SUM(x.gramos * a.kcal_100g / 100)          AS kcal_total,
              SUM(x.gramos * a.proteinas_100g / 100)     AS proteinas_total,
              SUM(x.gramos * a.carbohidratos_100g / 100) AS carbohidratos_total,
              SUM(x.gramos * a.grasas_100g / 100)        AS grasas_total
       FROM recetas r
       JOIN (
         SELECT ri.receta_id, ri.alimento_id,
                ri.cantidad_necesaria *
                  IF(al.unidad_medida = 'unidad', COALESCE(al.gramos_por_unidad, 0), 1) AS gramos
         FROM receta_ingredientes ri
         JOIN alimentos al ON al.id = ri.alimento_id
       ) x ON x.receta_id = r.id
       JOIN alimentos a ON a.id = x.alimento_id
       GROUP BY r.id, r.porciones, r.tipo_comida`
    );

    const uno = n => Math.round(Number(n || 0) * 10) / 10;
    const entero = n => Math.round(Number(n || 0));

    res.json(filas.map(f => {
      const p = f.porciones || 1;
      return {
        receta_id: f.receta_id,
        porciones: p,
        tipos_comida: f.tipo_comida ? f.tipo_comida.split(',') : [],
        total: {
          kcal: entero(f.kcal_total),
          proteinas_g: uno(f.proteinas_total),
          carbohidratos_g: uno(f.carbohidratos_total),
          grasas_g: uno(f.grasas_total),
        },
        por_porcion: {
          kcal: entero(f.kcal_total / p),
          proteinas_g: uno(f.proteinas_total / p),
          carbohidratos_g: uno(f.carbohidratos_total / p),
          grasas_g: uno(f.grasas_total / p),
        },
      };
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al calcular la nutrición' });
  }
});

module.exports = router;