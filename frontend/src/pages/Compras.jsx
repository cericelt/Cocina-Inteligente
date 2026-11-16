import { useEffect, useState } from 'react';
import api from '../api';
import { descargarXlsx } from '../excel';

const num = (v) => Math.round((Number(v) || 0) * 100) / 100;
const caja = { border: '1px solid #ddd', padding: 14, margin: '0 0 16px', borderRadius: 6, background: '#fff' };

// Suma las cantidades de varias listas, juntando el mismo alimento (y unidad)
function unirListas(listas) {
  const mapa = {};
  listas.forEach((l) => l.items.forEach((it) => {
    const clave = `${it.alimento}|${it.unidad}`;
    if (!mapa[clave]) mapa[clave] = { alimento: it.alimento, unidad: it.unidad, cantidad: 0 };
    mapa[clave].cantidad += Number(it.cantidad_sugerida) || 0;
  }));
  return Object.values(mapa)
    .map((x) => ({ ...x, cantidad: num(x.cantidad) }))
    .sort((a, b) => a.alimento.localeCompare(b.alimento, 'es'));
}

function exportar(nombre, items) {
  const filas = [['Alimento', 'Cantidad', 'Unidad'], ...items.map((i) => [i.alimento, num(i.cantidad), i.unidad])];
  descargarXlsx(nombre, filas, [32, 12, 12]);
}

