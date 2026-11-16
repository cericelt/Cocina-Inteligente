import { useEffect, useState } from 'react';
import api from '../api';

const TIPOS = [
  { id: 'desayuno', etiqueta: 'Desayuno' },
  { id: 'almuerzo', etiqueta: 'Almuerzo' },
  { id: 'cena', etiqueta: 'Cena' },
  { id: 'merienda', etiqueta: 'Merienda' },
];
const NOMBRE_UNIDAD = { g: 'gramos (g)', ml: 'mililitros (ml)', unidad: 'unidades' };

const caja = { border: '1px solid #ddd', borderRadius: 6, padding: 16, marginBottom: 28, background: '#fff', textAlign: 'left' };
const fila = { display: 'block', margin: '0 0 12px' };
const campo = { display: 'block', width: '100%', boxSizing: 'border-box', padding: 6, marginTop: 4 };

function mensajeError(err, porDefecto) {
  if (!err.response) return 'No se pudo conectar con el servidor. Revisa que el backend esté encendido (node server.js).';
  if (err.response.status === 404) return 'El servidor no tiene esta función. Copia los archivos nuevos del backend y reinícialo (node server.js).';
  if (err.response.status === 409) return `${err.response.data?.error}. Si es el mismo alimento, elígelo en la lista "Ya están en tu catálogo" para agregarlo a tu despensa.`;
  return err.response.data?.error || porDefecto;
}

const aviso = m => m && (
  <p style={{ padding: 10, borderRadius: 6, background: m.ok ? '#e8f6ec' : '#fdecea', color: m.ok ? '#1e6b34' : '#a32117' }}>
    {m.texto}
  </p>
);


/* ---- Conversión entre unidades y gramos ---- */
const r2 = x => Math.round(x * 100) / 100;
const opcionesUnidad = nat => (nat === 'unidad' ? ['unidad', 'g'] : [nat, 'unidad']);
const nombreUnidad = u => (u === 'unidad' ? 'unidades' : u === 'g' ? 'gramos' : u);
const pesoEfectivo = (a, peso) => Number(a?.gramos_por_unidad) || Number(peso) || 0;
// Pasa la cantidad escrita (en la unidad elegida) a la unidad en que se guarda el alimento. null = falta el peso de 1 unidad.
function convertir(a, cant, uni, peso) {
  const nat = a.unidad_medida;
  const u = uni || nat;
  const c = Number(cant);
  if (u === nat) return c;
  const p = pesoEfectivo(a, peso);
  if (!p) return null;
  return nat === 'unidad' ? c / p : c * p;
}

function CampoCantidad({ alimento, cantidad, unidad, peso, onCambio, ancho = 90 }) {
  if (!alimento) {
    return <input style={{ width: ancho, padding: 6 }} type="number" placeholder="Cantidad" disabled />;
  }
  const nat = alimento.unidad_medida;
  const u = unidad || nat;
  const distinta = u !== nat;
  const tienePeso = Number(alimento.gramos_por_unidad) > 0;
  const p = pesoEfectivo(alimento, peso);
  const conv = distinta && cantidad !== '' && p ? convertir(alimento, cantidad, u, peso) : null;
  const medidaPeso = nat === 'unidad' ? 'g' : nat;
  return (
    <>
      <input style={{ width: ancho, padding: 6 }} type="number" min="0" step="0.01" placeholder="Cantidad"
        value={cantidad} onChange={e => onCambio({ cantidad: e.target.value })} />
      <select style={{ padding: 6 }} value={u} aria-label="Unidad de la cantidad"
        onChange={e => onCambio({ unidad: e.target.value })}>
        {opcionesUnidad(nat).map(o => <option key={o} value={o}>{nombreUnidad(o)}</option>)}
      </select>
      {distinta && (
        <div style={{ flexBasis: '100%', fontSize: '0.85rem' }}>
          {!tienePeso && (
            <label>1 unidad pesa ({medidaPeso}){' '}
              <input style={{ width: 80, padding: 4 }} type="number" min="0.1" step="0.1" value={peso || ''}
                onChange={e => onCambio({ peso: e.target.value })} />{' '}
            </label>
          )}
          {tienePeso && <small>1 unidad ≈ {Number(alimento.gramos_por_unidad)} {medidaPeso}. </small>}
          {conv !== null && !Number.isNaN(conv) && <strong>= {r2(conv)} {nombreUnidad(nat)}</strong>}
          {!p && <small style={{ color: '#a32117' }}>Indica cuánto pesa 1 unidad para convertir.</small>}
        </div>
      )}
    </>
  );
}

