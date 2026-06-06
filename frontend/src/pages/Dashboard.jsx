import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { QRCodeSVG } from "qrcode.react";
import { listarAnimales, crearAnimal, agregarHistorial, listarHistorial, actualizarAnimal, actualizarHistorial, crearFinanza, eliminarAnimal } from "../api";
import { GRAD, GRAD_HOVER, INPUT_CLASS, COLORS } from "../shared";
import { toast } from "../toast";

const Insumos  = lazy(() => import("./Insumos"));
const Finanzas = lazy(() => import("./Finanzas"));
const Lecheria = lazy(() => import("./Lecheria"));
const Obreros  = lazy(() => import("./Obreros"));

function BtnPrimario({ onClick, disabled, children, className = "" }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ background: hover ? GRAD_HOVER : GRAD }}
      className={`text-white font-semibold rounded-lg transition-all duration-200 shadow-sm disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

function ModalConfirmar({ mensaje, onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <p className="text-5xl text-center mb-4">⚠️</p>
        <p className="text-gray-700 font-medium text-center mb-6 text-sm leading-relaxed">{mensaje}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancelar}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition text-sm">
            Cancelar
          </button>
          <button onClick={onConfirmar}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition text-sm">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

const FORM_INICIAL = { nombre: "", chapeta: "", edad: "", peso: "", sexo: "", raza: "", crias: "" };
const SALUD_INICIAL = { fecha: "", tipo: "", producto: "", dosis: "", observaciones: "" };
const TIPOS_SALUD = ["Vacuna", "Vitamina", "Purga", "Medicamento", "Otro"];
const NAV_ITEMS = [
  { key: "lecheria", label: "🥛 Lechería" },
  { key: "inicio",   label: "🐄 Ganado" },
  { key: "insumos",  label: "🌱 Insumos" },
  { key: "obreros",  label: "👷 Obreros" },
  { key: "finanzas", label: "💰 Finanzas" },
];

function Dashboard({ finca, onLogout }) {
  const [animales, setAnimales] = useState([]);
  const [mostrarFormAnimal, setMostrarFormAnimal] = useState(false);
  const [vista, setVista] = useState("inicio");
  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);
  const [vistaAnimal, setVistaAnimal] = useState("info");
  const [cargando, setCargando] = useState(false);
  const [cargandoSalud, setCargandoSalud] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editandoAnimal, setEditandoAnimal] = useState(false);
  const [formEditar, setFormEditar] = useState({});
  const [editandoRegistroId, setEditandoRegistroId] = useState(null);
  const [formEditarRegistro, setFormEditarRegistro] = useState({});
  const [nuevoRegistroSalud, setNuevoRegistroSalud] = useState(SALUD_INICIAL);
  const [form, setForm] = useState(FORM_INICIAL);
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);

  useEffect(() => {
    if (finca?.finca_id) cargarAnimales();
  }, [finca]);

  const cargarAnimales = async () => {
    setCargandoLista(true);
    const data = await listarAnimales(finca.finca_id);
    if (Array.isArray(data)) setAnimales(data.map((a) => ({ ...a, historialSalud: [] })));
    setCargandoLista(false);
  };

  const handleChange = useCallback(
    (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })), []
  );

  const agregarAnimal = async () => {
    if (!form.nombre || !form.chapeta || !form.edad || !form.peso || !form.sexo || !form.raza) {
      toast.error("Por favor completa todos los campos obligatorios"); return;
    }
    setCargando(true);
    try {
      const respuesta = await crearAnimal({
        finca_id: finca.finca_id, nombre: form.nombre, chapeta: form.chapeta,
        edad: parseFloat(form.edad), peso: parseFloat(form.peso),
        sexo: form.sexo, raza: form.raza, crias: parseInt(form.crias || 0),
      });
      if (respuesta.animal_id) {
        await cargarAnimales();
        setForm(FORM_INICIAL);
        setMostrarFormAnimal(false);
        toast.success("¡Animal registrado exitosamente!");
      }
    } catch { toast.error("Error al guardar el animal"); }
    setCargando(false);
  };

  const confirmarEliminarAnimal = (animal, e) => { e.stopPropagation(); setConfirmarEliminar(animal); };

  const ejecutarEliminarAnimal = async () => {
    const animal = confirmarEliminar;
    setConfirmarEliminar(null);
    try {
      await eliminarAnimal(animal.id);
      setAnimales((prev) => prev.filter((a) => a.id !== animal.id));
      toast.success(`${animal.nombre} eliminado correctamente`);
    } catch { toast.error("Error al eliminar el animal"); }
  };

  const agregarRegistroSalud = async () => {
    if (!nuevoRegistroSalud.fecha || !nuevoRegistroSalud.tipo || !nuevoRegistroSalud.producto) {
      toast.error("Por favor completa los campos obligatorios"); return;
    }
    setCargandoSalud(true);
    try {
      await agregarHistorial({ animal_id: animalSeleccionado.id, ...nuevoRegistroSalud });
      const historial = await listarHistorial(animalSeleccionado.id);
      setAnimalSeleccionado((prev) => ({ ...prev, historialSalud: Array.isArray(historial) ? historial : [] }));
      setNuevoRegistroSalud(SALUD_INICIAL);
      toast.success("¡Registro de salud agregado!");
    } catch { toast.error("Error al guardar el registro de salud"); }
    setCargandoSalud(false);
  };

  const guardarEdicionAnimal = async () => {
    setCargando(true);
    try {
      await actualizarAnimal(animalSeleccionado.id, {
        finca_id: finca?.finca_id, nombre: formEditar.nombre, chapeta: formEditar.chapeta,
        edad: parseFloat(formEditar.edad), peso: parseFloat(formEditar.peso),
        sexo: animalSeleccionado.sexo, raza: formEditar.raza, crias: parseInt(formEditar.crias || 0),
      });
      const historial = await listarHistorial(animalSeleccionado.id);
      setAnimalSeleccionado((prev) => ({ ...prev, ...formEditar, historialSalud: Array.isArray(historial) ? historial : [] }));
      setAnimales((prev) => prev.map((a) => a.id === animalSeleccionado.id ? { ...a, ...formEditar } : a));
      setEditandoAnimal(false);
      toast.success("¡Animal actualizado exitosamente!");
    } catch { toast.error("Error al actualizar el animal"); }
    setCargando(false);
  };

  const guardarEdicionRegistro = async (registroId) => {
    try {
      await actualizarHistorial(registroId, { animal_id: animalSeleccionado.id, ...formEditarRegistro });
      const historial = await listarHistorial(animalSeleccionado.id);
      setAnimalSeleccionado((prev) => ({ ...prev, historialSalud: Array.isArray(historial) ? historial : [] }));
      setEditandoRegistroId(null);
      toast.success("¡Registro actualizado!");
    } catch { toast.error("Error al actualizar el registro"); }
  };

  const agregarInsumoConFinanzas = useCallback(async (insumo) => {
    try {
      await crearFinanza({
        finca_id: finca?.finca_id, tipo: "Gasto", categoria: "Compra de Insumos",
        descripcion: `${insumo.nombre} - ${insumo.cantidad} ${insumo.unidad}`,
        monto: parseFloat(insumo.precio) * parseFloat(insumo.cantidad),
        fecha: new Date().toISOString().split("T")[0],
      });
    } catch (e) { console.error("Error al guardar gasto en finanzas", e); }
  }, [finca]);

  const machos = useMemo(() => animales.filter((a) => a.sexo === "Macho").length, [animales]);
  const hembras = useMemo(() => animales.filter((a) => a.sexo === "Hembra").length, [animales]);
  const animalesFiltrados = useMemo(() =>
    busqueda.trim()
      ? animales.filter((a) => a.nombre.toLowerCase().includes(busqueda.toLowerCase()) || a.chapeta.toLowerCase().includes(busqueda.toLowerCase()))
      : animales,
    [animales, busqueda]
  );
  const infoQR = useMemo(() =>
    animalSeleccionado
      ? `AgroGanaderíaPro\nAnimal: ${animalSeleccionado.nombre}\nChapeta: ${animalSeleccionado.chapeta}\nRaza: ${animalSeleccionado.raza}\nEdad: ${animalSeleccionado.edad} años\nPeso: ${animalSeleccionado.peso} kg\nSexo: ${animalSeleccionado.sexo}\nFinca: ${finca?.nombreFinca}`
      : "", [animalSeleccionado, finca]
  );
  const seleccionarAnimal = useCallback(async (animal) => {
    const historial = await listarHistorial(animal.id);
    setAnimalSeleccionado({ ...animal, historialSalud: Array.isArray(historial) ? historial : [] });
    setFormEditar({ nombre: animal.nombre, chapeta: animal.chapeta, edad: animal.edad, peso: animal.peso, raza: animal.raza, crias: animal.crias || 0 });
    setEditandoAnimal(false);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: COLORS.bg }}>
      {confirmarEliminar && (
        <ModalConfirmar
          mensaje={`¿Eliminar a ${confirmarEliminar.nombre} (chapeta: ${confirmarEliminar.chapeta})? Esta acción no se puede deshacer.`}
          onConfirmar={ejecutarEliminarAnimal}
          onCancelar={() => setConfirmarEliminar(null)}
        />
      )}

      {/* HEADER */}
      <div style={{ background: GRAD }} className="text-white py-4 px-4 shadow-lg">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex-1" />
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-wide drop-shadow">🐄 {finca?.nombreFinca || "Mi Finca"}</h1>
            <p className="text-green-200 text-xs mt-0.5 tracking-wider uppercase">AgroGanaderíaPro</p>
          </div>
          <div className="flex-1 flex justify-end">
            <button onClick={onLogout} className="text-green-300 hover:text-white text-sm font-medium transition">
              Salir →
            </button>
          </div>
        </div>
      </div>

      {animalSeleccionado ? (
        <div className="px-4 py-4 max-w-2xl mx-auto">
          <button
            onClick={() => { setAnimalSeleccionado(null); setVistaAnimal("info"); setEditandoAnimal(false); }}
            className="mb-4 font-medium text-sm hover:underline flex items-center gap-1"
            style={{ color: COLORS.primary }}>
            ← Volver al listado
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{animalSeleccionado.nombre}</h2>
                <p className="text-gray-400 text-sm mt-0.5">Chapeta: {animalSeleccionado.chapeta}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${animalSeleccionado.sexo === "Macho" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"}`}>
                {animalSeleccionado.sexo}
              </span>
            </div>

            <div className="flex gap-2 mb-5 overflow-x-auto">
              {[["info","📋 Información"],["salud","💉 Salud"],["qr","📱 QR"]].map(([key, label]) => (
                <button key={key} onClick={() => setVistaAnimal(key)}
                  style={vistaAnimal === key ? { background: GRAD, color: "white" } : {}}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition duration-200 ${vistaAnimal !== key ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : ""}`}>
                  {label}
                </button>
              ))}
            </div>

            {vistaAnimal === "info" && (
              <div>
                {!editandoAnimal ? (
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ["Edad", `${animalSeleccionado.edad} años`, "🎂"],
                        ["Peso", `${animalSeleccionado.peso} kg`, "⚖️"],
                        ["Raza", animalSeleccionado.raza, "🐮"],
                        ...(animalSeleccionado.sexo === "Hembra" ? [["Crías", animalSeleccionado.crias || 0, "🍼"]] : [])
                      ].map(([label, val, icon]) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <p className="text-gray-400 text-xs mb-1">{label}</p>
                          <p className="font-semibold text-gray-800">{icon} {val}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <BtnPrimario onClick={() => { setFormEditar({ nombre: animalSeleccionado.nombre, chapeta: animalSeleccionado.chapeta, edad: animalSeleccionado.edad, peso: animalSeleccionado.peso, raza: animalSeleccionado.raza, crias: animalSeleccionado.crias || 0 }); setEditandoAnimal(true); }} className="py-2.5 text-sm">
                        ✏️ Editar
                      </BtnPrimario>
                      <button onClick={() => setConfirmarEliminar(animalSeleccionado)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 rounded-lg transition text-sm border border-red-100">
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-700 text-sm">Editar Animal</h3>
                    {["nombre","chapeta","edad","peso","raza"].map(field => (
                      <input key={field} placeholder={field.charAt(0).toUpperCase()+field.slice(1)} value={formEditar[field] || ""}
                        onChange={(e) => setFormEditar((prev) => ({ ...prev, [field]: e.target.value }))}
                        className={INPUT_CLASS} />
                    ))}
                    {animalSeleccionado.sexo === "Hembra" && (
                      <input placeholder="Número de crías" value={formEditar.crias}
                        onChange={(e) => setFormEditar((prev) => ({ ...prev, crias: e.target.value }))}
                        className={INPUT_CLASS} />
                    )}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <BtnPrimario onClick={guardarEdicionAnimal} disabled={cargando} className="py-2.5 text-sm">
                        {cargando ? "Guardando..." : "💾 Guardar"}
                      </BtnPrimario>
                      <button onClick={() => setEditandoAnimal(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg text-sm transition">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {vistaAnimal === "salud" && (
              <div>
                <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <h3 className="font-semibold text-gray-700 text-sm">Agregar Registro</h3>
                  <input type="date" value={nuevoRegistroSalud.fecha}
                    onChange={(e) => setNuevoRegistroSalud((prev) => ({ ...prev, fecha: e.target.value }))} className={INPUT_CLASS} />
                  <select value={nuevoRegistroSalud.tipo}
                    onChange={(e) => setNuevoRegistroSalud((prev) => ({ ...prev, tipo: e.target.value }))} className={INPUT_CLASS}>
                    <option value="">Tipo de tratamiento *</option>
                    {TIPOS_SALUD.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input placeholder="Producto o medicamento *" value={nuevoRegistroSalud.producto}
                    onChange={(e) => setNuevoRegistroSalud((prev) => ({ ...prev, producto: e.target.value }))} className={INPUT_CLASS} />
                  <input placeholder="Dosis" value={nuevoRegistroSalud.dosis}
                    onChange={(e) => setNuevoRegistroSalud((prev) => ({ ...prev, dosis: e.target.value }))} className={INPUT_CLASS} />
                  <textarea placeholder="Observaciones" value={nuevoRegistroSalud.observaciones}
                    onChange={(e) => setNuevoRegistroSalud((prev) => ({ ...prev, observaciones: e.target.value }))}
                    className={INPUT_CLASS} rows={2} />
                  <BtnPrimario onClick={agregarRegistroSalud} disabled={cargandoSalud} className="w-full py-2.5 text-sm">
                    {cargandoSalud ? "Guardando..." : "💉 Agregar Registro"}
                  </BtnPrimario>
                </div>

                <h3 className="font-semibold text-gray-700 text-sm mb-3">Historial ({animalSeleccionado.historialSalud.length} registros)</h3>
                {animalSeleccionado.historialSalud.length === 0 ? (
                  <p className="text-gray-400 text-center py-6 text-sm">No hay registros de salud aún</p>
                ) : (
                  <div className="space-y-2">
                    {animalSeleccionado.historialSalud.map((registro) => (
                      <div key={registro.id} className="bg-white rounded-xl p-4 border border-gray-100 border-l-4" style={{ borderLeftColor: COLORS.primaryLight }}>
                        {editandoRegistroId === registro.id ? (
                          <div className="space-y-2">
                            <input type="date" value={formEditarRegistro.fecha} onChange={(e) => setFormEditarRegistro((prev) => ({ ...prev, fecha: e.target.value }))} className={INPUT_CLASS} />
                            <select value={formEditarRegistro.tipo} onChange={(e) => setFormEditarRegistro((prev) => ({ ...prev, tipo: e.target.value }))} className={INPUT_CLASS}>
                              {TIPOS_SALUD.map(t => <option key={t}>{t}</option>)}
                            </select>
                            <input placeholder="Producto" value={formEditarRegistro.producto} onChange={(e) => setFormEditarRegistro((prev) => ({ ...prev, producto: e.target.value }))} className={INPUT_CLASS} />
                            <input placeholder="Dosis" value={formEditarRegistro.dosis} onChange={(e) => setFormEditarRegistro((prev) => ({ ...prev, dosis: e.target.value }))} className={INPUT_CLASS} />
                            <textarea placeholder="Observaciones" value={formEditarRegistro.observaciones} onChange={(e) => setFormEditarRegistro((prev) => ({ ...prev, observaciones: e.target.value }))} className={INPUT_CLASS} rows={2} />
                            <div className="grid grid-cols-2 gap-2">
                              <BtnPrimario onClick={() => guardarEdicionRegistro(registro.id)} className="py-2 text-sm">💾 Guardar</BtnPrimario>
                              <button onClick={() => setEditandoRegistroId(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg text-sm transition">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-semibold text-sm" style={{ color: COLORS.primary }}>{registro.tipo}</span>
                                <span className="text-gray-400 text-xs ml-2">{registro.fecha}</span>
                              </div>
                              <button onClick={() => { setEditandoRegistroId(registro.id); setFormEditarRegistro({ fecha: registro.fecha, tipo: registro.tipo, producto: registro.producto, dosis: registro.dosis || "", observaciones: registro.observaciones || "" }); }}
                                className="text-xs font-medium hover:underline" style={{ color: COLORS.primaryLight }}>✏️ Editar</button>
                            </div>
                            <p className="text-gray-600 text-sm mt-1">💊 {registro.producto}</p>
                            {registro.dosis && <p className="text-gray-400 text-xs mt-0.5">Dosis: {registro.dosis}</p>}
                            {registro.observaciones && <p className="text-gray-400 text-xs mt-0.5">📝 {registro.observaciones}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {vistaAnimal === "qr" && (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-4 text-sm">Escanea para ver la información de este animal</p>
                <div className="flex justify-center mb-4 p-4 bg-white border border-gray-100 rounded-2xl inline-block">
                  <QRCodeSVG value={infoQR} size={180} />
                </div>
                <BtnPrimario onClick={() => window.print()} className="mt-2 px-6 py-2.5 text-sm">🖨️ Imprimir QR</BtnPrimario>
              </div>
            )}
          </div>
        </div>

      ) : (
        <div className="px-4 py-4 max-w-5xl mx-auto">
          {/* NAV */}
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            {NAV_ITEMS.map(({ key, label }) => (
              <button key={key} onClick={() => setVista(key)}
                style={vista === key ? { background: GRAD, color: "white" } : {}}
                className={`py-2 px-4 rounded-lg font-medium text-sm whitespace-nowrap transition duration-200 ${vista === key ? "shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700"}`}>
                {label}
              </button>
            ))}
          </div>

          <Suspense fallback={
            <div className="text-center py-10 text-gray-400">
              <div className="inline-block w-7 h-7 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-3" />
              <p className="text-sm">Cargando...</p>
            </div>
          }>
            {vista === "inicio" && (
              <div>
                <div className="mb-4">
                  <input type="text" placeholder="🔍 Buscar por nombre o chapeta..."
                    value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-400 bg-white shadow-sm text-sm" />
                </div>

                {/* STATS */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Total", value: animales.length, color: COLORS.primary },
                    { label: "Machos", value: machos, color: "#2563eb" },
                    { label: "Hembras", value: hembras, color: "#db2777" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
                      <p className="text-gray-400 text-xs mb-1">{label}</p>
                      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center mb-4">
                  <BtnPrimario onClick={() => setMostrarFormAnimal(!mostrarFormAnimal)} className="px-6 py-2.5 text-sm">
                    {mostrarFormAnimal ? "Cancelar" : "＋ Agregar Animal"}
                  </BtnPrimario>
                </div>

                {mostrarFormAnimal && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 max-w-lg mx-auto">
                    <h2 className="text-base font-semibold mb-4 text-gray-800">Registrar Nuevo Animal</h2>
                    <div className="space-y-3">
                      {["nombre","chapeta","edad","peso","raza"].map(field => (
                        <input key={field} name={field} placeholder={field.charAt(0).toUpperCase()+field.slice(1)+" *"} value={form[field]} onChange={handleChange} className={INPUT_CLASS} />
                      ))}
                      <select name="sexo" value={form.sexo} onChange={handleChange} className={INPUT_CLASS}>
                        <option value="">Selecciona Sexo *</option>
                        <option value="Macho">Macho</option>
                        <option value="Hembra">Hembra</option>
                      </select>
                      {form.sexo === "Hembra" && (
                        <input name="crias" placeholder="Número de crías que ha tenido" value={form.crias} onChange={handleChange} className={INPUT_CLASS} />
                      )}
                      <BtnPrimario onClick={agregarAnimal} disabled={cargando} className="w-full py-2.5 text-sm">
                        {cargando ? "Guardando..." : "Guardar Animal"}
                      </BtnPrimario>
                    </div>
                  </div>
                )}

                {cargandoLista ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="inline-block w-7 h-7 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-3" />
                    <p className="text-sm">Cargando animales...</p>
                  </div>
                ) : animalesFiltrados.length === 0 ? (
                  <div className="text-center text-gray-400 mt-12">
                    <p className="text-5xl mb-4">🐄</p>
                    <p className="text-base font-medium text-gray-500">No hay animales registrados aún</p>
                    <p className="text-sm mt-1 text-gray-400">Haz clic en "Agregar Animal" para comenzar</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {animalesFiltrados.map((animal) => (
                      <div key={animal.id}
                        onClick={() => seleccionarAnimal(animal)}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-green-200 transition duration-200 cursor-pointer relative group">
                        <button
                          onClick={(e) => confirmarEliminarAnimal(animal, e)}
                          className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition text-base opacity-0 group-hover:opacity-100"
                          title="Eliminar">🗑️</button>
                        <div className="flex items-start justify-between pr-6">
                          <div>
                            <h3 className="font-semibold text-gray-800">{animal.nombre}</h3>
                            <p className="text-gray-400 text-xs mt-0.5">Chapeta: {animal.chapeta}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${animal.sexo === "Macho" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"}`}>
                            {animal.sexo}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-gray-500">
                          <span>🎂 {animal.edad} años</span>
                          <span>⚖️ {animal.peso} kg</span>
                          <span>🐮 {animal.raza}</span>
                          {animal.sexo === "Hembra" && <span>🍼 {animal.crias || 0} crías</span>}
                        </div>
                        <p className="text-xs mt-3 font-medium" style={{ color: COLORS.primaryLight }}>Ver detalles →</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {vista === "lecheria" && <Lecheria finca_id={finca?.finca_id} />}
            {vista === "insumos"  && <Insumos onAgregarInsumo={agregarInsumoConFinanzas} finca_id={finca?.finca_id} />}
            {vista === "obreros"  && <Obreros finca_id={finca?.finca_id} />}
            {vista === "finanzas" && <Finanzas finca_id={finca?.finca_id} />}
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
