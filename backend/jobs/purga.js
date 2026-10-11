const pool = require('../db');

const DIAS_RETENCION = 60;

async function purgarHistorial() {
  try {
    const [menus] = await pool.query(
      'DELETE FROM menus WHERE created_at < NOW() - INTERVAL ? DAY',
      [DIAS_RETENCION]
    );
    const [listas] = await pool.query(
      'DELETE FROM listas_compra WHERE fecha_generada < NOW() - INTERVAL ? DAY',
      [DIAS_RETENCION]
    );
    console.log(`Purga: ${menus.affectedRows} menús y ${listas.affectedRows} listas eliminados`);
  } catch (err) {
    console.error('Error en la purga:', err);
  }
}

function iniciarPurga() {
  purgarHistorial(); // una vez al encender el servidor
  setInterval(purgarHistorial, 24 * 60 * 60 * 1000); // y luego cada 24 horas
}

module.exports = { iniciarPurga };