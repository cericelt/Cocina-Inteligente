const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');

const referencia = require('../data/catalogo_referencia');

const router = express.Router();
router.use(verificarToken);

// GET /api/alimentos (catálogo completo)
router.get('/', async (req, res) => {
  try {
    const [filas] = await pool.query(
      `SELECT a.id, a.nombre, a.unidad_medida, a.gramos_por_unidad, c.nombre AS categoria
       FROM alimentos a
       JOIN categorias_alimentos c ON c.id = a.categoria_id
       ORDER BY c.nombre, a.nombre`
    );
    res.json(filas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el catálogo' });
  }
});

// GET /api/alimentos/categorias
router.get('/categorias', async (req, res) => {
  try {
    const [filas] = await pool.query('SELECT id, nombre FROM categorias_alimentos ORDER BY nombre');
    res.json(filas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las categorías' });
  }
});

// GET /api/alimentos/referencia?q=texto  -> alimentos de la base de referencia que aún no están en el catálogo
const sinTildes = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
router.get('/referencia', async (req, res) => {
  try {
    const [filas] = await pool.query('SELECT nombre FROM alimentos');
    const existentes = new Set(filas.map((f) => sinTildes(f.nombre)));
    const q = sinTildes(req.query.q || '');
    const cat = sinTildes(req.query.categoria || '');
    const lista = referencia
      .filter((a) => !existentes.has(sinTildes(a.nombre)))
      .filter((a) => !cat || sinTildes(a.categoria) === cat)
      .filter((a) => !q || sinTildes(a.nombre).includes(q))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    res.json(lista);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar la base de referencia' });
  }
});

const numOpcional = (v) => (v === undefined || v === null || v === '' ? null : Number(v));

// PUT /api/alimentos/:id/peso-unidad  { gramos_por_unidad } -> guarda cuánto pesa 1 unidad (para convertir entre unidades y gramos)
router.put('/:id/peso-unidad', async (req, res) => {
  const gpu = Number((req.body || {}).gramos_por_unidad);
  if (!Number.isFinite(gpu) || gpu <= 0) return res.status(400).json({ error: 'El peso de una unidad debe ser un número mayor que 0' });
  try {
    const [r] = await pool.query('UPDATE alimentos SET gramos_por_unidad = ? WHERE id = ?', [gpu, req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Alimento no encontrado' });
    res.json({ actualizado: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo guardar el peso de la unidad' });
  }
});

// POST /api/alimentos (agregar un alimento nuevo al catálogo, con datos nutricionales por 100 g)
router.post('/', async (req, res) => {
  const body = req.body || {};
  const { categoria_id, unidad_medida } = body;
  const nombre = (body.nombre || '').trim();

  if (!categoria_id || !nombre || !unidad_medida) {
    return res
      .status(400)
      .json({ error: 'categoria_id, nombre y unidad_medida son obligatorios' });
  }
  if (!['g', 'ml', 'unidad'].includes(unidad_medida)) {
    return res.status(400).json({ error: 'La unidad debe ser g, ml o unidad' });
  }
  const kcal = numOpcional(body.kcal_100g);
  const prot = numOpcional(body.proteinas_100g);
  const carb = numOpcional(body.carbohidratos_100g);
  const gras = numOpcional(body.grasas_100g);
  const gpu = numOpcional(body.gramos_por_unidad);
  for (const v of [kcal, prot, carb, gras, gpu]) {
    if (v !== null && (!Number.isFinite(v) || v < 0)) {
      return res.status(400).json({ error: 'Los valores nutricionales deben ser números positivos' });
    }
  }
  if (unidad_medida === 'unidad' && !gpu) {
    return res.status(400).json({ error: 'Si la unidad es "unidad", indica cuántos gramos pesa una unidad' });
  }

  try {
    const [existe] = await pool.query('SELECT id FROM alimentos WHERE LOWER(nombre) = LOWER(?)', [nombre]);
    if (existe.length > 0) {
      return res.status(409).json({ error: 'Ya existe un alimento con ese nombre' });
    }
    const [resultado] = await pool.query(
      `INSERT INTO alimentos
         (categoria_id, nombre, unidad_medida, kcal_100g, proteinas_100g, carbohidratos_100g, grasas_100g, gramos_por_unidad)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [categoria_id, nombre, unidad_medida, kcal, prot, carb, gras, gpu || null]
    );
    res.status(201).json({ id: resultado.insertId, categoria_id, nombre, unidad_medida });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'La categoría indicada no existe' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear el alimento' });
  }
});

module.exports = router;
