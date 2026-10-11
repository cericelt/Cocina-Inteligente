import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const ESTILOS = {
  vencido:         { fondo: '#fde8e8', borde: '#c0392b', etiqueta: 'Vencido' },
  por_vencer:      { fondo: '#fff4e0', borde: '#e67e22', etiqueta: 'Por vencer' },
  ok:              { fondo: '#e8f6ec', borde: '#27ae60', etiqueta: 'En buen estado' },
  sin_vencimiento: { fondo: '#eef1f5', borde: '#7f8c8d', etiqueta: 'Sin vencimiento' },
};

function textoDias(item) {
  const d = item.dias_para_vencer;
  if (d === null) return 'No vence';
  if (d < 0) return `Venció hace ${-d} ${-d === 1 ? 'día' : 'días'}`;
  if (d === 0) return 'Vence hoy';
  return `Vence en ${d} ${d === 1 ? 'día' : 'días'}`;
}

function formatearFecha(f) {
  return f ? f.slice(0, 10).split('-').reverse().join('-') : '';
}

const FORM_VACIO = { alimento_id: '', cantidad: '', fecha_vencimiento: '' };

function Despensa() {
  const [usuario, setUsuario] = useState(null);
  const [items, setItems] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/auth/me'), api.get('/inventario'), api.get('/alimentos')])
      .then(([me, inv, cat]) => {
        setUsuario(me.data.usuario);
        setItems(inv.data);
        setCatalogo(cat.data);
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
    const inv = await api.get('/inventario');
    setItems(inv.data);
  }

  async function agregar(e) {
    e.preventDefault();
    setMensaje('');
    try {
      await api.post('/inventario', {
        alimento_id: Number(form.alimento_id),
        cantidad: Number(form.cantidad),
        fecha_vencimiento: form.fecha_vencimiento || null,
      });
      setForm(FORM_VACIO);
      await recargar();
    } catch (err) {
      setMensaje(err.response?.data?.error || 'No se pudo agregar el alimento');
    }
  }

  async function eliminar(id) {
    if (!window.confirm('¿Eliminar este alimento de tu despensa?')) return;
    setMensaje('');
    try {
      await api.delete(`/inventario/${id}`);
      await recargar();
    } catch {
      setMensaje('No se pudo eliminar el alimento');
    }
  }

  function cerrarSesion() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  const contar = estado => items.filter(i => i.estado === estado).length;
  const seleccionado = catalogo.find(a => String(a.id) === form.alimento_id);

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto', textAlign: 'left', color: '#222' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Mi despensa</h1>
          <small>{usuario ? usuario.email : ''}</small>
        </div>
        <button onClick={cerrarSesion}>Cerrar sesión</button>
      </div>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {cargando && <p>Cargando...</p>}

      {!cargando && !error && (
        <>
          <form onSubmit={agregar} style={{
            display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end',
            background: '#f4f4f4', padding: 12, borderRadius: 6, margin: '16px 0',
          }}>
            <label>
              Alimento<br />
              <select value={form.alimento_id} required
                onChange={e => setForm({ ...form, alimento_id: e.target.value })}>
                <option value="">Elige uno...</option>
                {catalogo.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </label>
            <label>
              Cantidad {seleccionado ? `(${seleccionado.unidad_medida})` : ''}<br />
              <input type="number" min="0.01" step="any" required style={{ width: 90 }}
                value={form.cantidad}
                onChange={e => setForm({ ...form, cantidad: e.target.value })} />
            </label>
            <label>
              Vence (opcional)<br />
              <input type="date" value={form.fecha_vencimiento}
                onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} />
            </label>
            <button type="submit">Agregar</button>
          </form>

          {mensaje && <p style={{ color: 'crimson' }}>{mensaje}</p>}

          <p style={{ margin: '16px 0' }}>
            <strong>{contar('vencido')}</strong> vencidos ·{' '}
            <strong>{contar('por_vencer')}</strong> por vencer ·{' '}
            <strong>{contar('ok')}</strong> en buen estado ·{' '}
            <strong>{contar('sin_vencimiento')}</strong> sin vencimiento
          </p>

          {items.length === 0 && <p>Tu despensa está vacía.</p>}

          {items.map(item => {
            const estilo = ESTILOS[item.estado] || ESTILOS.ok;
            return (
              <div key={item.id} style={{
                background: estilo.fondo,
                borderLeft: `6px solid ${estilo.borde}`,
                borderRadius: 6,
                padding: '10px 14px',
                marginBottom: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}>
                <div>
                  <strong>{item.nombre}</strong>
                  <div style={{ fontSize: 14 }}>
                    {Number(item.cantidad)} {item.unidad_medida} · {item.categoria}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 14 }}>
                  <strong style={{ color: estilo.borde }}>{estilo.etiqueta}</strong>
                  <div>{textoDias(item)}</div>
                  {item.fecha_vencimiento && <div>{formatearFecha(item.fecha_vencimiento)}</div>}
                  <button onClick={() => eliminar(item.id)} style={{ marginTop: 4 }}>Eliminar</button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

export default Despensa;