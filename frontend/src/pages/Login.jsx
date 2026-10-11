import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/inicio');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión');
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 360, margin: '0 auto' }}>
      <h1>Cocina Inteligente</h1>
      <form onSubmit={handleSubmit}>
        <p>
          <input type="email" placeholder="Correo" value={email}
            onChange={e => setEmail(e.target.value)} required style={{ width: '100%' }} />
        </p>
        <p>
          <input type="password" placeholder="Contraseña" value={password}
            onChange={e => setPassword(e.target.value)} required style={{ width: '100%' }} />
        </p>
        <button type="submit">Iniciar sesión</button>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </form>
    </div>
  );
}

export default Login;