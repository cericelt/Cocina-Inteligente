const pool = require('./db');

// Crea (solo si no existen) las tablas nuevas que usan las funciones agregadas.
// No modifica ni borra ninguna tabla existente ni sus datos.
async function asegurarEsquema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS personas (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      nombre VARCHAR(80) NOT NULL,
      alergias VARCHAR(255) DEFAULT NULL,
      restricciones_dieta VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY usuario_id (usuario_id),
      CONSTRAINT personas_ibfk_1 FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS listas_fijas (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      nombre VARCHAR(100) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY usuario_id (usuario_id),
      CONSTRAINT listas_fijas_ibfk_1 FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS listas_fijas_items (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      lista_id INT NOT NULL,
      alimento_id INT NOT NULL,
      cantidad DECIMAL(10,2) NOT NULL,
      KEY lista_id (lista_id),
      KEY alimento_id (alimento_id),
      CONSTRAINT listas_fijas_items_ibfk_1 FOREIGN KEY (lista_id) REFERENCES listas_fijas (id) ON DELETE CASCADE,
      CONSTRAINT listas_fijas_items_ibfk_2 FOREIGN KEY (alimento_id) REFERENCES alimentos (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS compras_registradas (
      lista_id INT NOT NULL PRIMARY KEY,
      fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT compras_registradas_ibfk_1 FOREIGN KEY (lista_id) REFERENCES listas_compra (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

module.exports = { asegurarEsquema };
