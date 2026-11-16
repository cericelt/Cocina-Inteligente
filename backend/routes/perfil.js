const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// Convierte "pollo. leche; maní" en "pollo, leche, maní"
function limpiarLista(texto) {
  return (texto || '')
    .split(/[,;.\n]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .join(', ')
    .slice(0, 255) || null;
}

// GET /api/perfil -> alergias y restricciones del perfil original (se mantiene por compatibilidad)
router.get('/', verificarToken, async (req, res) => {
  try {
    const [filas] = await pool.query(
      'SELECT alergias, restricciones_dieta FROM perfiles_nutricionales WHERE usuario_id = ?',
      [req.usuario.id]
    );
    res.json(filas[0] || { alergias: '', restricciones_dieta: '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar el perfil' });
  }
});

// PUT /api/perfil -> crea o actualiza el perfil original
router.put('/', verificarToken, async (req, res) => {
  const body = req.body || {};
  const alergias = limpiarLista(body.alergias);
  const restricciones = limpiarLista(body.restricciones_dieta);
  try {
    await pool.query(
      `INSERT INTO perfiles_nutricionales (usuario_id, alergias, restricciones_dieta)
       VALUES (?, ?, ?) AS nuevo
       ON DUPLICATE KEY UPDATE alergias = nuevo.alergias,
                               restricciones_dieta = nuevo.restricciones_dieta`,
      [req.usuario.id, alergias, restricciones]
    );
    res.json({ mensaje: 'Perfil guardado', alergias, restricciones_dieta: restricciones });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar el perfil' });
  }
});

// ---------- Personas (varios perfiles por cuenta) ----------

// Si la cuenta aún no tiene personas, crea la primera con los datos del perfil original
async function asegurarPrimeraPersona(usuarioId) {
  const [existentes] = await pool.query('SELECT id FROM personas WHERE usuario_id = ? LIMIT 1', [usuarioId]);
  if (existentes.length > 0) return;
  const [u] = await pool.query('SELECT nombre FROM usuarios WHERE id = ?', [usuarioId]);
  const [p] = await pool.query(
    'SELECT alergias, restricciones_dieta FROM perfiles_nutricionales WHERE usuario_id = ?',
    [usuarioId]
  );
  await pool.query(
    'INSERT INTO personas (usuario_id, nombre, alergias, restricciones_dieta) VALUES (?, ?, ?, ?)',
    [usuarioId, (u[0] && u[0].nombre) || 'Yo', (p[0] && p[0].alergias) || null, (p[0] && p[0].restricciones_dieta) || null]
  );
}

// GET /api/perfil/personas
router.get('/personas', verificarToken, async (req, res) => {
  try {
    await asegurarPrimeraPersona(req.usuario.id);
    const [filas] = await pool.query(
      'SELECT id, nombre, alergias, restricciones_dieta FROM personas WHERE usuario_id = ? ORDER BY id',
      [req.usuario.id]
    );
    res.json(filas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar las personas' });
  }
});

// POST /api/perfil/personas  { nombre, alergias, restricciones_dieta }
router.post('/personas', verificarToken, async (req, res) => {
  const body = req.body || {};
  const nombre = String(body.nombre || '').trim().slice(0, 80);
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  try {
    const [r] = await pool.query(
      'INSERT INTO personas (usuario_id, nombre, alergias, restricciones_dieta) VALUES (?, ?, ?, ?)',
      [req.usuario.id, nombre, limpiarLista(body.alergias), limpiarLista(body.restricciones_dieta)]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear la persona' });
  }
});

// PUT /api/perfil/personas/:id
router.put('/personas/:id', verificarToken, async (req, res) => {
  const body = req.body || {};
  const nombre = String(body.nombre || '').trim().slice(0, 80);
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  try {
    const [r] = await pool.query(
      'UPDATE personas SET nombre = ?, alergias = ?, restricciones_dieta = ? WHERE id = ? AND usuario_id = ?',
      [nombre, limpiarLista(body.alergias), limpiarLista(body.restricciones_dieta), req.params.id, req.usuario.id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Persona no encontrada' });
    res.json({ actualizado: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar la persona' });
  }
});

// DELETE /api/perfil/personas/:id  (debe quedar al menos una)
router.delete('/personas/:id', verificarToken, async (req, res) => {
  try {
    const [cuenta] = await pool.query('SELECT COUNT(*) AS n FROM personas WHERE usuario_id = ?', [req.usuario.id]);
    if (cuenta[0].n <= 1) {
      return res.status(400).json({ error: 'Debe quedar al menos una persona en el perfil' });
    }
    const [r] = await pool.query('DELETE FROM personas WHERE id = ? AND usuario_id = ?', [req.params.id, req.usuario.id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Persona no encontrada' });
    res.json({ eliminado: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar la persona' });
  }
});

module.exports = router;
