const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');

const router = express.Router();
router.use(verificarToken);

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------- Cálculo de lo que falta comprar ----------

function leerPersonas(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  const n = Number(valor);
  if (!Number.isFinite(n) || n < 1 || n > 20) return NaN;
  return n;
}

// Devuelve, por alimento: cuánto se necesita, cuánto hay en la despensa y cuánto falta (solo los que faltan)
async function calcularItems(usuarioId, recetaIds, nPersonas) {
  // cuántas veces aparece cada receta (si se repite en la semana, se cocina varias veces)
  const veces = {};
  recetaIds.forEach((id) => { veces[id] = (veces[id] || 0) + 1; });
  const idsUnicos = Object.keys(veces).map(Number);

  const [filas] = await pool.query(
    `SELECT r.id AS receta_id, r.porciones, ri.alimento_id, ri.cantidad_necesaria,
            a.nombre AS alimento, a.unidad_medida AS unidad
     FROM recetas r
     JOIN receta_ingredientes ri ON ri.receta_id = r.id
     JOIN alimentos a ON a.id = ri.alimento_id
     WHERE r.id IN (?)`,
    [idsUnicos]
  );

  const necesario = {};
  for (const f of filas) {
    const factor = nPersonas ? nPersonas / (f.porciones || 1) : 1;
    const cant = Number(f.cantidad_necesaria) * factor * veces[f.receta_id];
    if (!necesario[f.alimento_id]) {
      necesario[f.alimento_id] = { alimento_id: f.alimento_id, alimento: f.alimento, unidad: f.unidad, cantidad: 0 };
    }
    necesario[f.alimento_id].cantidad += cant;
  }

  const [stock] = await pool.query(
    `SELECT alimento_id, SUM(cantidad) AS total
     FROM inventario_alimentos
     WHERE usuario_id = ? AND (fecha_vencimiento IS NULL OR fecha_vencimiento >= CURDATE())
     GROUP BY alimento_id`,
    [usuarioId]
  );
  const stockPor = {};
  stock.forEach((s) => { stockPor[s.alimento_id] = Number(s.total); });

  const items = [];
  for (const n of Object.values(necesario)) {
    const enDespensa = stockPor[n.alimento_id] || 0;
    let falta = n.cantidad - enDespensa;
    if (falta <= 0.0001) continue;
    const redondear = (x) => (n.unidad === 'unidad' ? Math.ceil(x) : Math.round(x * 100) / 100);
    items.push({
      alimento_id: n.alimento_id,
      alimento: n.alimento,
      unidad: n.unidad,
      necesario: redondear(n.cantidad),
      en_despensa: Math.round(enDespensa * 100) / 100,
      cantidad_sugerida: redondear(falta),
    });
  }
  items.sort((a, b) => a.alimento.localeCompare(b.alimento, 'es'));
  return items;
}

function validarEntrada(body) {
  const { receta_ids, personas } = body || {};
  if (!Array.isArray(receta_ids) || receta_ids.length === 0) {
    return { error: 'Debes indicar al menos una receta' };
  }
  const ids = receta_ids.map(Number);
  if (ids.some((x) => !Number.isInteger(x) || x < 1)) return { error: 'Recetas no válidas' };
  const nPersonas = leerPersonas(personas);
  if (Number.isNaN(nPersonas)) return { error: 'personas debe estar entre 1 y 20' };
  return { ids, nPersonas };
}

async function guardarLista(usuarioId, items) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [lista] = await conn.query('INSERT INTO listas_compra (usuario_id) VALUES (?)', [usuarioId]);
    for (const it of items) {
      await conn.query(
        'INSERT INTO listas_compra_items (lista_id, alimento_id, cantidad_sugerida) VALUES (?, ?, ?)',
        [lista.insertId, it.alimento_id, it.cantidad_sugerida]
      );
    }
    await conn.commit();
    return lista.insertId;
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