/* Elegir categoría -> elegir alimento de la base (datos nutricionales automáticos) o "Otro" (manual).
   conCantidad: además permite registrar la cantidad que tienes en la despensa. */
function FormAlimento({ categorias, existentes = [], conCantidad, onGuardado, onCancelar }) {
  const vacio = { nombre: '', unidad_medida: 'g', kcal_100g: '', proteinas_100g: '', carbohidratos_100g: '',
                  grasas_100g: '', gramos_por_unidad: '' };
  const [categoriaId, setCategoriaId] = useState('');
  const [opciones, setOpciones] = useState([]);
  const [eleccion, setEleccion] = useState(''); // nombre del alimento de la base, o '__otro'
  const [manual, setManual] = useState(vacio);
  const [cantidad, setCantidad] = useState('');
  const [uniCant, setUniCant] = useState('');
  const [pesoCant, setPesoCant] = useState('');
  const [vence, setVence] = useState('');
  const [msg, setMsg] = useState(null);

  const categoria = categorias.find(c => String(c.id) === String(categoriaId));
  const enCatalogo = conCantidad && categoria
    ? existentes.filter(a => a.categoria === categoria.nombre) : [];
  const idExistente = eleccion.startsWith('__id:') ? eleccion.slice(5) : null;
  const existente = idExistente ? enCatalogo.find(a => String(a.id) === idExistente) : null;
  const deBase = opciones.find(o => o.nombre === eleccion);
  const datos = existente || (eleccion === '__otro' ? manual : deBase);

  useEffect(() => { setUniCant(''); setPesoCant(''); }, [eleccion]);

  useEffect(() => {
    setEleccion('');
    setOpciones([]);
    if (!categoria) return;
    api.get('/alimentos/referencia', { params: { categoria: categoria.nombre } })
      .then(r => setOpciones(r.data))
      .catch(err => setMsg({ ok: false, texto: mensajeError(err, 'No se pudo cargar la lista de alimentos') }));
  }, [categoriaId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function guardar() {
    setMsg(null);
    if (!categoria || !datos || !datos.nombre) {
      return setMsg({ ok: false, texto: 'Elige una categoría y un alimento.' });
    }
    try {
      if (existente) {
        if (!(Number(cantidad) > 0)) {
          return setMsg({ ok: false, texto: 'Indica la cantidad que tienes.' });
        }
        const cantNat = convertir(existente, cantidad, uniCant, pesoCant);
        if (cantNat === null) return setMsg({ ok: false, texto: 'Indica cuánto pesa 1 unidad para poder convertir.' });
        if (!existente.gramos_por_unidad && Number(pesoCant) > 0 && (uniCant || existente.unidad_medida) !== existente.unidad_medida) {
          await api.put(`/alimentos/${existente.id}/peso-unidad`, { gramos_por_unidad: Number(pesoCant) }).catch(() => {});
        }
        await api.post('/inventario', {
          alimento_id: existente.id, cantidad: r2(cantNat), fecha_vencimiento: vence || null,
        });
        setMsg({ ok: true, texto: `"${existente.nombre}" agregado a tu despensa.` });
        setCategoriaId(''); setEleccion(''); setCantidad(''); setUniCant(''); setPesoCant(''); setVence('');
        return;
      }
      const res = await api.post('/alimentos', {
        categoria_id: categoria.id,
        nombre: datos.nombre,
        unidad_medida: datos.unidad_medida,
        kcal_100g: datos.kcal_100g,
        proteinas_100g: datos.proteinas_100g,
        carbohidratos_100g: datos.carbohidratos_100g,
        grasas_100g: datos.grasas_100g,
        gramos_por_unidad: datos.gramos_por_unidad || pesoCant || null,
      });
      if (conCantidad && Number(cantidad) > 0) {
        const cantNat = convertir({ ...datos, gramos_por_unidad: datos.gramos_por_unidad || pesoCant }, cantidad, uniCant, pesoCant);
        await api.post('/inventario', {
          alimento_id: res.data.id, cantidad: r2(cantNat ?? Number(cantidad)), fecha_vencimiento: vence || null,
        });
      }
      setMsg({
        ok: true,
        texto: conCantidad && Number(cantidad) > 0
          ? `"${datos.nombre}" agregado al catálogo y a tu despensa.`
          : `"${datos.nombre}" agregado al catálogo.`,
      });
      setCategoriaId(''); setEleccion(''); setManual(vacio); setCantidad(''); setUniCant(''); setPesoCant(''); setVence('');
      onGuardado && onGuardado(res.data);
    } catch (err) {
      setMsg({ ok: false, texto: mensajeError(err, 'No se pudo guardar el alimento') });
    }
  }


  return (
    <div>
      <label style={fila}>1. Categoría
        <select style={campo} value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
          <option value="">Selecciona...</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </label>

      {categoria && (
        <label style={fila}>2. Alimento
          <select style={campo} value={eleccion} onChange={e => setEleccion(e.target.value)}>
            <option value="">Selecciona...</option>
            {enCatalogo.length > 0 && (
              <optgroup label="Ya están en tu catálogo (solo agregar a la despensa)">
                {enCatalogo.map(a => <option key={a.id} value={`__id:${a.id}`}>{a.nombre}</option>)}
              </optgroup>
            )}
            {opciones.length > 0 && (
              <optgroup label="Nuevos de la base de alimentos">
                {opciones.map(o => <option key={o.nombre} value={o.nombre}>{o.nombre}</option>)}
              </optgroup>
            )}
            <option value="__otro">Otro (no está en la lista, ingresarlo manualmente)</option>
          </select>
        </label>
      )}

      {eleccion === '__otro' && (
        <div style={{ background: '#eef4f0', padding: 12, borderRadius: 6, margin: '0 0 12px' }}>
          <label style={fila}>Nombre
            <input style={campo} value={manual.nombre} onChange={e => setManual({ ...manual, nombre: e.target.value })} />
          </label>
          <label style={fila}>Unidad de medida
            <select style={campo} value={manual.unidad_medida} onChange={e => setManual({ ...manual, unidad_medida: e.target.value })}>
              <option value="g">Gramos (g)</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="unidad">Unidades (huevos, cebollas, etc.)</option>
            </select>
          </label>
          {manual.unidad_medida !== 'unidad' && (
            <label style={fila}>Peso aproximado de 1 unidad (opcional, para poder usar "unidades" en recetas)
              <input style={campo} type="number" min="1" step="0.1" value={manual.gramos_por_unidad}
                onChange={e => setManual({ ...manual, gramos_por_unidad: e.target.value })} />
            </label>
          )}
          {manual.unidad_medida === 'unidad' && (
            <label style={fila}>Peso aproximado de 1 unidad (g)
              <input style={campo} type="number" min="1" step="0.1" value={manual.gramos_por_unidad}
                onChange={e => setManual({ ...manual, gramos_por_unidad: e.target.value })} />
            </label>
          )}
          <p style={{ margin: '0 0 8px', fontSize: '0.8rem' }}>Datos nutricionales por 100 g (opcionales; sin ellos la receta mostrará 0 kcal):</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            {[['kcal_100g', 'Calorías (kcal)'], ['proteinas_100g', 'Proteínas (g)'],
              ['carbohidratos_100g', 'Carbohidratos (g)'], ['grasas_100g', 'Grasas (g)']].map(([k, et]) => (
              <label key={k}>{et}
                <input style={campo} type="number" min="0" step="0.1" value={manual[k]}
                  onChange={e => setManual({ ...manual, [k]: e.target.value })} />
              </label>
            ))}
          </div>
        </div>
      )}

      {deBase && (
        <div style={{ background: '#eef6ff', padding: 12, borderRadius: 6, margin: '0 0 12px', fontSize: '0.85rem' }}>
          <strong>Información nutricional (por 100 {deBase.unidad_medida === 'ml' ? 'ml' : 'g'}), completada automáticamente:</strong>
          <div style={{ marginTop: 6 }}>
            {deBase.kcal_100g} kcal · Proteínas {deBase.proteinas_100g} g · Carbohidratos {deBase.carbohidratos_100g} g · Grasas {deBase.grasas_100g} g
          </div>
          <div style={{ marginTop: 4 }}>
            Se mide en {NOMBRE_UNIDAD[deBase.unidad_medida]}
            {deBase.unidad_medida === 'unidad' && ` (1 unidad ≈ ${deBase.gramos_por_unidad} g)`}
          </div>
        </div>
      )}

      {conCantidad && datos && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ ...fila, flex: 2, minWidth: 260 }}>
            3. Cantidad que tienes <small>(opcional; puedes elegir unidades o gramos)</small>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
              <CampoCantidad alimento={datos} cantidad={cantidad} unidad={uniCant} peso={pesoCant}
                onCambio={c => {
                  if ('cantidad' in c) setCantidad(c.cantidad);
                  if ('unidad' in c) setUniCant(c.unidad);
                  if ('peso' in c) setPesoCant(c.peso);
                }} />
            </div>
          </div>
          <label style={{ ...fila, flex: 1, minWidth: 160 }}>
            Fecha de vencimiento <small>(opcional)</small>
            <input style={campo} type="date" value={vence} onChange={e => setVence(e.target.value)} />
          </label>
        </div>
      )}

      <button type="button" onClick={guardar}>{existente ? 'Agregar a mi despensa' : 'Guardar alimento'}</button>
      {onCancelar && <button type="button" onClick={onCancelar} style={{ marginLeft: 8 }}>Cancelar</button>}
      {aviso(msg)}
    </div>
  );
}

