import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Login from './pages/Login';
import Despensa from './pages/Despensa';
import Menus from './pages/Menus';
import Perfil from './pages/Perfil';
import Semana from './pages/Semana';
import Compras from './pages/Compras';
import Dashboard from './pages/Dashboard';
import Alertas from './pages/Alertas';

function RutaProtegida({ children }) {
  if (!localStorage.getItem('token')) return <Navigate to="/login" />;
  return (
    <>
      <nav style={{
        display: 'flex', gap: 20, justifyContent: 'center',
        padding: '12px 24px', borderBottom: '1px solid #ddd',
      }}>
        <NavLink to="/inicio">Inicio</NavLink>
        <NavLink to="/alertas">Alertas</NavLink>
        <NavLink to="/despensa">Despensa</NavLink>
        <NavLink to="/menus">Menús</NavLink>
        <NavLink to="/semana">Menú semanal</NavLink>
        <NavLink to="/perfil">Perfil</NavLink>
        <NavLink to="/compras">Compras</NavLink>
      </nav>
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
        <Route path="/alertas" element={<RutaProtegida><Alertas /></RutaProtegida>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;