// Formulario para crear o editar una lista fija
function FormListaFija({ inicial, catalogo, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState(inicial.nombre || '');
  const [filas, setFilas] = useState(
    inicial.items && inicial.items.length > 0
      ? inicial.items.map((i) => ({ alimento_id: String(i.alimento_id), cantidad: String(i.cantidad) }))
      : [{ alimento_id: '', cantidad: '' }]
  );
  const [error, setError] = useState('');
  const unidadDe = (id) => catalogo.find((a) => String(a.id) === String(id))?.unidad_medida || '';
  const cambiar = (i, k, v) => setFilas((p) => p.map((f, idx) => (idx === i ? { ...f, [k]: v } : f)));

  async function guardar() {
    setError('');
    const items = filas.filter((f) => f.alimento_id && Number(f.cantidad) > 0)
      .map((f) => ({ alimento_id: Number(f.alimento_id), cantidad: Number(f.cantidad) }));
    if (!nombre.trim()) return setError('Ponle un nombre a la lista.');
    if (items.length === 0) return setError('Agrega al menos un alimento con su cantidad.');
    try {
      await onGuardar({ nombre: nombre.trim(), items });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar la lista');
    }
  }

  return (
    <div style={{ ...caja, background: '#f9f9f9' }}>
      <label style={{ display: 'block', marginBottom: 10 }}>Nombre de la lista<br />
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Compras básicas del mes"
          style={{ width: '100%', boxSizing: 'border-box', padding: 6 }} />
      </label>
      {filas.map((f, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={f.alimento_id} onChange={(e) => cambiar(i, 'alimento_id', e.target.value)} style={{ flex: 2, minWidth: 160, padding: 6 }}>
            <option value="">Alimento...</option>
            {catalogo.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <input type="number" min="0" step="0.01" placeholder="Cantidad" value={f.cantidad}
            onChange={(e) => cambiar(i, 'cantidad', e.target.value)} style={{ width: 90, padding: 6 }} />
          <span style={{ width: 50 }}>{unidadDe(f.alimento_id)}</span>
          {filas.length > 1 && <button type="button" onClick={() => setFilas((p) => p.filter((_, idx) => idx !== i))}>Quitar</button>}
        </div>
      ))}
      <button type="button" onClick={() => setFilas((p) => [...p, { alimento_id: '', cantidad: '' }])}>+ Agregar otro alimento</button>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button type="button" onClick={guardar}>Guardar lista</button>
        <button type="button" onClick={onCancelar}>Cancelar</button>
      </div>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </div>
  );
}

export default function Compras() {
  const [listas, setListas] = useState([]);
  const [fijas, setFijas] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [seleccion, setSeleccion] = useState([]);
  const [unida, setUnida] = useState(null);
  const [recibiendo, setRecibiendo] = useState(null); // { lista_id, filas: [...] }
  const [formFija, setFormFija] = useState(null); // null | { id?, nombre, items }

  async function cargar() {
    const [res, fj, cat] = await Promise.all([api.get('/compras'), api.get('/compras/fijas'), api.get('/alimentos')]);
    const grupos = {};
    res.data.forEach((f) => {
      if (!grupos[f.lista_id]) {
        grupos[f.lista_id] = { lista_id: f.lista_id, fecha: f.fecha_generada, comprada: f.comprada, items: [] };
      }
      grupos[f.lista_id].items.push(f);
    });
    setListas(Object.values(grupos).sort((a, b) => b.lista_id - a.lista_id));
    setFijas(fj.data);
    setCatalogo(cat.data);
  }

  useEffect(() => {
    cargar()
      .catch(() => setError('No se pudieron cargar las listas de compras'))
      .finally(() => setCargando(false));
  }, []);

  const avisar = (ok, texto) => setMensaje({ ok, texto });

  function alternar(id) {
    setUnida(null);
    setSeleccion((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function unir() {
    const elegidas = listas.filter((l) => seleccion.includes(l.lista_id));
    setUnida({ ids: elegidas.map((l) => l.lista_id).sort((a, b) => a - b), items: unirListas(elegidas) });
  }

  async function borrar(ids) {
    const texto = ids.length === 1 ? `¿Borrar la lista #${ids[0]}?` : `¿Borrar las ${ids.length} listas marcadas?`;
    if (!window.confirm(`${texto} Esto no se puede deshacer.`)) return;
    try {
      for (const id of ids) await api.delete(`/compras/${id}`);
      setSeleccion((p) => p.filter((x) => !ids.includes(x)));
      setUnida(null);
      if (recibiendo && ids.includes(recibiendo.lista_id)) setRecibiendo(null);
      await cargar();
      avisar(true, ids.length === 1 ? 'Lista borrada.' : 'Listas borradas.');
    } catch (err) {
      avisar(false, err.response?.data?.error || 'No se pudo borrar');
    }
  }

  // ----- Registrar lo comprado en la despensa -----
  function abrirRecibir(lista) {
    setMensaje(null);
    setRecibiendo({
      lista_id: lista.lista_id,
      filas: lista.items.map((it) => ({
        alimento_id: it.alimento_id, alimento: it.alimento, unidad: it.unidad,
        comprado: true, cantidad: String(num(it.cantidad_sugerida)), fecha: '',
      })),
    });
  }

  function cambiarFila(i, k, v) {
    setRecibiendo((r) => ({ ...r, filas: r.filas.map((f, idx) => (idx === i ? { ...f, [k]: v } : f)) }));
  }

  async function guardarRecibir(repetir = false) {
    const items = recibiendo.filas
      .filter((f) => f.comprado && Number(f.cantidad) > 0)
      .map((f) => ({ alimento_id: f.alimento_id, cantidad: Number(f.cantidad), fecha_vencimiento: f.fecha || null }));
    if (items.length === 0) return avisar(false, 'Marca al menos un producto comprado, con su cantidad.');
    try {
      const res = await api.post(`/compras/${recibiendo.lista_id}/recibir`, { items, repetir });
      setRecibiendo(null);
      await cargar();
      avisar(true, `Listo: ${res.data.agregados} ${res.data.agregados === 1 ? 'producto agregado' : 'productos agregados'} a tu despensa.`);
    } catch (err) {
      if (err.response?.status === 409) {
        if (window.confirm('Esta lista ya fue agregada a tu despensa. ¿Agregarla otra vez? (se sumarían las cantidades de nuevo)')) {
          return guardarRecibir(true);
        }
        return undefined;
      }
      avisar(false, err.response?.data?.error || 'No se pudo registrar la compra');
    }
    return undefined;
  }

  // ----- Listas fijas -----
  async function guardarFija(datos) {
    if (formFija && formFija.id) await api.put(`/compras/fijas/${formFija.id}`, datos);
    else await api.post('/compras/fijas', datos);
    setFormFija(null);
    await cargar();
    avisar(true, 'Lista fija guardada.');
  }

  async function borrarFija(f) {
    if (!window.confirm(`¿Borrar la lista fija "${f.nombre}"?`)) return;
    try {
      await api.delete(`/compras/fijas/${f.id}`);
      await cargar();
    } catch (err) {
      avisar(false, err.response?.data?.error || 'No se pudo borrar');
    }
  }

  async function usarFija(f, soloFaltantes) {
    try {
      const res = await api.post(`/compras/fijas/${f.id}/usar`, { solo_faltantes: soloFaltantes });
      if (res.data.lista_id) {
        await cargar();
        avisar(true, `Se generó la lista #${res.data.lista_id} desde "${f.nombre}". Búscala arriba para comprar y registrar lo comprado.`);
      } else {
        avisar(true, res.data.mensaje);
      }
    } catch (err) {
      avisar(false, err.response?.data?.error || 'No se pudo generar la lista');
    }
  }

  if (cargando) return <p>Cargando...</p>;
  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', textAlign: 'left' }}>
      <h2 style={{ margin: '0 0 16px' }}>Mis listas de compras</h2>

      {mensaje && (
        <p style={{ padding: 10, borderRadius: 6, background: mensaje.ok ? '#e8f6ec' : '#fdecea', color: mensaje.ok ? '#1e6b34' : '#a32117' }}>
          {mensaje.texto}
        </p>
      )}

      {listas.length === 0 && <p>Aún no tienes listas. Genera una desde el Menú semanal o desde Menús, o usa una lista fija (más abajo).</p>}

      {listas.length > 0 && (
        <>
          <p style={{ margin: '0 0 12px' }}>
            Marca dos o más listas para unirlas en una sola, o para borrarlas juntas.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0 0 20px' }}>
            <button onClick={() => { setUnida(null); setSeleccion(listas.map((l) => l.lista_id)); }}>Marcar todas</button>
            <button onClick={() => { setUnida(null); setSeleccion([]); }} disabled={seleccion.length === 0}>Limpiar</button>
            <button onClick={unir} disabled={seleccion.length < 2}>Unir listas marcadas ({seleccion.length})</button>
            <button onClick={() => borrar(seleccion)} disabled={seleccion.length === 0}>Borrar marcadas</button>
          </div>
        </>
      )}

      {unida && (
        <div style={{ ...caja, border: '2px solid #3d8b63', background: '#f1f8f4' }}>
          <strong>Lista unida (listas {unida.ids.map((i) => `#${i}`).join(', ')})</strong>
          {unida.items.length > 0 ? (
            <ul style={{ lineHeight: 1.6 }}>
              {unida.items.map((it, i) => <li key={i}>{it.alimento}: {it.cantidad} {it.unidad}</li>)}
            </ul>
          ) : <p>Las listas elegidas no tienen ítems.</p>}
          <button onClick={() => exportar(`lista_compras_unida_${unida.ids.join('-')}.xlsx`, unida.items)} disabled={unida.items.length === 0}>
            📥 Descargar Excel de la lista unida
          </button>
        </div>
      )}

      <div className="rejilla">
      {listas.map((l) => (
        <div key={l.lista_id} className={recibiendo && recibiendo.lista_id === l.lista_id ? 'ancho' : ''} style={caja}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="checkbox" checked={seleccion.includes(l.lista_id)} onChange={() => alternar(l.lista_id)} />
            <b>Lista #{l.lista_id}</b>
            <small>{new Date(l.fecha).toLocaleString('es-CL')}</small>
            {l.comprada && <span style={{ background: '#e8f6ec', color: '#1e6b34', borderRadius: 10, padding: '1px 10px', fontSize: '0.75rem' }}>Comprada ✓</span>}
          </label>

          {recibiendo && recibiendo.lista_id === l.lista_id ? (
            <div style={{ marginTop: 12 }}>
              <p style={{ margin: '0 0 8px' }}>
                Marca lo que compraste, corrige la cantidad si fue distinta y, si quieres, pon la fecha de vencimiento.
                Lo que no compraste, déjalo sin marcar.
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 520, fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#666' }}>
                      <th>Compré</th><th>Alimento</th><th>Cantidad</th><th>Vence (opcional)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recibiendo.filas.map((f, i) => (
                      <tr key={f.alimento_id} style={{ borderTop: '1px solid #eee', opacity: f.comprado ? 1 : 0.5 }}>
                        <td><input type="checkbox" aria-label={`Compré ${f.alimento}`} checked={f.comprado} onChange={(e) => cambiarFila(i, 'comprado', e.target.checked)} /></td>
                        <td style={{ padding: '6px 4px' }}>{f.alimento}</td>
                        <td>
                          <input type="number" min="0" step="0.01" value={f.cantidad} disabled={!f.comprado}
                            onChange={(e) => cambiarFila(i, 'cantidad', e.target.value)} style={{ width: 80 }} /> {f.unidad}
                        </td>
                        <td><input type="date" value={f.fecha} disabled={!f.comprado} onChange={(e) => cambiarFila(i, 'fecha', e.target.value)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => guardarRecibir(false)}>✅ Agregar lo comprado a mi despensa</button>
                <button onClick={() => setRecibiendo(null)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <ul style={{ lineHeight: 1.6 }}>
                {l.items.map((it, i) => <li key={i}>{it.alimento}: {num(it.cantidad_sugerida)} {it.unidad}</li>)}
              </ul>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => abrirRecibir(l)}>🛍️ Registrar compra en mi despensa</button>
                <button onClick={() => exportar(`lista_compras_${l.lista_id}.xlsx`,
                  l.items.map((it) => ({ alimento: it.alimento, cantidad: it.cantidad_sugerida, unidad: it.unidad })))}>
                  📥 Descargar Excel
                </button>
                <button onClick={() => borrar([l.lista_id])}>🗑️ Borrar</button>
              </div>
            </>
          )}
        </div>
      ))}
      </div>

      <h2 style={{ margin: '40px 0 8px' }}>Mis listas fijas</h2>
      <p style={{ margin: '0 0 16px' }}>
        Listas que armas tú y quedan guardadas para siempre (por ejemplo, tus compras básicas).
        Cuando vayas a comprar, genera una lista desde ellas y registra la compra igual que las demás.
      </p>

      {formFija ? (
        <FormListaFija inicial={formFija} catalogo={catalogo} onGuardar={guardarFija} onCancelar={() => setFormFija(null)} />
      ) : (
        <p><button onClick={() => setFormFija({ nombre: '', items: [] })}>+ Crear una lista fija</button></p>
      )}

      {fijas.length === 0 && !formFija && <p>Aún no tienes listas fijas.</p>}
      <div className="rejilla">
      {fijas.map((f) => (
        <div key={f.id} style={caja}>
          <b>{f.nombre}</b>
          <ul style={{ lineHeight: 1.6 }}>
            {f.items.map((it) => <li key={it.alimento_id}>{it.alimento}: {num(it.cantidad)} {it.unidad}</li>)}
          </ul>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => usarFija(f, false)}>🛒 Generar lista para comprar</button>
            <button onClick={() => usarFija(f, true)}>🛒 Solo lo que me falta</button>
            <button onClick={() => setFormFija(f)}>✏️ Editar</button>
            <button onClick={() => exportar(`lista_fija_${f.id}.xlsx`, f.items.map((i) => ({ alimento: i.alimento, cantidad: i.cantidad, unidad: i.unidad })))}>📥 Excel</button>
            <button onClick={() => borrarFija(f)}>🗑️ Borrar</button>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
