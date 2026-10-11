const express = require('express');
const pool = require('../db');
const verificarToken = require('../middleware/auth');

const router = express.Router();
// POST /api/compras/generar  -> body: { "receta_ids": [1, 2] }
router.post('/generar', verificarToken, async (req, res) => {
    try {
      const { receta_ids, personas } = req.body;
      if (!Array.isArray(receta_ids) || receta_ids.length === 0) {
        return res.status(400).json({ error: 'Debes indicar al menos una receta' });
      }
      const nPersonas = personas ? Number(personas) : null;
      if (nPersonas !== null && (!Number.isFinite(nPersonas) || nPersonas < 1 || nPersonas > 20)) {
        return res.status(400).json({ error: 'personas debe estar entre 1 y 20' });
      }
  
      // cuántas veces aparece cada receta (si se repite en la semana, se cocina varias veces)
      const veces = {};
      receta_ids.forEach((id) => { veces[id] = (veces[id] || 0) + 1; });
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
  
      // total necesario por alimento
      const necesario = {};
      for (const f of filas) {
        const factor = nPersonas ? nPersonas / (f.porciones || 1) : 1;
        const cant = Number(f.cantidad_necesaria) * factor * veces[f.receta_id];
        if (!necesario[f.alimento_id]) {
          necesario[f.alimento_id] = { alimento_id: f.alimento_id, alimento: f.alimento, unidad: f.unidad, cantidad: 0 };
        }
        necesario[f.alimento_id].cantidad += cant;
      }
  
      // stock vigente (no vencido)
      const [stock] = await pool.query(
        `SELECT alimento_id, SUM(cantidad) AS total
         FROM inventario_alimentos
         WHERE usuario_id = ? AND (fecha_vencimiento IS NULL OR fecha_vencimiento >= CURDATE())
         GROUP BY alimento_id`,
        [req.usuario.id]
      );
      const stockPor = {};
      stock.forEach((s) => { stockPor[s.alimento_id] = Number(s.total); });
  
      const items = [];
      for (const n of Object.values(necesario)) {
        let falta = n.cantidad - (stockPor[n.alimento_id] || 0);
        if (falta <= 0.0001) continue;
        falta = n.unidad === 'unidad' ? Math.ceil(falta) : Math.round(falta * 100) / 100;
        items.push({ alimento_id: n.alimento_id, alimento: n.alimento, unidad: n.unidad, cantidad_sugerida: falta });
      }
  
      if (items.length === 0) {
        return res.json({ mensaje: 'Ya tienes todo lo necesario en tu despensa', items: [] });
      }
  
      const [lista] = await pool.query('INSERT INTO listas_compra (usuario_id) VALUES (?)', [req.usuario.id]);
      for (const it of items) {
        await pool.query(
          'INSERT INTO listas_compra_items (lista_id, alimento_id, cantidad_sugerida) VALUES (?, ?, ?)',
          [lista.insertId, it.alimento_id, it.cantidad_sugerida]
        );
      }
      res.status(201).json({ lista_id: lista.insertId, personas: nPersonas, items });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al generar la lista de compras' });
    }
  });
  
  // GET /api/compras  -> tus listas guardadas, con sus ítems
  router.get('/', verificarToken, async (req, res) => {
    try {
      const [filas] = await pool.query(
        `SELECT l.id AS lista_id, l.fecha_generada,
                a.nombre AS alimento, a.unidad_medida AS unidad, i.cantidad_sugerida
         FROM listas_compra l
         JOIN listas_compra_items i ON i.lista_id = l.id
         JOIN alimentos a ON a.id = i.alimento_id
         WHERE l.usuario_id = ?
         ORDER BY l.fecha_generada DESC, l.id DESC`,
        [req.usuario.id]
      );
      res.json(filas);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al consultar las listas' });
    }
  });
  
  module.exports = router;