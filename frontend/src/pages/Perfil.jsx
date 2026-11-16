import { useEffect, useState } from 'react';
import api from '../api';
import { useComensales } from '../comensales';

const SUGERENCIAS = ['vegetariana', 'vegana', 'sin lactosa', 'sin gluten', 'celíaca'];
const caja = { border: '1px solid #ddd', borderRadius: 8, padding: 14, background: '#fff' };
const chip = (color, fondo) => ({
  display: 'inline-block', margin: '2px 4px 2px 0', padding: '1px 10px', borderRadius: 12,
  fontSize: '0.8rem', color, background: fondo,
});

function partir(texto) {
  return (texto || '').split(',').map((t) => t.trim()).filter(Boolean);
}

function FormPersona({ inicial, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState(inicial.nombre || '');
  const [alergias, setAlergias] = useState(inicial.alergias || '');
  const [restricciones, setRestricciones] = useState(inicial.restricciones_dieta || '');
  const [error, setError] = useState('');

  async function guardar(e) {
    e.preventDefault();
    if (!nombre.trim()) return setError('El nombre es obligatorio.');
    try {
      await onGuardar({ nombre: nombre.trim(), alergias, restricciones_dieta: restricciones });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar');
    }
    return undefined;
  }

  return (
    <form onSubmit={guardar} style={{ ...caja, background: '#f9f9f9', marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 10 }}>Nombre<br />
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: 6 }} />
      </label>
      <label style={{ display: 'block', marginBottom: 10 }}>Alergias (separadas por coma)<br />
        <input value={alergias} onChange={(e) => setAlergias(e.target.value)} placeholder="Ej: maní, mariscos"
          style={{ width: '100%', boxSizing: 'border-box', padding: 6 }} />
      </label>
      <label style={{ display: 'block', marginBottom: 6 }}>Restricciones de dieta (separadas por coma)<br />
        <input list="sug-restricciones" value={restricciones} onChange={(e) => setRestricciones(e.target.value)}
          placeholder="Ej: vegetariana, sin lactosa" style={{ width: '100%', boxSizing: 'border-box', padding: 6 }} />
        <datalist id="sug-restricciones">{SUGERENCIAS.map((s) => <option key={s} value={s} />)}</datalist>
      </label>
      <small style={{ display: 'block', marginBottom: 10, color: '#666' }}>
        Sugerencias: {SUGERENCIAS.join(', ')}. Las restricciones se aplican por categoría de alimento
        (por ejemplo, vegetariana excluye carnes, aves y pescados), así que es una aproximación.
      </small>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit">Guardar</button>
        <button type="button" onClick={onCancelar}>Cancelar</button>
      </div>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </form>
  );
}

