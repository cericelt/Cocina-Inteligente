import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const tarjeta = (color) => ({
  flex: '1 1 150px', background: '#fff', border: '1px solid #ddd', borderTop: `5px solid ${color}`,
  borderRadius: 8, padding: '12px 16px', textAlign: 'center',
});

function Dashboard() {
  const [inventario, setInventario] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/inventario'), api.get('/menus/sugerencias')])
      .then(([inv, sug]) => {
        setInventario(inv.data);
        setRecetas(sug.data);
      })
      .catch(() => setError('No se pudo cargar el resumen'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando...</p>;
  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;

  const cuenta = (e) => inventario.filter(i => i.estado === e).length;
  const vencidos = cuenta('vencido');
  const porVencer = cuenta('por_vencer');
  const puedeCocinar = recetas.filter(r => r.puede_cocinar).length;
  const urgentes = inventario
    .filter(i => i.estado === 'por_vencer' || i.estado === 'vencido')
    .sort((a, b) => a.dias_para_vencer - b.dias_para_vencer)
    .slice(0, 3);

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto', textAlign: 'left', color: '#222' }}>
      <h2>Resumen de tu cocina</h2>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '12px 0' }}>
        <div style={tarjeta('#27ae60')}>
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>{inventario.length}</div>
          <div>Productos en despensa</div>
        </div>
        <div style={tarjeta('#e67e22')}>
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>{porVencer}</div>
          <div>Por vencer</div>
        </div>
        <div style={tarjeta('#c0392b')}>
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>{vencidos}</div>
          <div>Vencidos</div>
        </div>
        <div style={tarjeta('#7a2422')}>
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>{puedeCocinar}</div>
          <div>Recetas que puedes cocinar hoy</div>
        </div>
      </div>

      {urgentes.length > 0 && (
        <div style={{ margin: '16px 0' }}>
          <h3>Atención</h3>
          <ul>
            {urgentes.map(i => (
              <li key={i.id}>
                <strong>{i.nombre}</strong>{' '}
                {i.dias_para_vencer < 0
                  ? `venció hace ${Math.abs(i.dias_para_vencer)} días`
                  : i.dias_para_vencer === 0 ? 'vence hoy' : `vence en ${i.dias_para_vencer} días`}
              </li>
            ))}
          </ul>
          <Link to="/alertas">Ver todas las alertas →</Link>
        </div>
      )}

      <h3>Accesos rápidos</h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link to="/despensa"><button>➕ Agregar alimentos</button></Link>
        <Link to="/menus"><button>🍽️ Ver menús sugeridos</button></Link>
        <Link to="/semana"><button>📅 Menú semanal</button></Link>
        <Link to="/compras"><button>🛒 Mis listas de compras</button></Link>
      </div>
    </div>
  );
}

export default Dashboard;