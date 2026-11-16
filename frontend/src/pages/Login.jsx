import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Logo from '../Logo';

const campo = { display: 'block', width: '100%', boxSizing: 'border-box', padding: 8, marginTop: 4 };

function Login() {
  const [modo, setModo] = useState('entrar'); // 'entrar' | 'crear'
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repetir, setRepetir] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  async function iniciarSesion() {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    navigate('/inicio');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      if (modo === 'crear') {
        if (password.length < 8) throw { mensaje: 'La contraseña debe tener al menos 8 caracteres' };
        if (password !== repetir) throw { mensaje: 'Las contraseñas no coinciden' };
        await api.post('/auth/register', { nombre: nombre.trim(), email, password });
      }
      await iniciarSesion();
    } catch (err) {
      setError(err.mensaje || err.response?.data?.error ||
        (err.response ? 'No se pudo completar la operación' : 'No se pudo conectar con el servidor'));
    } finally {
      setEnviando(false);
    }
  }

  function cambiarModo(nuevo) {
    setModo(nuevo);
    setError('');
  }

  return (
    <div style={{ padding: '24px 40px 40px', maxWidth: 380, margin: '0 auto', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 24px' }}>
        <Logo tipo="apilado" alto={170} />
      </div>
      <p style={{ margin: '0 0 24px', textAlign: 'center' }}>
        {modo === 'entrar' ? 'Inicia sesión para ver tu despensa y tus menús.' : 'Crea tu cuenta para empezar.'}
      </p>

      <form onSubmit={handleSubmit}>
        {modo === 'crear' && (
          <label style={{ display: 'block', marginBottom: 14 }}>Nombre
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required style={campo} />
          </label>
        )}
        <label style={{ display: 'block', marginBottom: 14 }}>Correo
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={campo} />
        </label>
        <label style={{ display: 'block', marginBottom: 14 }}>Contraseña
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={campo}
            minLength={modo === 'crear' ? 8 : undefined} />
          {modo === 'crear' && <small>Mínimo 8 caracteres.</small>}
        </label>
        {modo === 'crear' && (
          <label style={{ display: 'block', marginBottom: 14 }}>Repite la contraseña
            <input type="password" value={repetir} onChange={e => setRepetir(e.target.value)} required style={campo} />
          </label>
        )}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Un momento...' : modo === 'entrar' ? 'Iniciar sesión' : 'Crear cuenta y entrar'}
        </button>
        {error && <p style={{ color: 'crimson', marginTop: 12 }}>{error}</p>}
      </form>

      <p style={{ marginTop: 24 }}>
        {modo === 'entrar' ? (
          <>¿No tienes cuenta? <button type="button" onClick={() => cambiarModo('crear')}>Crear una cuenta</button></>
        ) : (
          <>¿Ya tienes cuenta? <button type="button" onClick={() => cambiarModo('entrar')}>Iniciar sesión</button></>
        )}
      </p>
    </div>
  );
}

export default Login;
