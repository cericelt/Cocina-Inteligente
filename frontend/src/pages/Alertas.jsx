import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function textoDias(d) {
  if (d < 0) return `Venció hace ${Math.abs(d)} ${Math.abs(d) === 1 ? 'día' : 'días'}`;
  if (d === 0) return 'Vence hoy';
  return `Vence en ${d} ${d === 1 ? 'día' : 'días'}`;
}

const grilla = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, padding: 0, margin: '0 0 12px' };

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

  const ordenar = (a, b) => a.dias_para_vencer - b.dias_para_vencer;
  const vencidos = items.filter(i => i.estado === 'vencido').sort(ordenar);
  const porVencer = items.filter(i => i.estado === 'por_vencer').sort(ordenar);

  const cuadro = (i, color, fondo) => (
    <div key={i.id} style={{ background: fondo, border: `1px solid ${color}`, borderTop: `5px solid ${color}`,
                             borderRadius: 8, padding: '10px 12px', fontSize: '0.85rem', lineHeight: 1.35 }}>
      <strong style={{ display: 'block', fontSize: '0.95rem' }}>{i.nombre}</strong>
      <div>{Number(i.cantidad)} {i.unidad_medida}</div>
      <div style={{ color, fontWeight: 'bold', marginTop: 4 }}>{textoDias(i.dias_para_vencer)}</div>
      <div style={{ color: '#555', fontSize: '0.75rem' }}>{String(i.fecha_vencimiento).slice(0, 10).split('-').reverse().join('-')}</div>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', textAlign: 'left', color: '#222' }}>
      <h2 style={{ margin: '0 0 16px' }}>Alertas de vencimiento</h2>

      <h3 style={{ color: '#c0392b', margin: '16px 0 10px' }}>Vencidos ({vencidos.length})</h3>
      {vencidos.length === 0
        ? <p>No tienes alimentos vencidos 👍</p>
        : <div style={grilla}>{vencidos.map(i => cuadro(i, '#c0392b', '#fdecea'))}</div>}
      {vencidos.length > 0 && (
        <p style={{ fontSize: '0.8rem', color: '#666' }}>
          Los alimentos vencidos no se usan en las sugerencias. Elimínalos desde la Despensa.
        </p>
      )}

      <h3 style={{ color: '#e67e22', margin: '24px 0 10px' }}>Por vencer ({porVencer.length})</h3>
      {porVencer.length === 0
        ? <p>No tienes alimentos por vencer pronto.</p>
        : <div style={grilla}>{porVencer.map(i => cuadro(i, '#e67e22', '#fff4e0'))}</div>}
      {porVencer.length > 0 && (
        <p><Link to="/menus">Ver recetas que usan estos alimentos →</Link></p>
      )}
    </div>
  );
}

export default Alertas;
