import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function textoDias(d) {
  if (d < 0) return `Venció hace ${Math.abs(d)} ${Math.abs(d) === 1 ? 'día' : 'días'}`;
  if (d === 0) return 'Vence hoy';
  return `Vence en ${d} ${d === 1 ? 'día' : 'días'}`;
}

function Alertas() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/inventario')
      .then(res => setItems(res.data))
      .catch(() => setError('No se pudieron cargar las alertas'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando...</p>;
  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;

  const vencidos = items.filter(i => i.estado === 'vencido')
    .sort((a, b) => a.dias_para_vencer - b.dias_para_vencer);
  const porVencer = items.filter(i => i.estado === 'por_vencer')
    .sort((a, b) => a.dias_para_vencer - b.dias_para_vencer);

  const fila = (i, color) => (
    <li key={i.id} style={{ borderLeft: `6px solid ${color}`, background: '#fff', border: '1px solid #ddd',
                            borderLeftWidth: 6, borderLeftColor: color, borderRadius: 6,
                            padding: '8px 12px', marginBottom: 8, listStyle: 'none' }}>
      <strong>{i.nombre}</strong> · {Number(i.cantidad)} {i.unidad_medida}
      <div style={{ fontSize: 14, color: '#555' }}>
        {textoDias(i.dias_para_vencer)} ({String(i.fecha_vencimiento).slice(0, 10)})
      </div>
    </li>
  );

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto', textAlign: 'left', color: '#222' }}>
      <h2>Alertas de vencimiento</h2>

      <h3 style={{ color: '#c0392b' }}>Vencidos ({vencidos.length})</h3>
      {vencidos.length === 0
        ? <p>No tienes alimentos vencidos 👍</p>
        : <ul style={{ padding: 0 }}>{vencidos.map(i => fila(i, '#c0392b'))}</ul>}
      {vencidos.length > 0 && (
        <p style={{ fontSize: 13, color: '#666' }}>
          Los alimentos vencidos no se usan en las sugerencias. Elimínalos desde la Despensa.
        </p>
      )}

      <h3 style={{ color: '#e67e22' }}>Por vencer ({porVencer.length})</h3>
      {porVencer.length === 0
        ? <p>No tienes alimentos por vencer pronto.</p>
        : <ul style={{ padding: 0 }}>{porVencer.map(i => fila(i, '#e67e22'))}</ul>}
      {porVencer.length > 0 && (
        <p><Link to="/menus">Ver recetas que usan estos alimentos →</Link></p>
      )}
    </div>
  );
}

export default Alertas;