export default function Perfil() {
  const { personas, sel, cambiar, listo } = useComensales();
  const [lista, setLista] = useState(null); // copia local para refrescar tras editar
  const [form, setForm] = useState(null); // null | {} (nueva) | persona (editar)
  const [mensaje, setMensaje] = useState(null);
  const [invitado, setInvitado] = useState({ nombre: '', restricciones: '' });

  useEffect(() => { if (listo) setLista(personas); }, [listo, personas]);

  async function recargar() {
    const r = await api.get('/perfil/personas');
    setLista(r.data);
  }

  async function guardar(datos) {
    if (form && form.id) await api.put(`/perfil/personas/${form.id}`, datos);
    else await api.post('/perfil/personas', datos);
    setForm(null);
    await recargar();
    setMensaje({ ok: true, texto: 'Perfil guardado.' });
  }

  async function borrar(p) {
    if (!window.confirm(`¿Eliminar a ${p.nombre}?`)) return;
    try {
      await api.delete(`/perfil/personas/${p.id}`);
      if (sel.ids) cambiar({ ...sel, ids: sel.ids.filter((x) => x !== p.id) });
      await recargar();
      setMensaje({ ok: true, texto: 'Persona eliminada.' });
    } catch (err) {
      setMensaje({ ok: false, texto: err.response?.data?.error || 'No se pudo eliminar' });
    }
  }

  function alternar(id) {
    const actuales = sel.ids === null ? (lista || []).map((p) => p.id) : sel.ids;
    const nuevos = actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id];
    cambiar({ ...sel, ids: nuevos });
  }

  function agregarInvitado(e) {
    e.preventDefault();
    if (!invitado.nombre.trim()) return;
    cambiar({
      ...sel,
      invitados: [...sel.invitados, { nombre: invitado.nombre.trim(), restricciones: invitado.restricciones.trim() }],
    });
    setInvitado({ nombre: '', restricciones: '' });
  }

  function quitarInvitado(i) {
    cambiar({ ...sel, invitados: sel.invitados.filter((_, idx) => idx !== i) });
  }

  if (!lista) return <p>Cargando...</p>;
  const marcados = (sel.ids === null ? lista.map((p) => p.id) : sel.ids).filter((id) => lista.some((p) => p.id === id));
  const ids = marcados;
  const total = Math.max(1, marcados.length + sel.invitados.length);

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto', textAlign: 'left' }}>
      <h2 style={{ margin: '0 0 16px' }}>Personas y restricciones</h2>

      {mensaje && (
        <p style={{ padding: 10, borderRadius: 6, background: mensaje.ok ? '#e8f6ec' : '#fdecea', color: mensaje.ok ? '#1e6b34' : '#a32117' }}>
          {mensaje.texto}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, margin: '0 0 16px' }}>
        {lista.map((p) => (
          <div key={p.id} style={caja}>
            <b style={{ fontSize: '1.05rem' }}>{p.nombre}</b>
            <div style={{ margin: '8px 0' }}>
              {partir(p.alergias).map((a) => <span key={a} style={chip('#a32117', '#fdecea')}>Alergia: {a}</span>)}
              {partir(p.restricciones_dieta).map((r) => <span key={r} style={chip('#1e6b34', '#e8f6ec')}>{r}</span>)}
              {!p.alergias && !p.restricciones_dieta && <small style={{ color: '#777' }}>Sin restricciones</small>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setMensaje(null); setForm(p); }}>✏️ Editar</button>
              <button onClick={() => borrar(p)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {form ? (
        <FormPersona key={form.id || 'nueva'} inicial={form} onGuardar={guardar} onCancelar={() => setForm(null)} />
      ) : (
        <p><button onClick={() => { setMensaje(null); setForm({}); }}>+ Agregar una persona</button></p>
      )}

      <h2 style={{ margin: '32px 0 8px' }}>¿Quiénes van a comer hoy?</h2>
      <p style={{ margin: '0 0 12px' }}>
        Esto se usa en las sugerencias de menú y en las cantidades de las listas de compras.
        Vale solo para hoy; mañana vuelven a contarse todas las personas.
      </p>
      <div style={{ ...caja, marginBottom: 16 }}>
        {lista.map((p) => (
          <label key={p.id} style={{ display: 'block', padding: '4px 0' }}>
            <input type="checkbox" checked={marcados.includes(p.id)} onChange={() => alternar(p.id)} /> {p.nombre}
          </label>
        ))}

        {sel.invitados.map((inv, i) => (
          <div key={i} style={{ padding: '4px 0' }}>
            🙋 {inv.nombre}{inv.restricciones ? ` (${inv.restricciones})` : ''}{' '}
            <button onClick={() => quitarInvitado(i)}>Quitar</button>
          </div>
        ))}

        <form onSubmit={agregarInvitado} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <input placeholder="Invitado/a (nombre)" value={invitado.nombre}
            onChange={(e) => setInvitado({ ...invitado, nombre: e.target.value })} style={{ padding: 6 }} />
          <input list="sug-restricciones" placeholder="Restricciones (opcional)" value={invitado.restricciones}
            onChange={(e) => setInvitado({ ...invitado, restricciones: e.target.value })} style={{ padding: 6, flex: 1, minWidth: 160 }} />
          <button type="submit">+ Agregar invitado/a</button>
        </form>

        <p style={{ margin: '12px 0 0' }}><b>Hoy comen {total} {total === 1 ? 'persona' : 'personas'}.</b>
          {ids.length === 0 && sel.invitados.length === 0 && ' (no hay nadie marcado; se contará 1 persona)'}
        </p>
      </div>
    </div>
  );
}
