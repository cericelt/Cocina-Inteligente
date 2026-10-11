import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const COMIDAS = ['desayuno', 'almuerzo', 'cena'];
const num = (v) => Number(v) || 0;

function armarSemana(recetas) {
  const usos = {}; // cuántas veces se ha usado cada receta en la semana
  return DIAS.map((dia) => {
    const hoy = new Set(); // recetas ya usadas hoy
    const comidas = {};
    for (const tipo of COMIDAS) {
      const candidatas = recetas
        .filter((r) => r.tipos_comida.includes(tipo) && !hoy.has(r.receta_id))
        .map((r) => ({
          r,
          score:
            (r.puede_cocinar ? 1000 : 0) +
            r.ingredientes_por_vencer.length * 100 +
            num(r.cobertura) -
            (usos[r.receta_id] || 0) * 500 +
            Math.random() * 30, // un poco de azar para variar al regenerar
        }))
        .sort((a, b) => b.score - a.score);
      const elegida = candidatas.length ? candidatas[0].r : null;
      comidas[tipo] = elegida;
      if (elegida) {
        hoy.add(elegida.receta_id);
        usos[elegida.receta_id] = (usos[elegida.receta_id] || 0) + 1;
      }
    }
    return { dia, comidas };
  });
}

function totalDia(comidas) {
  const t = { kcal: 0, proteinas_g: 0, carbohidratos_g: 0, grasas_g: 0 };
  Object.values(comidas).forEach((r) => {
    if (!r) return;
    t.kcal += num(r.por_porcion.kcal);
    t.proteinas_g += num(r.por_porcion.proteinas_g);
    t.carbohidratos_g += num(r.por_porcion.carbohidratos_g);
    t.grasas_g += num(r.por_porcion.grasas_g);
  });
  return t;
}

export default function Semana() {
  const [recetas, setRecetas] = useState([]);
  const [semana, setSemana] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [lista, setLista] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [personas, setPersonas] = useState(1);

  async function generarLista() {
    setGenerando(true);
    setError('');
    try {
      const ids = new Set();
      semana.forEach((d) =>
        Object.values(d.comidas).forEach((r) => r && ids.add(r.receta_id))
      );
      // si una receta se repite en la semana, se manda varias veces
      const todos = [];
      semana.forEach((d) =>
        Object.values(d.comidas).forEach((r) => r && todos.push(r.receta_id))
      );
      const res = await api.post('/compras/generar', { receta_ids: todos, personas: Number(personas) });
      setLista(res.data);
    } catch (e) {
      setError('No se pudo generar la lista de compras');
    } finally {
      setGenerando(false);
    }
  }

  useEffect(() => {
    Promise.all([api.get('/menus/sugerencias'), api.get('/menus/nutricion')])
      .then(([sug, nut]) => {
        const listaSug = Array.isArray(sug.data) ? sug.data : sug.data.sugerencias || [];
        const listaNut = Array.isArray(nut.data) ? nut.data : nut.data.recetas || [];
        const nutPorId = {};
        listaNut.forEach((n) => (nutPorId[n.receta_id] = n));
        const unidas = listaSug
          .filter((s) => nutPorId[s.receta_id])
          .map((s) => ({
            ...s,
            ingredientes_por_vencer: s.ingredientes_por_vencer || [],
            tipos_comida: nutPorId[s.receta_id].tipos_comida || [],
            por_porcion: nutPorId[s.receta_id].por_porcion,
          }));
        setRecetas(unidas);
        setSemana(armarSemana(unidas));
      })
      .catch(() => setError('No se pudo cargar el menú semanal'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando...</p>;
  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;

  const totales = semana.map((d) => totalDia(d.comidas));
  const totalSemana = totales.reduce(
    (a, t) => ({
      kcal: a.kcal + t.kcal,
      proteinas_g: a.proteinas_g + t.proteinas_g,
      carbohidratos_g: a.carbohidratos_g + t.carbohidratos_g,
      grasas_g: a.grasas_g + t.grasas_g,
    }),
    { kcal: 0, proteinas_g: 0, carbohidratos_g: 0, grasas_g: 0 }
  );

  const celda = { border: '1px solid #ddd', padding: '8px', verticalAlign: 'top' };

  return (
    <div>
      <h2>Menú semanal (lunes a viernes) · por persona</h2>
      <label style={{ marginLeft: 8 }}>
        👥 Personas:{' '}
        <input
          type="number" min="1" max="20" value={personas}
          onChange={(e) => setPersonas(e.target.value)}
          style={{ width: 50 }}
        />
      </label>
      <button onClick={() => setSemana(armarSemana(recetas))}>🔄 Regenerar menú</button>
      <button onClick={generarLista} disabled={generando} style={{ marginLeft: 8 }}>
        {generando ? 'Generando...' : '🛒 Generar lista de compras de la semana'}
      </button>

      <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 12 }}>
        <thead>
          <tr style={{ background: '#f3f3f3' }}>
            <th style={celda}>Día</th>
            {COMIDAS.map((c) => (
              <th key={c} style={{ ...celda, textTransform: 'capitalize' }}>{c}</th>
            ))}
            <th style={celda}>Total del día (por persona)</th>
          </tr>
        </thead>
        <tbody>
          {semana.map((d, i) => (
            <tr key={d.dia}>
              <td style={celda}><b>{d.dia}</b></td>
              {COMIDAS.map((c) => {
                const r = d.comidas[c];
                return (
                  <td key={c} style={celda}>
                    {r ? (
                      <>
                        <div>{r.nombre}</div>
                        <small>{Math.round(num(r.por_porcion.kcal))} kcal por persona</small>
                        {r.ingredientes_por_vencer.length > 0 && (
                          <div><small>⏰ usa: {r.ingredientes_por_vencer.join(', ')}</small></div>
                        )}
                        {!r.puede_cocinar && <div><small>🛒 faltan ingredientes</small></div>}
                      </>
                    ) : (
                      <small>Sin receta de este tipo</small>
                    )}
                  </td>
                );
              })}
              <td style={celda}>
                <b>{Math.round(totales[i].kcal)} kcal</b><br />
                <small>
                  P {Math.round(totales[i].proteinas_g)} g · C {Math.round(totales[i].carbohidratos_g)} g · G {Math.round(totales[i].grasas_g)} g
                </small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Total de la semana (por persona): {Math.round(totalSemana.kcal)} kcal</h3>
      <p>
        Proteínas {Math.round(totalSemana.proteinas_g)} g · Carbohidratos {Math.round(totalSemana.carbohidratos_g)} g · Grasas {Math.round(totalSemana.grasas_g)} g
      </p>
      <p><small>Todos los valores nutricionales son por persona (1 porción) y aproximados. La lista de compras se calcula según el número de personas que elijas.</small></p>
      {lista && (
        <div style={{ marginTop: 16, padding: 12, border: '1px solid #ddd' }}>
          <h3>Lista de compras de la semana (para {personas} {Number(personas) === 1 ? 'persona' : 'personas'})</h3>
          {lista.items && lista.items.length > 0 ? (
            <ul>
              {lista.items.map((it) => (
                <li key={it.alimento_id}>
                  {it.alimento}: {it.cantidad_sugerida} {it.unidad}
                </li>
              ))}
            </ul>
          ) : (
            <p>{lista.mensaje || 'Ya tienes todo lo necesario en tu despensa 🎉'}</p>
          )}
          <Link to="/compras">Ver todas mis listas</Link>
        </div>
      )}
    </div>
  );
}