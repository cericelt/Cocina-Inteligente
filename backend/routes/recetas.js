const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');

const router = express.Router();
router.use(verificarToken);

const TIPOS = ['desayuno', 'almuerzo', 'cena', 'merienda'];

// POST /api/recetas
// body: { nombre, instrucciones, tiempo_preparacion, porciones, tipos_comida: [..],
//         ingredientes: [{ alimento_id, cantidad }] }
router.post('/', async (req, res) => {
  const body = req.body || {};
  const nombre = (body.nombre || '').trim();
  const instrucciones = (body.instrucciones || '').trim();
  const tiempo = body.tiempo_preparacion === '' || body.tiempo_preparacion == null ? null : Number(body.tiempo_preparacion);
  const porciones = Number(body.porciones);
  const tipos = Array.isArray(body.tipos_comida) ? body.tipos_comida.filter((t) => TIPOS.includes(t)) : [];
  const ingredientes = Array.isArray(body.ingredientes) ? body.ingredientes : [];

  if (!nombre || !instrucciones) {
    return res.status(400).json({ error: 'El nombre y las instrucciones son obligatorios' });
  }
  if (!Number.isInteger(porciones) || porciones < 1 || porciones > 20) {
    return res.status(400).json({ error: 'Las porciones deben ser un número entero entre 1 y 20' });
  }
  if (tiempo !== null && (!Number.isInteger(tiempo) || tiempo < 0)) {
    return res.status(400).json({ error: 'El tiempo de preparación debe ser un número entero de minutos' });
  }
  if (tipos.length === 0) {
    return res.status(400).json({ error: 'Elige al menos un tipo de comida' });
  }
  if (ingredientes.length === 0) {
    return res.status(400).json({ error: 'Agrega al menos un ingrediente' });
  }
  const vistos = new Set();
  for (const ing of ingredientes) {
    const cant = Number(ing.cantidad);
    if (!ing.alimento_id || !Number.isFinite(cant) || cant <= 0) {
      return res.status(400).json({ error: 'Cada ingrediente necesita un alimento y una cantidad mayor a 0' });
    }
    if (vistos.has(Number(ing.alimento_id))) {
      return res.status(400).json({ error: 'Un alimento está repetido en los ingredientes' });
    }
    vistos.add(Number(ing.alimento_id));
  }

  const conn = await pool.getConnection();
  try {
    const [existe] = await conn.query('SELECT id FROM recetas WHERE LOWER(nombre) = LOWER(?)', [nombre]);
    if (existe.length > 0) {
      return res.status(409).json({ error: 'Ya existe una receta con ese nombre' });
    }
    await conn.beginTransaction();
    const [r] = await conn.query(
      'INSERT INTO recetas (nombre, instrucciones, tiempo_preparacion, porciones, tipo_comida) VALUES (?, ?, ?, ?, ?)',
      [nombre, instrucciones, tiempo, porciones, tipos.join(',')]
    );
    for (const ing of ingredientes) {
      await conn.query(
        'INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) VALUES (?, ?, ?)',
        [r.insertId, ing.alimento_id, Number(ing.cantidad)]
      );
    }
    await conn.commit();
    res.status(201).json({ id: r.insertId, nombre });
  } catch (error) {
    await conn.rollback().catch(() => {});
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Alguno de los alimentos indicados no existe' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear la receta' });
  } finally {
    conn.release();
  }
});

module.exports = router;
