import { useEffect, useState } from 'react';
import api from '../api';

export default function Compras() {
  const [listas, setListas] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/compras')
      .then((res) => {
        // el backend devuelve filas planas: se agrupan por lista_id
        const grupos = {};
        res.data.forEach((f) => {
          if (!grupos[f.lista_id]) {
            grupos[f.lista_id] = { lista_id: f.lista_id, fecha: f.fecha_generada, items: [] };
          }
          grupos[f.lista_id].items.push(f);
        });
        // la más reciente primero
        setListas(Object.values(grupos).sort((a, b) => b.lista_id - a.lista_id));
      })
      .catch(() => setError('No se pudieron cargar las listas de compras'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando...</p>;
  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;

  return (
    <div>
      <h2>Mis listas de compras</h2>
      {listas.length === 0 && (
        <p>Aún no tienes listas. Genera una desde el Menú semanal o desde Menús.</p>
      )}
      {listas.map((l) => (
        <div key={l.lista_id} style={{ border: '1px solid #ddd', padding: 12, margin: '12px 0', textAlign: 'left' }}>
          <b>Lista #{l.lista_id}</b>{' '}
          <small>{new Date(l.fecha).toLocaleString('es-CL')}</small>
          <ul>
            {l.items.map((it, i) => (
              <li key={i}>
                {it.alimento}: {it.cantidad_sugerida} {it.unidad}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}