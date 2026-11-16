import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Despensa from './pages/Despensa';
import Menus from './pages/Menus';
import Perfil from './pages/Perfil';
import Semana from './pages/Semana';
import Compras from './pages/Compras';
import Dashboard from './pages/Dashboard';
import Alertas from './pages/Alertas';
import Agregar from './pages/Agregar';
import Logo from './Logo';
import { useState, useEffect } from 'react';

function TamanoLetra() {
  const [nivel, setNivel] = useState(() => {
    try { return Number(localStorage.getItem('tamanoLetra2')) || 15; } catch { return 15; }
  });
  useEffect(() => {
    document.documentElement.style.fontSize = nivel + 'px';
    try { localStorage.setItem('tamanoLetra2', String(nivel)); } catch { /* sin storage */ }
  }, [nivel]);
  return (
    <span className="tamano-letra" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <button title="Letra más pequeña" onClick={() => setNivel(n => Math.max(13, n - 2))}>A-</button>
      <button title="Letra más grande" onClick={() => setNivel(n => Math.min(23, n + 2))}>A+</button>
    </span>
  );
}

const ENLACES = [
  ['/inicio', 'Inicio'], ['/alertas', 'Alertas'], ['/despensa', 'Despensa'], ['/menus', 'Menús'],
  ['/semana', 'Menú semanal'], ['/compras', 'Compras'], ['/agregar', 'Agregar'], ['/perfil', 'Perfil'],
];

function BarraNavegacion() {
  const navigate = useNavigate();
  const salir = () => { localStorage.removeItem('token'); navigate('/login'); };
  return (
    <header className="barra">
      <NavLink to="/inicio" className="barra-marca" aria-label="Plato a Plato, ir al inicio">
        <Logo tipo="horizontal-sobre-verde" alto={34} />
      </NavLink>
      <nav className="barra-enlaces">
        {ENLACES.map(([ruta, texto]) => (
          <NavLink key={ruta} to={ruta} className={({ isActive }) => (isActive ? 'activo' : '')}>{texto}</NavLink>
        ))}
      </nav>
      <div className="barra-acciones">
        <TamanoLetra />
        <button className="barra-salir" onClick={salir}>Cerrar sesión</button>
      </div>
    </header>
  );
}

function RutaProtegida({ children }) {
  if (!localStorage.getItem('token')) return <Navigate to="/login" />;
  return (
    <>
      <BarraNavegacion />
      {children}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/despensa" element={<RutaProtegida><Despensa /></RutaProtegida>} />
        <Route path="/menus" element={<RutaProtegida><Menus /></RutaProtegida>} />
        <Route path="*" element={<Navigate to="/despensa" />} />
        <Route path="/perfil" element={<RutaProtegida><Perfil /></RutaProtegida>} />
        <Route path="/semana" element={<RutaProtegida><Semana /></RutaProtegida>} />
        <Route path="/compras" element={<RutaProtegida><Compras /></RutaProtegida>} />
        <Route path="/inicio" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
        <Route path="/agregar" element={<RutaProtegida><Agregar /></RutaProtegida>} />
        <Route path="/alertas" element={<RutaProtegida><Alertas /></RutaProtegida>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;