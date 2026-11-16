# Cocina Inteligente

Aplicación web para planificar la alimentación del hogar a partir de lo que hay en la despensa. Registra los alimentos con su fecha de vencimiento, avisa cuáles están por vencer, sugiere menús que aprovechan esos alimentos, arma la semana y genera la lista de compras con lo que falta.

Proyecto de título — Carolina Lorenzo.

## Funcionalidades

- **Cuentas de usuario:** registro e inicio de sesión con contraseña cifrada (bcrypt) y token JWT.
- **Despensa:** alimentos con cantidad, unidad y fecha de vencimiento. Cada uno queda marcado como vigente, por vencer (3 días o menos) o vencido.
- **Alertas:** listado de los alimentos vencidos o por vencer.
- **Catálogo de alimentos:** base de referencia con categoría y valores nutricionales por 100 g o 100 ml (kcal, proteínas, carbohidratos y grasas).
- **Recetas:** creación de recetas con ingredientes, porciones, tiempo de preparación y tipo de comida.
- **Menús sugeridos:** prioriza las recetas que se pueden cocinar con lo que hay y las que usan alimentos por vencer. Considera las alergias y restricciones de dieta de cada persona del hogar.
- **Menú semanal:** desayuno, almuerzo y cena de lunes a viernes, sin repetir una receta el mismo día.
- **Información nutricional** de los menús.
- **Lista de compras:** calcula lo que falta para las recetas elegidas, permite desmarcar productos y, al comprar, agrega a la despensa lo que realmente se compró. Incluye listas fijas reutilizables.
- **Perfil:** datos de las personas del hogar y quiénes comen cada día.
- **Exportación a Excel** (.xlsx).
- **Limpieza automática:** los menús y listas de compra con más de 60 días se eliminan una vez al día.

## Tecnologías

| Parte | Tecnologías |
|---|---|
| Frontend | React 19, Vite, React Router, Axios |
| Backend | Node.js, Express 5, mysql2, bcryptjs, jsonwebtoken, dotenv, cors |
| Base de datos | MySQL |

## Estructura

```
Cocina-Inteligente/
├── backend/
│   ├── server.js          # Servidor Express y registro de rutas
│   ├── db.js              # Conexión a MySQL
│   ├── esquema.js         # Crea las tablas nuevas si no existen
│   ├── middleware/auth.js # Verificación del token JWT
│   ├── routes/            # auth, alimentos, inventario, recetas, menus, compras, perfil
│   ├── jobs/purga.js      # Limpieza diaria del historial
│   └── data/              # Catálogo de alimentos de referencia
└── frontend/
    └── src/
        ├── pages/         # Inicio, Despensa, Agregar, Alertas, Menús, Semana, Compras, Perfil, Login
        ├── api.js         # Cliente HTTP hacia el backend
        └── excel.js       # Exportación a .xlsx
```

## Cómo ejecutarlo

### Requisitos

- Node.js y npm
- MySQL Server (y opcionalmente MySQL Workbench)

### 1. Base de datos

1. Crea la base de datos:
   ```sql
   CREATE DATABASE cocina_inteligente;
   ```
2. Ejecuta el script `schema.sql` sobre esa base para crear las tablas y cargar los datos iniciales del catálogo.
3. Al iniciar, el servidor crea solo las tablas adicionales que falten (`esquema.js`). No modifica ni borra datos existentes.

### 2. Backend

```bash
cd backend
npm install
```

Crea un archivo `backend/.env` con estos valores (este archivo no se sube al repositorio):

```
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=cocina_inteligente
JWT_SECRET=una_clave_larga_y_secreta
JWT_EXPIRES_IN=7d
```

Inicia el servidor:

```bash
node server.js
```

Para comprobar que funciona, abre http://localhost:4000/db-test. Debería responder `"conectado": true`.

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173, crea una cuenta y comienza agregando alimentos a la despensa.

## API

Todas las rutas, salvo registro e inicio de sesión, requieren el encabezado `Authorization: Bearer <token>`.

| Ruta base | Uso |
|---|---|
| `/api/auth` | Registro, inicio de sesión y usuario actual |
| `/api/alimentos` | Catálogo de alimentos y categorías |
| `/api/inventario` | Despensa y alertas de vencimiento |
| `/api/recetas` | Creación de recetas |
| `/api/menus` | Sugerencias, confirmación de menús e información nutricional |
| `/api/compras` | Listas de compras, listas fijas y registro de lo comprado |
| `/api/perfil` | Perfil y personas del hogar |

## Entorno de prueba

Desarrollado y probado en MacBook Air M1 (macOS Big Sur) con Google Chrome. No se ha probado en otros navegadores.
