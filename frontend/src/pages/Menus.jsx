import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const FILTROS = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: 'desayuno', etiqueta: 'Desayuno' },
  { id: 'almuerzo', etiqueta: 'Almuerzo' },
  { id: 'cena', etiqueta: 'Cena' },
  { id: 'merienda', etiqueta: 'Merienda' },
];
const ETIQUETA = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', cena: 'Cena', merienda: 'Merienda' };

function Menus() {
  const [recetas, setRecetas] = useState([]);
  const [nutricion, setNutricion] = useState({});
  const [filtro, setFiltro] = useState('todas');
  const [personas, setPersonas] = useState(1);
  const [listas, setListas] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/menus/sugerencias'), api.get('/menus/nutricion')])
      .then(([sug, nut]) => {
        setRecetas(sug.data);
        const mapa = {};
        nut.data.forEach(n => { mapa[n.receta_id] = n; });
        setNutricion(mapa);
      })
      .catch(err => {
        console.error(err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setError(`Error: ${err.message}`);
        }
      })
      .finally(() => setCargando(false));
  }, [navigate]);

  async function recargar() {
    const res = await api.get('/menus/sugerencias');
    setRecetas(res.data);
  }

  async function confirmar(receta) {
    const porciones = nutricion[receta.receta_id]?.porciones;
    const detalle = porciones ? ` (receta completa: ${porciones} ${porciones === 1 ? 'porción' : 'porciones'})` : '';
    if (!window.confirm(`¿Cocinar "${receta.nombre}"${detalle}? Se descontarán los ingredientes de tu despensa.`)) return;
    setMensaje('');
    try {
      await api.post('/menus/confirmar', { receta_id: receta.receta_id });
      setMensaje(`Menú confirmado: ${receta.nombre}. Se descontaron los ingredientes de tu despensa.`);
      await recargar();
    } catch (err) {
      setMensaje(err.response?.data?.error || 'No se pudo confirmar el menú');
    }
  }

  async function generarLista(receta) {
    setMensaje('');
    try {
      const res = await api.post('/compras/generar', {
        receta_ids: [receta.receta_id],
        personas: Number(personas) || 1,
      });
      setListas(prev => ({ ...prev, [receta.receta_id]: { ...res.data, personas: Number(personas) || 1 } }));
    } catch (err) {
      setMensaje(err.response?.data?.error || 'No se pudo generar la lista de compras');
    }
  }

  const visibles = recetas.filter(r =>
    filtro === 'todas' || (nutricion[r.receta_id]?.tipos_comida || []).includes(filtro)
  );

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto', textAlign: 'left', color: '#222' }}>
      <h1 style={{ margin: 0 }}>Menús sugeridos</h1>
      <p style={{ marginTop: 4 }}>Primero las recetas que puedes cocinar y usan alimentos por vencer.</p>
      <p style={{ marginTop: 4, fontSize: 14, color: '#555' }}>
        La información nutricional es <strong>por persona (1 porción)</strong>. Los ingredientes de cada receta
        se indican para la <strong>receta completa</strong>, y la lista de compras se calcula para las personas que elijas.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0', alignItems: 'center' }}>
        {FILTROS.map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            style={{ fontWeight: filtro === f.id ? 'bold' : 'normal',
                     background: filtro === f.id ? '#7a2422' : '#f0f0f0',
                     color: filtro === f.id ? '#fff' : '#222' }}>
            {f.etiqueta}
          </button>
        ))}
        <label style={{ marginLeft: 'auto', fontSize: 14 }}>
          👥 Personas para la lista de compras:{' '}
          <input type="number" min="1" max="20" value={personas}
            onChange={e => setPersonas(e.target.value)} style={{ width: 50 }} />
        </label>
      </div>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {mensaje && <p style={{ background: '#eef6ff', padding: 10, borderRadius: 6 }}>{mensaje}</p>}
      {cargando && <p>Cargando...</p>}
      {!cargando && visibles.length === 0 && <p>No hay recetas para este tipo de comida.</p>}

      {visibles.map(r => {
        const lista = listas[r.receta_id];
        const nut = nutricion[r.receta_id];
        return (
          <div key={r.receta_id} style={{
            border: '1px solid #ddd',
            borderLeft: `6px solid ${r.puede_cocinar ? '#27ae60' : '#b0b7c0'}`,
            borderRadius: 6, padding: '12px 16px', marginBottom: 14, background: '#fff',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <strong style={{ fontSize: 18 }}>{r.nombre}</strong>
              <span style={{ fontSize: 14 }}>{r.tiempo_preparacion} min</span>
            </div>

            {nut && nut.tipos_comida.length > 0 && (
              <div style={{ margin: '6px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {nut.tipos_comida.map(t => (
                  <span key={t} style={{ fontSize: 12, background: '#f1e4e4', color: '#7a2422',
                                         padding: '2px 8px', borderRadius: 10 }}>
                    {ETIQUETA[t] || t}
                  </span>
                ))}
              </div>
            )}

            {nut && (
              <div style={{ fontSize: 14, margin: '6px 0' }}>
                <strong>≈ {nut.por_porcion.kcal} kcal</strong> por persona ·
                Prot. {nut.por_porcion.proteinas_g} g ·
                Carb. {nut.por_porcion.carbohidratos_g} g ·
                Grasas {nut.por_porcion.grasas_g} g
                <span style={{ color: '#666' }}> (por porción; la receta rinde {nut.porciones} {nut.porciones === 1 ? 'porción' : 'porciones'})</span>
              </div>
            )}

            <div style={{ background: '#e6e6e6', borderRadius: 4, height: 8, margin: '8px 0' }}>
              <div style={{
                width: `${r.cobertura}%`, height: 8, borderRadius: 4,
                background: r.puede_cocinar ? '#27ae60' : '#e67e22',
              }} />
            </div>
            <div style={{ fontSize: 14 }}>
              Tienes el <strong>{r.cobertura}%</strong> de los ingredientes
              {r.puede_cocinar && ' · Puedes cocinarla ahora'}
            </div>

            {r.ingredientes_por_vencer.length > 0 && (
              <div style={{ fontSize: 14, marginTop: 6, color: '#b35a00' }}>
                Usa alimentos por vencer: <strong>{r.ingredientes_por_vencer.join(', ')}</strong>
              </div>
            )}

            <p style={{ fontSize: 14, margin: '8px 0' }}>{r.instrucciones}</p>

            {r.faltantes.length > 0 && (
              <div style={{ fontSize: 14 }}>
                Te falta{nut ? ` (para la receta completa, ${nut.porciones} ${nut.porciones === 1 ? 'porción' : 'porciones'})` : ''}:{' '}
                {r.faltantes.map(f => `${Number(f.falta)} ${f.unidad} de ${f.alimento}`).join(' · ')}
              </div>
            )}

            <div style={{ marginTop: 10 }}>
              {r.puede_cocinar
                ? <button onClick={() => confirmar(r)}>
                    Cocinar esta receta{nut ? ` (${nut.porciones} ${nut.porciones === 1 ? 'porción' : 'porciones'})` : ''}
                  </button>
                : <button onClick={() => generarLista(r)}>
                    Generar lista de compras para {Number(personas) || 1} {(Number(personas) || 1) === 1 ? 'persona' : 'personas'}
                  </button>}
            </div>

            {lista && (
              <div style={{ marginTop: 10, background: '#f4f4f4', padding: 10, borderRadius: 6, fontSize: 14 }}>
                <strong>
                  Lista de compras guardada (para {lista.personas} {lista.personas === 1 ? 'persona' : 'personas'})
                </strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                  {(lista.items || []).map((i, idx) => (
                    <li key={idx}>{Number(i.cantidad_sugerida)} {i.unidad} de {i.alimento}</li>
                  ))}
                </ul>
                {(lista.items || []).length === 0 && <span>Ya tienes todo lo necesario.</span>}
              </div>
            )}
          </div>
        );
      })}

      <p style={{ fontSize: 12, color: '#666' }}>
        Valores nutricionales aproximados y por persona (1 porción), calculados con una tabla interna (sin API externa).
      </p>
    </div>
  );
}

export default Menus;