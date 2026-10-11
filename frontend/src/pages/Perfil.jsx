import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Perfil() {
  const [alergias, setAlergias] = useState('');
  const [restricciones, setRestricciones] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/perfil')
      .then(res => {
        setAlergias(res.data.alergias || '');
        setRestricciones(res.data.restricciones_dieta || '');
      })
      .catch(err => {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setMensaje('No se pudo cargar el perfil');
        }
      })
      .finally(() => setCargando(false));
  }, [navigate]);

  async function guardar(e) {
    e.preventDefault();
    setMensaje('');
    try {
        const res = await api.put('/perfil', { alergias, restricciones_dieta: restricciones });
        setAlergias(res.data.alergias || '');
        setRestricciones(res.data.restricciones_dieta || '');
      setMensaje('Perfil guardado. Los menús sugeridos ya usan estos datos.');
    } catch (err) {
      setMensaje(err.response?.data?.error || 'No se pudo guardar el perfil');
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520, margin: '0 auto', textAlign: 'left', color: '#222' }}>
      <h1 style={{ margin: 0 }}>Mi perfil</h1>
      <p style={{ marginTop: 4 }}>
        Las recetas que contengan estos alimentos no se te sugerirán.
        Estos datos solo se usan para filtrar menús.
      </p>

      {cargando ? <p>Cargando...</p> : (
        <form onSubmit={guardar}>
          <p>
            <label>
              Alergias (separadas por coma)<br />
              <input value={alergias} onChange={e => setAlergias(e.target.value)}
                placeholder="Ej: leche, lácteos, maní" style={{ width: '100%' }} />
            </label>
          </p>
          <p>
            <label>
              Restricciones de dieta<br />
              <input value={restricciones} onChange={e => setRestricciones(e.target.value)}
                placeholder="Ej: vegetariana" style={{ width: '100%' }} />
            </label>
          </p>
          <button type="submit">Guardar</button>
        </form>
      )}

      {mensaje && <p style={{ background: '#eef6ff', padding: 10, borderRadius: 6 }}>{mensaje}</p>}
    </div>
  );
}

export default Perfil;