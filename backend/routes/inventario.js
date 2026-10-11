const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');

const router = express.Router();
router.use(verificarToken);

const DIAS_ALERTA = 3; // cuántos días antes se considera "por vencer"
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

const SELECT_BASE = `
  SELECT i.id, i.alimento_id, a.nombre, c.nombre AS categoria, a.unidad_medida,
         i.cantidad,
         DATE_FORMAT(i.fecha_vencimiento, '%Y-%m-%d') AS fecha_vencimiento,
         DATE_FORMAT(i.fecha_registro, '%Y-%m-%d %H:%i:%s') AS fecha_registro,
         DATEDIFF(i.fecha_vencimiento, CURDATE()) AS dias_para_vencer
  FROM inventario_alimentos i
  JOIN alimentos a ON a.id = i.alimento_id
  JOIN categorias_alimentos c ON c.id = a.categoria_id
  WHERE i.usuario_id = ?`;

function agregarEstado(fila) {
  let estado = 'sin_vencimiento';
  if (fila.dias_para_vencer !== null) {
    if (fila.dias_para_vencer < 0) estado = 'vencido';
    else if (fila.dias_para_vencer <= DIAS_ALERTA) estado = 'por_vencer';
    else estado = 'ok';
  }
  return { ...fila, estado };
}

// GET /api/inventario (toda la despensa del usuario)
router.get('/', async (req, res) => {
  try {
    const [filas] = await pool.query(
      SELECT_BASE + ' ORDER BY i.fecha_vencimiento IS NULL, i.fecha_vencimiento ASC',
      [req.usuario.id]
    );
    res.json(filas.map(agregarEstado));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el inventario' });
  }
});

// GET /api/inventario/alertas (vencidos o por vencer; ?dias=N cambia el margen)
router.get('/alertas', async (req, res) => {
  const dias = Number(req.query.dias) || DIAS_ALERTA;
  try {
    const [filas] = await pool.query(
      SELECT_BASE +
        ' AND i.fecha_vencimiento IS NOT NULL' +
        ' AND DATEDIFF(i.fecha_vencimiento, CURDATE()) <= ?' +
        ' ORDER BY i.fecha_vencimiento ASC',
      [req.usuario.id, dias]
    );
    res.json(filas.map(agregarEstado));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las alertas' });
  }
});

// POST /api/inventario (agregar un alimento a la despensa)
router.post('/', verificarToken, async (req, res) => {
  const { alimento_id, cantidad, fecha_vencimiento } = req.body;
  const cant = Number(cantidad);

  if (!alimento_id || !(cant > 0)) {
    return res.status(400).json({ error: 'alimento_id y una cantidad mayor a 0 son obligatorios' });
  }
  const fecha = fecha_vencimiento || null;

  try {
    // ¿Ya existe ese alimento con la misma fecha de vencimiento?
    const [existente] = await pool.query(
      `SELECT id FROM inventario_alimentos
       WHERE usuario_id = ? AND alimento_id = ? AND fecha_vencimiento <=> ?
       LIMIT 1`,
      [req.usuario.id, alimento_id, fecha]
    );

    if (existente.length > 0) {
      await pool.query(
        'UPDATE inventario_alimentos SET cantidad = cantidad + ? WHERE id = ?',
        [cant, existente[0].id]
      );
      return res.json({ id: existente[0].id, mensaje: 'Cantidad sumada al registro existente' });
    }

    const [resultado] = await pool.query(
      `INSERT INTO inventario_alimentos (usuario_id, alimento_id, cantidad, fecha_vencimiento)
       VALUES (?, ?, ?, ?)`,
      [req.usuario.id, alimento_id, cant, fecha]
    );
    res.status(201).json({ id: resultado.insertId, mensaje: 'Alimento registrado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar el alimento' });
  }
});

// PUT /api/inventario/:id (reemplaza cantidad y fecha de vencimiento)
router.put('/:id', async (req, res) => {
  const { cantidad, fecha_vencimiento } = req.body;

  if (cantidad === undefined || Number(cantidad) < 0) {
    return res.status(400).json({ error: 'La cantidad es obligatoria y no puede ser negativa' });
  }
  if (fecha_vencimiento && !FECHA_RE.test(fecha_vencimiento)) {
    return res.status(400).json({ error: 'La fecha debe tener el formato AAAA-MM-DD' });
  }

  try {
    const [resultado] = await pool.query(
      'UPDATE inventario_alimentos SET cantidad = ?, fecha_vencimiento = ? WHERE id = ? AND usuario_id = ?',
      [cantidad, fecha_vencimiento || null, req.params.id, req.usuario.id]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Ítem no encontrado' });
    }
    const [filas] = await pool.query(SELECT_BASE + ' AND i.id = ?', [
      req.usuario.id,
      req.params.id,
    ]);
    res.json(agregarEstado(filas[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el ítem' });
  }
});

// DELETE /api/inventario/:id
router.delete('/:id', async (req, res) => {
  try {
    const [resultado] = await pool.query(
      'DELETE FROM inventario_alimentos WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Ítem no encontrado' });
    }
    res.json({ eliminado: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el ítem' });
  }
});

module.exports = router;