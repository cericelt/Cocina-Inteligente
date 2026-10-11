const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');

const router = express.Router();


// GET /api/perfil -> alergias y restricciones de la usuaria
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
  
// Convierte "pollo. leche; maní" en "pollo, leche, maní"
function limpiarLista(texto) {
    return (texto || '')
      .split(/[,;.\n]/)
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .join(', ')
      .slice(0, 255) || null;
  }


  // PUT /api/perfil -> crea o actualiza el perfil
  router.put('/', verificarToken, async (req, res) => {
    const alergias = limpiarLista(req.body.alergias);
    const restricciones = limpiarLista(req.body.restricciones_dieta);
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
  
  module.exports = router;