function Agregar() {
  const [categorias, setCategorias] = useState([]);
  const [alimentos, setAlimentos] = useState([]);
  const [errCat, setErrCat] = useState('');

  const vacioR = { nombre: '', instrucciones: '', tiempo_preparacion: '', porciones: 2, tipos_comida: [] };
  const [fr, setFr] = useState(vacioR);
  const [ings, setIngs] = useState([{ alimento_id: '', cantidad: '', unidad: '', peso: '', nuevo: false }]);
  const [msgR, setMsgR] = useState(null);

  function cargarAlimentos() {
    return api.get('/alimentos').then(r => setAlimentos(r.data)).catch(() => {});
  }

  useEffect(() => {
    api.get('/alimentos/categorias')
      .then(r => {
        setCategorias(r.data);
        if (r.data.length === 0) setErrCat('La base de datos no tiene categorías de alimentos cargadas.');
      })
      .catch(err => setErrCat(mensajeError(err, 'No se pudieron cargar las categorías')));
    cargarAlimentos();
  }, []);

  function alternarTipo(id) {
    setFr(p => ({ ...p, tipos_comida: p.tipos_comida.includes(id)
      ? p.tipos_comida.filter(t => t !== id) : [...p.tipos_comida, id] }));
  }

  function cambiarIng(i, k, v) {
    setIngs(p => p.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));
  }

  function elegirAlimento(i, valor) {
    if (valor === '__nuevo') cambiarIng(i, 'nuevo', true);
    else setIngs(p => p.map((x, idx) => (idx === i ? { ...x, alimento_id: valor, nuevo: false, unidad: '', peso: '' } : x)));
  }

  async function alimentoCreado(i, creado) {
    await cargarAlimentos();
    setIngs(p => p.map((x, idx) => (idx === i ? { ...x, alimento_id: String(creado.id), nuevo: false } : x)));
  }

  async function guardarReceta(e) {
    e.preventDefault();
    setMsgR(null);
    const llenos = ings.filter(i => i.alimento_id && i.cantidad !== '');
    if (llenos.length === 0) {
      return setMsgR({ ok: false, texto: 'Agrega al menos un ingrediente con su cantidad.' });
    }
    const ingredientes = [];
    const pesosNuevos = [];
    for (const i of llenos) {
      const a = alimentos.find(x => String(x.id) === String(i.alimento_id));
      const cant = a ? convertir(a, i.cantidad, i.unidad, i.peso) : Number(i.cantidad);
      if (cant === null) {
        return setMsgR({ ok: false, texto: `Indica cuánto pesa 1 unidad de "${a.nombre}" para convertir la cantidad.` });
      }
      ingredientes.push({ alimento_id: i.alimento_id, cantidad: r2(cant) });
      if (a && !Number(a.gramos_por_unidad) && Number(i.peso) > 0 && (i.unidad || a.unidad_medida) !== a.unidad_medida) {
        pesosNuevos.push({ id: a.id, gpu: Number(i.peso) });
      }
    }
    if (fr.tipos_comida.length === 0) {
      return setMsgR({ ok: false, texto: 'Elige al menos un tipo de comida.' });
    }
    try {
      await api.post('/recetas', { ...fr, ingredientes });
      await Promise.all(pesosNuevos.map(p => api.put(`/alimentos/${p.id}/peso-unidad`, { gramos_por_unidad: p.gpu }).catch(() => {})));
      cargarAlimentos();
      setMsgR({ ok: true, texto: `Receta "${fr.nombre}" agregada. Ya aparece en Menús.` });
      setFr(vacioR);
      setIngs([{ alimento_id: '', cantidad: '', unidad: '', peso: '', nuevo: false }]);
    } catch (err) {
      setMsgR({ ok: false, texto: mensajeError(err, 'No se pudo guardar la receta') });
    }
  }


  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto', textAlign: 'left', color: '#222' }}>
      <h1 style={{ margin: '0 0 24px', lineHeight: 1.2, fontSize: '1.9rem' }}>Agregar alimentos y recetas</h1>

      <div style={caja}>
        <h2 style={{ margin: '0 0 16px' }}>Nuevo alimento</h2>
        {errCat && <p style={{ padding: 10, borderRadius: 6, background: '#fdecea', color: '#a32117' }}>{errCat}</p>}
        <FormAlimento categorias={categorias} existentes={alimentos} conCantidad onGuardado={cargarAlimentos} />
      </div>

      <form onSubmit={guardarReceta} style={caja}>
        <h2 style={{ margin: '0 0 16px' }}>Nueva receta</h2>
        <label style={fila}>Nombre
          <input style={campo} required value={fr.nombre} onChange={e => setFr({ ...fr, nombre: e.target.value })} />
        </label>
        <label style={fila}>Instrucciones
          <textarea style={{ ...campo, minHeight: 90 }} required value={fr.instrucciones}
            onChange={e => setFr({ ...fr, instrucciones: e.target.value })} />
        </label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ ...fila, flex: 1 }}>Tiempo (min)
            <input style={campo} type="number" min="0" value={fr.tiempo_preparacion}
              onChange={e => setFr({ ...fr, tiempo_preparacion: e.target.value })} />
          </label>
          <label style={{ ...fila, flex: 1 }}>Porciones que rinde
            <input style={campo} type="number" min="1" max="20" required value={fr.porciones}
              onChange={e => setFr({ ...fr, porciones: e.target.value })} />
          </label>
        </div>
        <div style={fila}>Tipo de comida
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
            {TIPOS.map(t => (
              <label key={t.id}>
                <input type="checkbox" checked={fr.tipos_comida.includes(t.id)} onChange={() => alternarTipo(t.id)} /> {t.etiqueta}
              </label>
            ))}
          </div>
        </div>

        <div style={fila}>
          <strong>Ingredientes</strong> <small>(cantidad para la receta completa, según las porciones indicadas)</small>
          {ings.map((ing, i) => (
            <div key={i} style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select style={{ flex: 2, minWidth: 160, padding: 6 }} value={ing.nuevo ? '__nuevo' : ing.alimento_id}
                  onChange={e => elegirAlimento(i, e.target.value)}>
                  <option value="">Alimento...</option>
                  {alimentos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  <option value="__nuevo">➕ Agregar un alimento nuevo...</option>
                </select>
                <CampoCantidad alimento={alimentos.find(a => String(a.id) === String(ing.alimento_id))}
                  cantidad={ing.cantidad} unidad={ing.unidad} peso={ing.peso}
                  onCambio={c => setIngs(p => p.map((x, idx) => (idx === i ? { ...x, ...c } : x)))} />
                {ings.length > 1 && (
                  <button type="button" onClick={() => setIngs(p => p.filter((_, idx) => idx !== i))}>Quitar</button>
                )}
              </div>
              {ing.nuevo && (
                <div style={{ border: '1px dashed #999', borderRadius: 6, padding: 12, marginTop: 8 }}>
                  <strong>Nuevo alimento para esta receta</strong>
                  <p style={{ margin: '4px 0 12px', fontSize: '0.8rem' }}>
                    Se agrega al catálogo (no a tu despensa) y queda seleccionado en este ingrediente.
                  </p>
                  <FormAlimento categorias={categorias} onGuardado={c => alimentoCreado(i, c)}
                    onCancelar={() => cambiarIng(i, 'nuevo', false)} />
                </div>
              )}
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <button type="button" onClick={() => setIngs(p => [...p, { alimento_id: '', cantidad: '', unidad: '', peso: '', nuevo: false }])}>
              + Agregar otro ingrediente
            </button>
          </div>
        </div>
        <button type="submit">Guardar receta</button>
        {aviso(msgR)}
      </form>
    </div>
  );
}

export default Agregar;
