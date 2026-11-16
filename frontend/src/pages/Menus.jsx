import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useComensales, textoDias } from '../comensales';

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
  const [soloVencer, setSoloVencer] = useState(false);
  const [personas, setPersonas] = useState(null); // null = usar los comensales de hoy
  const [seleccion, setSeleccion] = useState([]);
  const [noComprar, setNoComprar] = useState([]); // alimentos desmarcados en la lista
  const [vista, setVista] = useState({ items: [], cargando: false, error: '' });
  const [mensaje, setMensaje] = useState('');
  const [abiertas, setAbiertas] = useState([]); // recetas con el detalle desplegado
  const [listaGuardada, setListaGuardada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const com = useComensales();

  const nPersonas = personas === null ? com.total : Math.max(1, Math.min(20, Number(personas) || 1));
  const clave = JSON.stringify(com.params);

  function manejarError(err) {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      navigate('/login');
    } else {
      setError(`Error: ${err.response?.data?.error || err.message}`);
    }
  }

  useEffect(() => {
    if (!com.listo) return;
    setCargando(true);
    Promise.all([api.get('/menus/sugerencias', { params: com.params }), api.get('/menus/nutricion')])
      .then(([sug, nut]) => {
        setRecetas(sug.data);
        const mapa = {};
        nut.data.forEach(n => { mapa[n.receta_id] = n; });
        setNutricion(mapa);
        setSeleccion(prev => prev.filter(id => sug.data.some(r => r.receta_id === id)));
      })
      .catch(manejarError)
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [com.listo, clave]);

  // Previsualización: se recalcula sola al marcar recetas o cambiar el número de personas
  useEffect(() => {
    if (seleccion.length === 0) { setVista({ items: [], cargando: false, error: '' }); return undefined; }
    setVista(v => ({ ...v, cargando: true, error: '' }));
    const t = setTimeout(() => {
      api.post('/compras/previsualizar', { receta_ids: seleccion, personas: nPersonas })
        .then(res => setVista({ items: res.data.items, cargando: false, error: '' }))
        .catch(err => setVista({ items: [], cargando: false, error: err.response?.data?.error || (err.response?.status === 404 ? 'El servidor no tiene la función de previsualización: reinicia el backend (node server.js).' : `No se pudo calcular la lista (${err.message})`) }));
    }, 300);
    return () => clearTimeout(t);
  }, [seleccion, nPersonas]);

  async function recargar() {
    const res = await api.get('/menus/sugerencias', { params: com.params });
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

  function alternarAbierta(id) {
    setAbiertas(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  function alternar(id) {
    setListaGuardada(null);
    setSeleccion(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  async function comprar() {
    setMensaje('');
    try {
      const res = await api.post('/compras/generar', { receta_ids: seleccion, personas: nPersonas, excluir: noComprar });
      setListaGuardada(res.data);
      if (res.data.lista_id) setSeleccion([]);
    } catch (err) {
      setMensaje(err.response?.data?.error || 'No se pudo generar la lista de compras');
    }
  }

  const deTipo = (r, f) => f === 'todas' || (nutricion[r.receta_id]?.tipos_comida || []).includes(f);
  const usaVencer = (r) => r.ingredientes_por_vencer.length > 0;
  const visibles = recetas.filter(r => deTipo(r, filtro) && (!soloVencer || usaVencer(r)));

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', textAlign: 'left', color: '#222' }}>
      <h1 style={{ margin: '0 0 16px', lineHeight: 1.2, fontSize: '1.9rem' }}>Menús sugeridos</h1>
      <p style={{ margin: '0 0 8px' }}>Primero las recetas que usan alimentos por vencer; luego las que puedes cocinar ahora.</p>
      <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#555' }}>
        Comen hoy: <strong>{com.nombres.join(', ') || 'nadie seleccionado'}</strong>{' '}
        (<Link to="/perfil">cambiar quiénes comen y sus restricciones</Link>)
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '0 0 16px' }}>
        {FILTROS.map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            style={{ padding: '6px 14px', borderRadius: 16, border: '1px solid #bbb',
                     background: filtro === f.id ? '#2f6b4f' : '#fff',
                     color: filtro === f.id ? '#fff' : '#222' }}>
            {f.etiqueta}
          </button>
        ))}
      </div>

      <div style={{ margin: '0 0 16px' }}>
        <button onClick={() => setSoloVencer(v => !v)} aria-pressed={soloVencer}
          style={{ padding: '6px 14px', borderRadius: 16, border: '1px solid #b35a00',
                   background: soloVencer ? '#b35a00' : '#fff', color: soloVencer ? '#fff' : '#b35a00' }}>
          {soloVencer ? '✓ ' : ''}Solo recetas con alimentos por vencer
        </button>
        {soloVencer && <small style={{ marginLeft: 10, color: '#555' }}>Se ocultan las que no usan alimentos por vencer (en cualquier tipo de comida).</small>}
      </div>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {mensaje && <p style={{ background: '#eef6ff', padding: 10, borderRadius: 6 }}>{mensaje}</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: '999 1 560px', minWidth: 0 }}>
          <div style={{ background: '#eef4f0', padding: 12, borderRadius: 6, margin: '0 0 16px', fontSize: '0.85rem' }}>
            <strong>Armar una lista de compras:</strong> marca la casilla de las recetas que quieres cocinar.
            A la derecha verás qué te falta comprar, y desde ahí generas la lista.{' '}
            <button onClick={() => setSeleccion([])} disabled={seleccion.length === 0}>Desmarcar todas</button>
          </div>

          {cargando && <p>Cargando...</p>}
          {!cargando && visibles.length === 0 && <p>{soloVencer ? 'Ninguna receta de este tipo usa alimentos por vencer ahora.' : 'No hay recetas para este tipo de comida con las restricciones elegidas.'}</p>}

          <div className="rejilla" style={{ alignItems: 'stretch' }}>
          {visibles.map(r => {
            const nut = nutricion[r.receta_id];
            const marcada = seleccion.includes(r.receta_id);
            const abierta = abiertas.includes(r.receta_id);
            const textoVencer = r.ingredientes_por_vencer.length > 0
              ? (r.ingredientes_por_vencer_detalle || r.ingredientes_por_vencer.map(a => ({ alimento: a })))
                  .map(d => (d.dias === undefined ? d.alimento : `${d.alimento} (${textoDias(d.dias)})`)).join(', ')
              : '';
            return (
              <div key={r.receta_id} className={abierta ? 'ancho' : ''} style={{
                border: marcada ? '2px solid #2f6b4f' : '1px solid #ddd',
                borderLeft: `6px solid ${r.puede_cocinar ? '#3d8b63' : '#b0b7c0'}`,
                borderRadius: 10, padding: '12px 14px', background: '#fff',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', minWidth: 0 }}
                    title="Marca la casilla para incluir esta receta en la lista de compras">
                    <input type="checkbox" checked={marcada} onChange={() => alternar(r.receta_id)} />
                    <strong style={{ fontSize: '1rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis',
                                     whiteSpace: abierta ? 'normal' : 'nowrap' }}>{r.nombre}</strong>
                  </label>
                  <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{r.tiempo_preparacion} min</span>
                </div>

                <div style={{ margin: '8px 0 4px', display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 22 }}>
                  {nut && nut.tipos_comida.map(t => (
                    <span key={t} style={{ fontSize: '0.7rem', background: '#e3efe8', color: '#2f6b4f',
                                           padding: '2px 8px', borderRadius: 10 }}>
                      {ETIQUETA[t] || t}
                    </span>
                  ))}
                </div>

                <div style={{ fontSize: '0.85rem', margin: '4px 0' }}>
                  {nut ? <><strong>≈ {nut.por_porcion.kcal} kcal</strong> por persona</> : '\u00a0'}
                </div>

                <div style={{ background: '#e6e6e6', borderRadius: 4, height: 8, margin: '6px 0' }}>
                  <div style={{ width: `${r.cobertura}%`, height: 8, borderRadius: 4, background: r.puede_cocinar ? '#3d8b63' : '#e67e22' }} />
                </div>
                <div style={{ fontSize: '0.8rem' }}>
                  Tienes el <strong>{r.cobertura}%</strong> de los ingredientes
                  {r.puede_cocinar && ' · Puedes cocinarla ahora'}
                </div>

                <div style={{ fontSize: '0.8rem', marginTop: 6, color: '#b35a00', minHeight: '1.3em',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: abierta ? 'normal' : 'nowrap' }}
                  title={textoVencer ? `Usa alimentos por vencer: ${textoVencer}` : undefined}>
                  {textoVencer && <>⏰ <strong>{textoVencer}</strong></>}
                </div>

                {abierta && (
                  <div style={{ borderTop: '1px solid #eee', marginTop: 10, paddingTop: 8 }}>
                    {nut && (
                      <div style={{ fontSize: '0.8rem', margin: '0 0 6px' }}>
                        Prot. {nut.por_porcion.proteinas_g} g · Carb. {nut.por_porcion.carbohidratos_g} g · Grasas {nut.por_porcion.grasas_g} g por persona
                        <span style={{ color: '#666' }}> (la receta rinde {nut.porciones} {nut.porciones === 1 ? 'porción' : 'porciones'})</span>
                      </div>
                    )}
                    <p style={{ fontSize: '0.85rem', margin: '8px 0' }}>{r.instrucciones}</p>
                    {r.faltantes.length > 0 && (
                      <div style={{ fontSize: '0.8rem' }}>
                        Te falta{nut ? ` (para la receta completa, ${nut.porciones} ${nut.porciones === 1 ? 'porción' : 'porciones'})` : ''}:{' '}
                        {r.faltantes.map(f => `${Number(f.falta)} ${f.unidad} de ${f.alimento}`).join(' · ')}
                      </div>
                    )}
                    {r.puede_cocinar && (
                      <div style={{ marginTop: 10 }}>
                        <button onClick={() => confirmar(r)}>
                          Cocinar esta receta{nut ? ` (${nut.porciones} ${nut.porciones === 1 ? 'porción' : 'porciones'})` : ''}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <button onClick={() => alternarAbierta(r.receta_id)} style={{ padding: '2px 12px', fontSize: '0.8rem' }}>
                    {abierta ? 'Ver menos ▲' : 'Ver más ▼'}
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        <aside style={{ flex: '1 1 300px', minWidth: 0, position: 'sticky', top: 12, background: '#fff',
                        border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>Lista de compras (previsualización)</h2>
          <label style={{ display: 'block', fontSize: '0.85rem', margin: '0 0 12px' }}>
            Personas:{' '}
            <input type="number" min="1" max="20" value={personas === null ? com.total : personas}
              onChange={e => setPersonas(e.target.value)} style={{ width: 56 }} />
          </label>

          {seleccion.length === 0 && !listaGuardada && (
            <p style={{ fontSize: '0.85rem', color: '#666' }}>Marca recetas para ver aquí lo que tendrías que comprar.</p>
          )}
          {seleccion.length > 0 && (
            <>
              <p style={{ fontSize: '0.85rem', margin: '0 0 8px' }}>
                {seleccion.length} {seleccion.length === 1 ? 'receta marcada' : 'recetas marcadas'} · para {nPersonas} {nPersonas === 1 ? 'persona' : 'personas'}
              </p>
              {vista.error && <p style={{ color: 'crimson', fontSize: '0.85rem' }}>{vista.error}</p>}
              {vista.cargando && <p style={{ fontSize: '0.85rem' }}>Calculando...</p>}
              {!vista.cargando && !vista.error && (vista.items.length === 0
                ? <p style={{ fontSize: '0.85rem' }}>Ya tienes todo lo necesario en tu despensa.</p>
                : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: '#666' }}>
                        <th></th><th>Comprar</th><th>Necesitas</th><th>Tienes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vista.items.map(i => (
                        <tr key={i.alimento_id} style={{ borderTop: '1px solid #eee', opacity: noComprar.includes(i.alimento_id) ? 0.45 : 1 }}>
                          <td><input type="checkbox" aria-label={`Comprar ${i.alimento}`} checked={!noComprar.includes(i.alimento_id)}
                            onChange={() => setNoComprar(p => (p.includes(i.alimento_id) ? p.filter(x => x !== i.alimento_id) : [...p, i.alimento_id]))} /></td>
                          <td style={{ padding: '4px 0' }}><strong>{i.cantidad_sugerida} {i.unidad}</strong> {i.alimento}</td>
                          <td>{i.necesario} {i.unidad}</td>
                          <td>{i.en_despensa} {i.unidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ))}
              {vista.items.length > 0 && (
                <p style={{ fontSize: '0.75rem', color: '#666', margin: '8px 0 0' }}>
                  Tickea lo que vas a comprar; lo que desmarques no entra en la lista.
                </p>
              )}
              <div style={{ marginTop: 12 }}>
                <button onClick={comprar} disabled={vista.cargando || vista.items.length === 0 || vista.items.every(i => noComprar.includes(i.alimento_id))}>
                  🛒 Comprar: generar la lista ({vista.items.filter(i => !noComprar.includes(i.alimento_id)).length})
                </button>
              </div>
            </>
          )}

          {listaGuardada && (
            <div style={{ marginTop: 12, background: '#e8f6ec', padding: 10, borderRadius: 6, fontSize: '0.85rem' }}>
              {listaGuardada.lista_id
                ? <>Lista #{listaGuardada.lista_id} generada. <Link to="/compras">Verla en Compras →</Link></>
                : listaGuardada.mensaje}
            </div>
          )}
        </aside>
      </div>

      <p style={{ fontSize: '0.7rem', color: '#666' }}>
        Valores nutricionales aproximados y por persona (1 porción), calculados con una tabla interna (sin API externa).
      </p>
    </div>
  );
}

export default Menus;
