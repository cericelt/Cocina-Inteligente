require('dotenv').config();
const express = require('express');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const alimentosRoutes = require('./routes/alimentos');
const inventarioRoutes = require('./routes/inventario');
const menusRoutes = require('./routes/menus');
const comprasRoutes = require('./routes/compras');
const { iniciarPurga } = require('./jobs/purga');
const cors = require('cors');
const perfilRoutes = require('./routes/perfil');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/alimentos', alimentosRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/menus', menusRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/perfil', perfilRoutes);

app.get('/', (req, res) => {
  res.send('¡Hola! El servidor de Cocina Inteligente está funcionando.');
});

app.get('/db-test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS alimentos FROM alimentos');
    res.json({ conectado: true, alimentos_en_catalogo: rows[0].alimentos });
  } catch (error) {
    res.status(500).json({ conectado: false, error: error.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log('Servidor escuchando en http://localhost:' + process.env.PORT);
  iniciarPurga();
});