// POST /api/compras/previsualizar -> { receta_ids: [1, 2], personas: 2 }  (no guarda nada)
router.post('/previsualizar', async (req, res) => {
  try {
    const v = validarEntrada(req.body);
    if (v.error) return res.status(400).json({ error: v.error });
    const items = await calcularItems(req.usuario.id, v.ids, v.nPersonas);
    res.json({ personas: v.nPersonas, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al calcular la lista de compras' });
  }
});

// POST /api/compras/generar -> { receta_ids: [1, 2], personas: 2 }  (calcula y guarda la lista)
router.post('/generar', async (req, res) => {
  try {
    const v = validarEntrada(req.body);
    if (v.error) return res.status(400).json({ error: v.error });
    let items = await calcularItems(req.usuario.id, v.ids, v.nPersonas);
    // alimentos que la usuaria decidió no comprar (desmarcados en la previsualización)
    const excluir = Array.isArray(req.body.excluir) ? req.body.excluir.map(Number) : [];
    if (excluir.length > 0) items = items.filter((it) => !excluir.includes(it.alimento_id));
    if (items.length === 0) {
      return res.json({ mensaje: 'No hay nada que comprar: ya tienes todo o desmarcaste todos los productos', items: [] });
    }
    const listaId = await guardarLista(req.usuario.id, items);
    res.status(201).json({ lista_id: listaId, personas: v.nPersonas, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar la lista de compras' });
  }
});

// ---------- Listas fijas (las elige la usuaria y quedan siempre disponibles) ----------

async function cargarListaFija(usuarioId, listaId) {
  const [listas] = await pool.query('SELECT id, nombre FROM listas_fijas WHERE id = ? AND usuario_id = ?', [listaId, usuarioId]);
  if (listas.length === 0) return null;
  const [items] = await pool.query(
    `SELECT i.alimento_id, a.nombre AS alimento, a.unidad_medida AS unidad, i.cantidad
     FROM listas_fijas_items i JOIN alimentos a ON a.id = i.alimento_id
     WHERE i.lista_id = ? ORDER BY a.nombre`,
    [listaId]
  );
  return { id: listas[0].id, nombre: listas[0].nombre, items: items.map((i) => ({ ...i, cantidad: Number(i.cantidad) })) };
}

function validarFija(body) {
  const nombre = String((body && body.nombre) || '').trim().slice(0, 100);
  if (!nombre) return { error: 'La lista necesita un nombre' };
  const bruto = Array.isArray(body.items) ? body.items : [];
  const porAlimento = new Map();
  for (const it of bruto) {
    const cant = Number(it.cantidad);
    const id = Number(it.alimento_id);
    if (!Number.isInteger(id) || id < 1 || !Number.isFinite(cant) || cant <= 0) {
      return { error: 'Cada ítem necesita un alimento y una cantidad mayor a 0' };
    }
    porAlimento.set(id, (porAlimento.get(id) || 0) + cant);
  }
  if (porAlimento.size === 0) return { error: 'Agrega al menos un alimento a la lista' };
  return { nombre, items: [...porAlimento.entries()].map(([alimento_id, cantidad]) => ({ alimento_id, cantidad })) };
}

router.get('/fijas', async (req, res) => {
  try {
    const [listas] = await pool.query('SELECT id FROM listas_fijas WHERE usuario_id = ? ORDER BY id', [req.usuario.id]);
    const salida = [];
    for (const l of listas) salida.push(await cargarListaFija(req.usuario.id, l.id));
    res.json(salida);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar las listas fijas' });
  }
});

async function escribirFija(conn, listaId, items) {
  await conn.query('DELETE FROM listas_fijas_items WHERE lista_id = ?', [listaId]);
  for (const it of items) {
    await conn.query(
      'INSERT INTO listas_fijas_items (lista_id, alimento_id, cantidad) VALUES (?, ?, ?)',
      [listaId, it.alimento_id, it.cantidad]
    );
  }
}

router.post('/fijas', async (req, res) => {
  const v = validarFija(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query('INSERT INTO listas_fijas (usuario_id, nombre) VALUES (?, ?)', [req.usuario.id, v.nombre]);
    await escribirFija(conn, r.insertId, v.items);
    await conn.commit();
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    await conn.rollback().catch(() => {});
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Alguno de los alimentos no existe' });
    console.error(err);
    res.status(500).json({ error: 'Error al crear la lista fija' });
  } finally {
    conn.release();
  }
});

router.put('/fijas/:id', async (req, res) => {
  const v = validarFija(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query('UPDATE listas_fijas SET nombre = ? WHERE id = ? AND usuario_id = ?', [v.nombre, req.params.id, req.usuario.id]);
    if (r.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Lista no encontrada' });
    }
    await escribirFija(conn, req.params.id, v.items);
    await conn.commit();
    res.json({ actualizado: true });
  } catch (err) {
    await conn.rollback().catch(() => {});
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Alguno de los alimentos no existe' });
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar la lista fija' });
  } finally {
    conn.release();
  }
});

router.delete('/fijas/:id', async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM listas_fijas WHERE id = ? AND usuario_id = ?', [req.params.id, req.usuario.id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Lista no encontrada' });
    res.json({ eliminado: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar la lista fija' });
  }
});

// POST /api/compras/fijas/:id/usar  { solo_faltantes: true|false }
// Crea una lista de compras nueva (para comprar y registrar) a partir de la lista fija
router.post('/fijas/:id/usar', async (req, res) => {
  try {
    const fija = await cargarListaFija(req.usuario.id, req.params.id);
    if (!fija) return res.status(404).json({ error: 'Lista no encontrada' });
    let items = fija.items.map((i) => ({ alimento_id: i.alimento_id, alimento: i.alimento, unidad: i.unidad, cantidad_sugerida: i.cantidad }));

    if (req.body && req.body.solo_faltantes) {
      const [stock] = await pool.query(
        `SELECT alimento_id, SUM(cantidad) AS total FROM inventario_alimentos
         WHERE usuario_id = ? AND (fecha_vencimiento IS NULL OR fecha_vencimiento >= CURDATE())
         GROUP BY alimento_id`,
        [req.usuario.id]
      );
      const stockPor = {};
      stock.forEach((s) => { stockPor[s.alimento_id] = Number(s.total); });
      items = items
        .map((i) => {
          const falta = i.cantidad_sugerida - (stockPor[i.alimento_id] || 0);
          return { ...i, cantidad_sugerida: i.unidad === 'unidad' ? Math.ceil(falta) : Math.round(falta * 100) / 100 };
        })
        .filter((i) => i.cantidad_sugerida > 0.0001);
    }
    if (items.length === 0) return res.json({ mensaje: 'Ya tienes todo lo de esta lista en tu despensa', items: [] });
    const listaId = await guardarLista(req.usuario.id, items);
    res.status(201).json({ lista_id: listaId, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al usar la lista fija' });
  }
});

// ---------- Listas generadas ----------

// GET /api/compras  -> tus listas guardadas, con sus ítems (filas planas)
router.get('/', async (req, res) => {
  try {
    const [filas] = await pool.query(
      `SELECT l.id AS lista_id, l.fecha_generada, i.alimento_id,
              a.nombre AS alimento, a.unidad_medida AS unidad, i.cantidad_sugerida,
              (cr.lista_id IS NOT NULL) AS comprada
       FROM listas_compra l
       JOIN listas_compra_items i ON i.lista_id = l.id
       JOIN alimentos a ON a.id = i.alimento_id
       LEFT JOIN compras_registradas cr ON cr.lista_id = l.id
       WHERE l.usuario_id = ?
       ORDER BY l.fecha_generada DESC, l.id DESC, a.nombre`,
      [req.usuario.id]
    );
    res.json(filas.map((f) => ({ ...f, comprada: Boolean(f.comprada) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar las listas' });
  }
});

// DELETE /api/compras/:id -> borra una lista de compras
router.delete('/:id', async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM listas_compra WHERE id = ? AND usuario_id = ?', [req.params.id, req.usuario.id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Lista no encontrada' });
    res.json({ eliminado: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al borrar la lista' });
  }
});

// POST /api/compras/:id/recibir
//   body: { items: [{ alimento_id, cantidad, fecha_vencimiento? }], repetir?: true }
// Agrega a la despensa lo que realmente se compró (cantidades editables) y marca la lista como comprada
router.post('/:id/recibir', async (req, res) => {
  const body = req.body || {};
  const entrada = Array.isArray(body.items) ? body.items : [];
  const conn = await pool.getConnection();
  try {
    const [listas] = await conn.query('SELECT id FROM listas_compra WHERE id = ? AND usuario_id = ?', [req.params.id, req.usuario.id]);
    if (listas.length === 0) return res.status(404).json({ error: 'Lista no encontrada' });

    const [ya] = await conn.query('SELECT lista_id FROM compras_registradas WHERE lista_id = ?', [req.params.id]);
    if (ya.length > 0 && !body.repetir) {
      return res.status(409).json({ error: 'Esta lista ya fue agregada a tu despensa' });
    }

    // solo se aceptan alimentos que pertenecen a la lista
    const [deLista] = await conn.query('SELECT alimento_id FROM listas_compra_items WHERE lista_id = ?', [req.params.id]);
    const permitidos = new Set(deLista.map((x) => x.alimento_id));

    const limpios = [];
    for (const it of entrada) {
      const cant = Number(it.cantidad);
      const id = Number(it.alimento_id);
      if (!permitidos.has(id)) return res.status(400).json({ error: 'Hay alimentos que no pertenecen a la lista' });
      if (!Number.isFinite(cant) || cant < 0) return res.status(400).json({ error: 'Las cantidades no pueden ser negativas' });
      if (it.fecha_vencimiento && !FECHA_RE.test(it.fecha_vencimiento)) {
        return res.status(400).json({ error: 'La fecha debe tener el formato AAAA-MM-DD' });
      }
      if (cant > 0) limpios.push({ id, cant, fecha: it.fecha_vencimiento || null });
    }
    if (limpios.length === 0) return res.status(400).json({ error: 'No hay nada que agregar: marca al menos un producto comprado' });

    await conn.beginTransaction();
    for (const it of limpios) {
      const [existente] = await conn.query(
        `SELECT id FROM inventario_alimentos
         WHERE usuario_id = ? AND alimento_id = ? AND fecha_vencimiento <=> ? LIMIT 1`,
        [req.usuario.id, it.id, it.fecha]
      );
      if (existente.length > 0) {
        await conn.query('UPDATE inventario_alimentos SET cantidad = cantidad + ? WHERE id = ?', [it.cant, existente[0].id]);
      } else {
        await conn.query(
          'INSERT INTO inventario_alimentos (usuario_id, alimento_id, cantidad, fecha_vencimiento) VALUES (?, ?, ?, ?)',
          [req.usuario.id, it.id, it.cant, it.fecha]
        );
      }
    }
    await conn.query('INSERT IGNORE INTO compras_registradas (lista_id) VALUES (?)', [req.params.id]);
    await conn.commit();
    res.json({ agregados: limpios.length });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Error al registrar la compra' });
  } finally {
    conn.release();
  }
});

module.exports = router;
