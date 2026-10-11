const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');

const router = express.Router();
router.use(verificarToken);

// GET /api/alimentos (catálogo completo)
router.get('/', async (req, res) => {
  try {
    const [filas] = await pool.query(
      `SELECT a.id, a.nombre, a.unidad_medida, c.nombre AS categoria
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

// POST /api/alimentos (agregar un alimento nuevo al catálogo)
router.post('/', async (req, res) => {
  const { categoria_id, nombre, unidad_medida } = req.body;

  if (!categoria_id || !nombre || !unidad_medida) {
    return res
      .status(400)
      .json({ error: 'categoria_id, nombre y unidad_medida son obligatorios' });
  }

  try {
    const [resultado] = await pool.query(
      'INSERT INTO alimentos (categoria_id, nombre, unidad_medida) VALUES (?, ?, ?)',
      [categoria_id, nombre, unidad_medida]
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