import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useComensales, textoDias } from '../comensales';

const COMIDAS = ['desayuno', 'almuerzo', 'cena'];
const NOMBRE_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MAX_DIAS = 14;
const num = (v) => Number(v) || 0;

function aTexto(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function aFecha(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, m - 1, d);
}
function sumarDias(texto, n) {
  const d = aFecha(texto);
  d.setDate(d.getDate() + n);
  return aTexto(d);
}
function listarDias(desde, hasta) {
  if (!desde || !hasta) return [];
  const ini = aFecha(desde);
  const fin = aFecha(hasta);
  const dias = [];
  for (let d = new Date(ini); d <= fin && dias.length < MAX_DIAS; d.setDate(d.getDate() + 1)) dias.push(aTexto(d));
  return dias;
}
function etiquetaDia(texto) {
  const d = aFecha(texto);
  return `${NOMBRE_DIA[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Arma el menú: prioriza alimentos por vencer, pero rota las recetas para que no se repitan siempre las mismas
function armarPlan(recetas, dias) {
  const usos = {};
  const ayer = {};
  return dias.map((fecha) => {
    const hoy = new Set();
    const comidas = {};
    for (const tipo of COMIDAS) {
      const candidatas = recetas
        .filter((r) => r.tipos_comida.includes(tipo) && !hoy.has(r.receta_id))
        .map((r) => ({
          r,
          score:
            (r.ingredientes_por_vencer.length > 0 ? 2000 : 0) +
            r.ingredientes_por_vencer.length * 100 +
            (r.puede_cocinar ? 1000 : 0) +
            num(r.cobertura) -
            (usos[r.receta_id] || 0) * 1800 -
            (ayer[tipo] === r.receta_id ? 800 : 0) +
            Math.random() * 400,
        }))
        .sort((a, b) => b.score - a.score);
      const elegida = candidatas.length ? candidatas[0].r.receta_id : null;
      comidas[tipo] = elegida;
      if (elegida) {
        hoy.add(elegida);
        usos[elegida] = (usos[elegida] || 0) + 1;
      }
      ayer[tipo] = elegida;
    }
    return { fecha, comidas };
  });
}

function totalDia(comidas, porId) {
  const t = { kcal: 0, proteinas_g: 0, carbohidratos_g: 0, grasas_g: 0 };
  Object.values(comidas).forEach((id) => {
    const r = id && porId[id];
    if (!r) return;
    t.kcal += num(r.por_porcion.kcal);
    t.proteinas_g += num(r.por_porcion.proteinas_g);
    t.carbohidratos_g += num(r.por_porcion.carbohidratos_g);
    t.grasas_g += num(r.por_porcion.grasas_g);
  });
  return t;
}

export default function Semana() {
  const hoyTexto = aTexto(new Date());
  const [desde, setDesde] = useState(hoyTexto);
  const [hasta, setHasta] = useState(sumarDias(hoyTexto, 6));
  const [recetas, setRecetas] = useState([]);
  const [plan, setPlan] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [personas, setPersonas] = useState(null);
  const [noComprar, setNoComprar] = useState([]);
  const [sinCompra, setSinCompra] = useState([]); // comidas (fecha|tipo) que no se incluyen en la lista
  const [vista, setVista] = useState({ items: [], cargando: false, error: '' });
  const [guardada, setGuardada] = useState(null);
  const com = useComensales();

  const nPersonas = personas === null ? com.total : Math.max(1, Math.min(20, Number(personas) || 1));
  const dias = useMemo(() => listarDias(desde, hasta), [desde, hasta]);
  const rangoInvalido = desde && hasta && aFecha(hasta) < aFecha(desde);
  const demasiados = desde && hasta && !rangoInvalido && Math.round((aFecha(hasta) - aFecha(desde)) / 86400000) + 1 > MAX_DIAS;
  const porId = useMemo(() => {
    const m = {};
    recetas.forEach((r) => { m[r.receta_id] = r; });
    return m;
  }, [recetas]);
  const clave = JSON.stringify(com.params);

  useEffect(() => {
    if (!com.listo) return;
    setCargando(true);
    Promise.all([api.get('/menus/sugerencias', { params: com.params }), api.get('/menus/nutricion')])
      .then(([sug, nut]) => {
        const listaSug = Array.isArray(sug.data) ? sug.data : sug.data.sugerencias || [];
        const listaNut = Array.isArray(nut.data) ? nut.data : nut.data.recetas || [];
        const nutPorId = {};
        listaNut.forEach((n) => (nutPorId[n.receta_id] = n));
        setRecetas(
          listaSug
            .filter((s) => nutPorId[s.receta_id])
            .map((s) => ({
              ...s,
              ingredientes_por_vencer: s.ingredientes_por_vencer || [],
              tipos_comida: nutPorId[s.receta_id].tipos_comida || [],
              por_porcion: nutPorId[s.receta_id].por_porcion,
            }))
        );
      })
      .catch(() => setError('No se pudo cargar el menú semanal'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [com.listo, clave]);

  // El menú se arma al cargar las recetas y cada vez que cambia el rango de fechas
  useEffect(() => {
    if (recetas.length === 0 || dias.length === 0) { setPlan([]); return; }
    setPlan(armarPlan(recetas, dias));
    setGuardada(null);
  }, [recetas, dias]);

  const todos = plan.flatMap((d) =>
    Object.entries(d.comidas).filter(([c, id]) => id && !sinCompra.includes(`${d.fecha}|${c}`)).map(([, id]) => id)
  );
  const alternarCompra = (fecha, c) => setSinCompra((p) => (p.includes(`${fecha}|${c}`) ? p.filter((x) => x !== `${fecha}|${c}`) : [...p, `${fecha}|${c}`]));
  const claveIds = todos.join(',');

  // Previsualización de la lista de compras del menú
  useEffect(() => {
    if (todos.length === 0) { setVista({ items: [], cargando: false, error: '' }); return undefined; }
    setVista((v) => ({ ...v, cargando: true, error: '' }));
    const t = setTimeout(() => {
      api.post('/compras/previsualizar', { receta_ids: todos, personas: nPersonas })
        .then((res) => setVista({ items: res.data.items, cargando: false, error: '' }))
        .catch((err) => setVista({ items: [], cargando: false, error: err.response?.data?.error || (err.response?.status === 404 ? 'El servidor no tiene la función de previsualización: reinicia el backend (node server.js).' : `No se pudo calcular la lista (${err.message})`) }));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveIds, nPersonas]);

  function cambiarReceta(indice, tipo, valor) {
    setGuardada(null);
    setPlan((p) => p.map((d, i) => (i === indice ? { ...d, comidas: { ...d.comidas, [tipo]: valor ? Number(valor) : null } } : d)));
  }

  function otraAlAzar(indice, tipo) {
    const actual = plan[indice].comidas[tipo];
    const delDia = new Set(Object.values(plan[indice].comidas).filter(Boolean));
    const opciones = recetas.filter((r) => r.tipos_comida.includes(tipo) && r.receta_id !== actual && !delDia.has(r.receta_id));
    if (opciones.length === 0) return;
    cambiarReceta(indice, tipo, opciones[Math.floor(Math.random() * opciones.length)].receta_id);
  }

  async function comprar() {
    setError('');
    try {
      const res = await api.post('/compras/generar', { receta_ids: todos, personas: nPersonas, excluir: noComprar });
      setGuardada(res.data);
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo generar la lista de compras');
    }
  }

  if (cargando) return <p>Cargando...</p>;

  const totales = plan.map((d) => totalDia(d.comidas, porId));
  const totalSemana = totales.reduce(
    (a, t) => ({ kcal: a.kcal + t.kcal, proteinas_g: a.proteinas_g + t.proteinas_g, carbohidratos_g: a.carbohidratos_g + t.carbohidratos_g, grasas_g: a.grasas_g + t.grasas_g }),
    { kcal: 0, proteinas_g: 0, carbohidratos_g: 0, grasas_g: 0 }
  );
  const celda = { border: '1px solid #ddd', padding: '8px', verticalAlign: 'top' };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', textAlign: 'left', color: '#222' }}>
      <h2 style={{ margin: '0 0 12px' }}>Menú semanal · por persona</h2>
      <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#555' }}>
        Comen: <strong>{com.nombres.join(', ') || 'nadie seleccionado'}</strong>{' '}
        (<Link to="/perfil">cambiar</Link>)
      </p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', background: '#eef4f0', padding: 12, borderRadius: 6 }}>
        <label>Desde<br />
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label>Hasta<br />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <label>👥 Personas (para la compra)<br />
          <input type="number" min="1" max="20" value={personas === null ? com.total : personas}
            onChange={(e) => setPersonas(e.target.value)} style={{ width: 60 }} />
        </label>
        <button onClick={() => { setPlan(armarPlan(recetas, dias)); setGuardada(null); }} disabled={dias.length === 0}>
          🔄 Regenerar menú
        </button>
      </div>
      {rangoInvalido && <p style={{ color: 'crimson' }}>La fecha "hasta" no puede ser anterior a "desde".</p>}
      {demasiados && <p style={{ color: '#b35a00' }}>Se muestran como máximo {MAX_DIAS} días.</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
          <thead>
            <tr style={{ background: '#eef4f0' }}>
              <th style={celda}>Día</th>
              {COMIDAS.map((c) => <th key={c} style={{ ...celda, textTransform: 'capitalize' }}>{c}</th>)}
              <th style={celda}>Total del día (por persona)</th>
            </tr>
          </thead>
          <tbody>
            {plan.map((d, i) => (
              <tr key={d.fecha}>
                <td style={celda}><b>{etiquetaDia(d.fecha)}</b></td>
                {COMIDAS.map((c) => {
                  const r = d.comidas[c] ? porId[d.comidas[c]] : null;
                  const opciones = recetas.filter((x) => x.tipos_comida.includes(c));
                  return (
                    <td key={c} style={celda}>
                      {r ? (
                        <>
                          <div>{r.nombre}</div>
                          <small>{Math.round(num(r.por_porcion.kcal))} kcal por persona</small>
                          {r.ingredientes_por_vencer.length > 0 && (
                            <div style={{ color: '#b35a00' }}>
                              <small>⏰ usa: {(r.ingredientes_por_vencer_detalle || []).length > 0
                                ? r.ingredientes_por_vencer_detalle.map((x) => `${x.alimento} (${textoDias(x.dias)})`).join(', ')
                                : r.ingredientes_por_vencer.join(', ')}</small>
                            </div>
                          )}
                          {!r.puede_cocinar && <div><small>🛒 faltan ingredientes</small></div>}
                        </>
                      ) : <small>Sin receta de este tipo</small>}
                      {r && (
                        <label style={{ display: 'block', marginTop: 6, fontSize: '0.8rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={!sinCompra.includes(`${d.fecha}|${c}`)}
                            onChange={() => alternarCompra(d.fecha, c)} /> 🛒 Comprar para esta comida
                        </label>
                      )}
                      <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                        <select aria-label={`Cambiar ${c} del ${etiquetaDia(d.fecha)}`} value={d.comidas[c] || ''}
                          onChange={(e) => cambiarReceta(i, c, e.target.value)} style={{ maxWidth: 150, fontSize: '0.75rem' }}>
                          <option value="">— elegir otra —</option>
                          {opciones.map((o) => (
                            <option key={o.receta_id} value={o.receta_id}>
                              {o.puede_cocinar ? '✓ ' : ''}{o.ingredientes_por_vencer.length > 0 ? '⏰ ' : ''}{o.nombre}
                            </option>
                          ))}
                        </select>
                        <button title="Otra receta al azar" aria-label="Otra receta al azar" onClick={() => otraAlAzar(i, c)}>🎲</button>
                      </div>
                    </td>
                  );
                })}
                <td style={celda}>
                  <b>{Math.round(totales[i].kcal)} kcal</b><br />
                  <small>P {Math.round(totales[i].proteinas_g)} g · C {Math.round(totales[i].carbohidratos_g)} g · G {Math.round(totales[i].grasas_g)} g</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {plan.length === 0 && !rangoInvalido && <p>Elige las fechas del menú.</p>}

      {plan.length > 0 && (
        <>
          <h3 style={{ margin: '24px 0 8px' }}>Total del período (por persona): {Math.round(totalSemana.kcal)} kcal</h3>
          <p style={{ margin: 0 }}>
            Proteínas {Math.round(totalSemana.proteinas_g)} g · Carbohidratos {Math.round(totalSemana.carbohidratos_g)} g · Grasas {Math.round(totalSemana.grasas_g)} g
          </p>
          <p><small>Los valores nutricionales son por persona (1 porción) y aproximados. ✓ = puedes cocinarla ahora, ⏰ = usa alimentos por vencer.</small></p>

          <p style={{ margin: '12px 0 0', fontSize: '0.85rem' }}>
            Tickea en cada comida si vas a comprar sus ingredientes; la lista de compras de abajo se arma solo con las tickeadas.{' '}
            <button onClick={() => setSinCompra([])} disabled={sinCompra.length === 0}>Marcar todas</button>{' '}
            <button onClick={() => setSinCompra(plan.flatMap((d) => Object.entries(d.comidas).filter(([, id]) => id).map(([c]) => `${d.fecha}|${c}`)))}>
              Desmarcar todas
            </button>
          </p>
          <div style={{ marginTop: 20, padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#fff' }}>
            <h3 style={{ margin: '0 0 8px' }}>
              Lista de compras del menú ({todos.length} {todos.length === 1 ? 'comida' : 'comidas'} · para {nPersonas} {nPersonas === 1 ? 'persona' : 'personas'})
            </h3>
            {vista.error && <p style={{ color: 'crimson' }}>{vista.error}</p>}
            {vista.cargando && <p>Calculando...</p>}
            {!vista.cargando && !vista.error && (vista.items.length === 0
              ? <p>{todos.length === 0 ? 'No hay comidas tickeadas para comprar.' : 'Ya tienes todo lo necesario en tu despensa 🎉'}</p>
              : (
                <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 560, fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#666' }}>
                      <th></th><th>Comprar</th><th>Necesitas</th><th>Tienes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vista.items.map((i) => (
                      <tr key={i.alimento_id} style={{ borderTop: '1px solid #eee', opacity: noComprar.includes(i.alimento_id) ? 0.45 : 1 }}>
                        <td><input type="checkbox" aria-label={`Comprar ${i.alimento}`} checked={!noComprar.includes(i.alimento_id)}
                          onChange={() => setNoComprar((p) => (p.includes(i.alimento_id) ? p.filter((x) => x !== i.alimento_id) : [...p, i.alimento_id]))} /></td>
                        <td style={{ padding: '4px 0' }}><strong>{i.cantidad_sugerida} {i.unidad}</strong> {i.alimento}</td>
                        <td>{i.necesario} {i.unidad}</td>
                        <td>{i.en_despensa} {i.unidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            <p style={{ fontSize: '0.8rem', color: '#666' }}>Tickea lo que vas a comprar; lo que desmarques no entra en la lista. Es una previsualización: no se guarda hasta que presiones el botón.</p>
            <button onClick={comprar} disabled={vista.cargando || vista.items.length === 0 || vista.items.every((i) => noComprar.includes(i.alimento_id))}>🛒 Comprar: generar la lista ({vista.items.filter((i) => !noComprar.includes(i.alimento_id)).length})</button>
            {guardada && (
              <p style={{ background: '#e8f6ec', padding: 10, borderRadius: 6 }}>
                {guardada.lista_id
                  ? <>Lista #{guardada.lista_id} generada. <Link to="/compras">Verla en Compras →</Link></>
                  : guardada.mensaje}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
