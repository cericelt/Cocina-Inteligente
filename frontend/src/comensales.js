import { useCallback, useEffect, useState } from 'react';
import api from './api';

// Quiénes comen hoy. Se guarda en este navegador y solo vale para el día de hoy.
const CLAVE = 'comensalesHoy';

function hoy() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function leerSeleccion() {
  try {
    const raw = JSON.parse(localStorage.getItem(CLAVE));
    if (raw && raw.fecha === hoy()) {
      return { fecha: raw.fecha, ids: Array.isArray(raw.ids) ? raw.ids : null, invitados: raw.invitados || [] };
    }
  } catch { /* sin storage o dato dañado */ }
  return { fecha: hoy(), ids: null, invitados: [] }; // ids null = todas las personas
}

export function guardarSeleccion(sel) {
  try { localStorage.setItem(CLAVE, JSON.stringify({ ...sel, fecha: hoy() })); } catch { /* sin storage */ }
}

// Carga las personas del perfil y calcula quiénes comen hoy
export function useComensales() {
  const [personas, setPersonas] = useState([]);
  const [sel, setSel] = useState(leerSeleccion);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    api.get('/perfil/personas')
      .then(r => setPersonas(r.data))
      .catch(() => setPersonas([]))
      .finally(() => setListo(true));
  }, []);

  const cambiar = useCallback((nuevo) => {
    setSel(nuevo);
    guardarSeleccion(nuevo);
  }, []);

  const ids = (sel.ids === null ? personas.map(p => p.id) : sel.ids).filter(id => personas.some(p => p.id === id));
  const nombres = [
    ...personas.filter(p => ids.includes(p.id)).map(p => p.nombre),
    ...sel.invitados.map(i => i.nombre),
  ];
  const total = Math.max(1, ids.length + sel.invitados.length);
  const params = {
    personas: ids.join(','),
    alergias_extra: sel.invitados.map(i => i.restricciones).filter(Boolean).join(','),
  };
  return { personas, sel, cambiar, listo, ids, nombres, total, params };
}

// Texto "vence en N días"
export function textoDias(d) {
  if (d === null || d === undefined) return 'No vence';
  if (d < 0) return `venció hace ${-d} ${-d === 1 ? 'día' : 'días'}`;
  if (d === 0) return 'vence hoy';
  return `vence en ${d} ${d === 1 ? 'día' : 'días'}`;
}
