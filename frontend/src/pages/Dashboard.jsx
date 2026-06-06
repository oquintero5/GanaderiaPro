import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { QRCodeSVG } from "qrcode.react";
import { listarAnimales, crearAnimal, agregarHistorial, listarHistorial, actualizarAnimal, actualizarHistorial, crearFinanza } from "../api";
import { GRAD, GRAD_HOVER, INPUT_CLASS } from "../shared";

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
      className={`text-white font-bold rounded-lg transition-all duration-200 shadow-md disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
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

function Dashboard({ finca }) {
  const [animales, setAnimales] = useState([]);
  const [mostrarFormAnimal, setMostrarFormAnimal] = useState(false);
  const [vista, setVista] = useState("inicio");
  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);
  const [vistaAnimal, setVistaAnimal] = useState("info");
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editandoAnimal, setEditandoAnimal] = useState(false);
  const [formEditar, setFormEditar] = useState({});
  const [editandoRegistroId, setEditandoRegistroId] = useState(null);
  const [formEditarRegistro, setFormEditarRegistro] = useState({});
  const [nuevoRegistroSalud, setNuevoRegistroSalud] = useState(SALUD_INICIAL);
  const [form, setForm] = useState(FORM_INICIAL);

  useEffect(() => {
    if (finca?.finca_id) cargarAnimales();
  }, [finca]);

  const cargarAnimales = async () => {
    const data = await listarAnimales(finca.finca_id);
    if (Array.isArray(data)) {
      setAnimales(data.map((a) => ({ ...a, historialSalud: [] })));
    }
  };

  const handleChange = useCallback(
    (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })),
    []
  );

  const agregarAnimal = async () => {
    if (!form.nombre || !form.chapeta || !form.edad || !form.peso || !form.sexo || !form.raza) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }
    setCargando(true);
    try {
      const respuesta = await crearAnimal({
        finca_id: finca.finca_id,
        nombre: form.nombre,
        chapeta: form.chapeta,
        edad: parseFloat(form.edad),
        peso: parseFloat(form.peso),
        sexo: form.sexo,
        raza: form.raza,
        crias: parseInt(form.crias || 0),
      });
      if (respuesta.animal_id) {
        await cargarAnimales();
        setForm(FORM_INICIAL);
        setMostrarFormAnimal(false);
        alert("¡Animal registrado exitosamente!");
      }
    } catch {
      alert("Error al guardar el animal");
    }
    setCargando(false);
  };

  const agregarRegistroSalud = async () => {
    if (!nuevoRegistroSalud.fecha || !nuevoRegistroSalud.tipo || !nuevoRegistroSalud.producto) {
      alert("Por favor completa los campos obligatorios");
      return;
    }
    try {
      await agregarHistorial({ animal_id: animalSeleccionado.id, ...nuevoRegistroSalud });
      const historial = await listarHistorial(animalSeleccionado.id);
      setAnimalSeleccionado((prev) => ({ ...prev, historialSalud: Array.isArray(historial) ? historial : [] }));
      setNuevoRegistroSalud(SALUD_INICIAL);
      alert("¡Registro de salud agregado!");
    } catch {
      alert("Error al guardar el registro de salud");
    }
  };

  const guardarEdicionAnimal = async () => {
    try {
      await actualizarAnimal(animalSeleccionado.id, {
        finca_id: finca?.finca_id,
        nombre: formEditar.nombre,
        chapeta: formEditar.chapeta,
        edad: parseFloat(formEditar.edad),
        peso: parseFloat(formEditar.peso),
        sexo: animalSeleccionado.sexo,
        raza: formEditar.raza,
        crias: parseInt(formEditar.crias || 0),
      });
      const historial = await listarHistorial(animalSeleccionado.id);
      setAnimalSeleccionado((prev) => ({ ...prev, ...formEditar, historialSalud: Array.isArray(historial) ? historial : [] }));
      setAnimales((prev) => prev.map((a) => a.id === animalSeleccionado.id ? { ...a, ...formEditar } : a));
      setEditandoAnimal(false);
      alert("¡Animal actualizado exitosamente!");
    } catch {
      alert("Error al actualizar el animal");
    }
  };

  const guardarEdicionRegistro = async (registroId) => {
    try {
      await actualizarHistorial(registroId, { animal_id: animalSeleccionado.id, ...formEditarRegistro });
      const historial = await listarHistorial(animalSeleccionado.id);
      setAnimalSeleccionado((prev) => ({ ...prev, historialSalud: Array.isArray(historial) ? historial : [] }));
      setEditandoRegistroId(null);
      alert("¡Registro actualizado exitosamente!");
    } catch {
      alert("Error al actualizar el registro");
    }
  };

  const agregarInsumoConFinanzas = useCallback(async (insumo) => {
    try {
      await crearFinanza({
        finca_id: finca?.finca_id,
        tipo: "Gasto",
        categoria: "Compra de Insumos",
        descripcion: `${insumo.nombre} - ${insumo.cantidad} ${insumo.unidad}`,
        monto: parseFloat(insumo.precio) * parseFloat(insumo.cantidad),
        fecha: new Date().toISOString().split("T")[0],
      });
    } catch (e) {
      console.error("Error al guardar gasto en finanzas", e);
    }
  }, [finca]);

  const machos = useMemo(() => animales.filter((a) => a.sexo === "Macho").length, [animales]);
  const hembras = useMemo(() => animales.filter((a) => a.sexo === "Hembra").length, [animales]);

  const animalesFiltrados = useMemo(() =>
    busqueda.trim()
      ? animales.filter((a) =>
          a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          a.chapeta.toLowerCase().includes(busqueda.toLowerCase())
        )
      : animales,
    [animales, busqueda]
  );

  const infoQR = useMemo(() =>
    animalSeleccionado
      ? `AgroGanaderíaPro\nAnimal: ${animalSeleccionado.nombre}\nChapeta: ${animalSeleccionado.chapeta}\nRaza: ${animalSeleccionado.raza}\nEdad: ${animalSeleccionado.edad} años\nPeso: ${animalSeleccionado.peso} kg\nSexo: ${animalSeleccionado.sexo}\nFinca: ${finca?.nombreFinca}`
      : "",
    [animalSeleccionado, finca]
  );

  const seleccionarAnimal = useCallback(async (animal) => {
    const historial = await listarHistorial(animal.id);
    setAnimalSeleccionado({ ...animal, historialSalud: Array.isArray(historial) ? historial : [] });
    setFormEditar({ nombre: animal.nombre, chapeta: animal.chapeta, edad: animal.edad, peso: animal.peso, raza: animal.raza, crias: animal.crias || 0 });
    setEditandoAnimal(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div style={{ background: GRAD }} className="text-white py-4 px-4 shadow-lg">
        <h1 className="text-2xl font-bold text-center drop-shadow">🐄 {finca?.nombreFinca || "Mi Finca"}</h1>
        <p className="text-center text-yellow-100 text-sm mt-1 drop-shadow">AgroGanaderíaPro</p>
      </div>

      {animalSeleccionado ? (
        <div className="px-4 py-4 max-w-2xl mx-auto">
          <button
            onClick={() => { setAnimalSeleccionado(null); setVistaAnimal("info"); setEditandoAnimal(false); }}
            className="mb-4 font-semibold hover:underline"
            style={{ color: "#b91c1c" }}>
            ← Volver al listado
          </button>

          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "#b91c1c" }}>{animalSeleccionado.nombre}</h2>
                <p className="text-gray-500 text-sm">Chapeta: {animalSeleccionado.chapeta}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${animalSeleccionado.sexo === "Macho" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"}`}>
                {animalSeleccionado.sexo}
              </span>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto">
              {[["info","📋 Información"],["salud","💉 Salud"],["qr","📱 QR"]].map(([key, label]) => (
                <button key={key} onClick={() => setVistaAnimal(key)}
                  style={vistaAnimal === key ? { background: GRAD, color: "white" } : {}}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition duration-200 ${vistaAnimal !== key ? "bg-gray-100 text-gray-600" : ""}`}>
                  {label}
                </button>
              ))}
            </div>

            {vistaAnimal === "info" && (
              <div>
                {!editandoAnimal ? (
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Edad</p>
                        <p className="text-lg font-bold text-gray-800">🎂 {animalSeleccionado.edad} años</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Peso</p>
                        <p className="text-lg font-bold text-gray-800">⚖️ {animalSeleccionado.peso} kg</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Raza</p>
                        <p className="text-lg font-bold text-gray-800">🐮 {animalSeleccionado.raza}</p>
                      </div>
                      {animalSeleccionado.sexo === "Hembra" && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-500 text-xs">Crías</p>
                          <p className="text-lg font-bold text-gray-800">🍼 {animalSeleccionado.crias || 0}</p>
                        </div>
                      )}
                    </div>
                    <BtnPrimario onClick={() => { setFormEditar({ nombre: animalSeleccionado.nombre, chapeta: animalSeleccionado.chapeta, edad: animalSeleccionado.edad, peso: animalSeleccionado.peso, raza: animalSeleccionado.raza, crias: animalSeleccionado.crias || 0 }); setEditandoAnimal(true); }} className="mt-4 w-full py-3">
                      ✏️ Editar Información
                    </BtnPrimario>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-700">Editar Animal</h3>
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
                    <div className="grid grid-cols-2 gap-3">
                      <BtnPrimario onClick={guardarEdicionAnimal} className="py-3">💾 Guardar</BtnPrimario>
                      <button onClick={() => setEditandoAnimal(false)} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-lg">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {vistaAnimal === "salud" && (
              <div>
                <div className="space-y-3 mb-6">
                  <h3 className="font-bold text-gray-700">Agregar Registro de Salud</h3>
                  <input type="date" value={nuevoRegistroSalud.fecha}
                    onChange={(e) => setNuevoRegistroSalud((prev) => ({ ...prev, fecha: e.target.value }))}
                    className={INPUT_CLASS} />
                  <select value={nuevoRegistroSalud.tipo}
                    onChange={(e) => setNuevoRegistroSalud((prev) => ({ ...prev, tipo: e.target.value }))}
                    className={INPUT_CLASS}>
                    <option value="">Tipo de tratamiento *</option>
                    {TIPOS_SALUD.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input placeholder="Producto o medicamento *" value={nuevoRegistroSalud.producto}
                    onChange={(e) => setNuevoRegistroSalud((prev) => ({ ...prev, producto: e.target.value }))}
                    className={INPUT_CLASS} />
                  <input placeholder="Dosis" value={nuevoRegistroSalud.dosis}
                    onChange={(e) => setNuevoRegistroSalud((prev) => ({ ...prev, dosis: e.target.value }))}
                    className={INPUT_CLASS} />
                  <textarea placeholder="Observaciones" value={nuevoRegistroSalud.observaciones}
                    onChange={(e) => setNuevoRegistroSalud((prev) => ({ ...prev, observaciones: e.target.value }))}
                    className={INPUT_CLASS} rows={3} />
                  <BtnPrimario onClick={agregarRegistroSalud} className="w-full py-3">💉 Agregar Registro</BtnPrimario>
                </div>

                <h3 className="font-bold text-gray-700 mb-3">Historial ({animalSeleccionado.historialSalud.length} registros)</h3>
                {animalSeleccionado.historialSalud.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No hay registros de salud aún</p>
                ) : (
                  <div className="space-y-3">
                    {animalSeleccionado.historialSalud.map((registro) => (
                      <div key={registro.id} className="bg-gray-50 rounded-lg p-4 border-l-4" style={{ borderColor: "#b91c1c" }}>
                        {editandoRegistroId === registro.id ? (
                          <div className="space-y-2">
                            <input type="date" value={formEditarRegistro.fecha}
                              onChange={(e) => setFormEditarRegistro((prev) => ({ ...prev, fecha: e.target.value }))}
                              className={INPUT_CLASS} />
                            <select value={formEditarRegistro.tipo}
                              onChange={(e) => setFormEditarRegistro((prev) => ({ ...prev, tipo: e.target.value }))}
                              className={INPUT_CLASS}>
                              {TIPOS_SALUD.map(t => <option key={t}>{t}</option>)}
                            </select>
                            <input placeholder="Producto" value={formEditarRegistro.producto}
                              onChange={(e) => setFormEditarRegistro((prev) => ({ ...prev, producto: e.target.value }))}
                              className={INPUT_CLASS} />
                            <input placeholder="Dosis" value={formEditarRegistro.dosis}
                              onChange={(e) => setFormEditarRegistro((prev) => ({ ...prev, dosis: e.target.value }))}
                              className={INPUT_CLASS} />
                            <textarea placeholder="Observaciones" value={formEditarRegistro.observaciones}
                              onChange={(e) => setFormEditarRegistro((prev) => ({ ...prev, observaciones: e.target.value }))}
                              className={INPUT_CLASS} rows={2} />
                            <div className="grid grid-cols-2 gap-2">
                              <BtnPrimario onClick={() => guardarEdicionRegistro(registro.id)} className="py-2 text-sm">💾 Guardar</BtnPrimario>
                              <button onClick={() => setEditandoRegistroId(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 rounded-lg text-sm">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-bold" style={{ color: "#b91c1c" }}>{registro.tipo}</span>
                                <span className="text-gray-500 text-sm ml-2">{registro.fecha}</span>
                              </div>
                              <button onClick={() => { setEditandoRegistroId(registro.id); setFormEditarRegistro({ fecha: registro.fecha, tipo: registro.tipo, producto: registro.producto, dosis: registro.dosis || "", observaciones: registro.observaciones || "" }); }}
                                className="text-yellow-600 hover:text-yellow-700 font-semibold text-sm">✏️ Editar</button>
                            </div>
                            <p className="text-gray-700 mt-1">💊 {registro.producto}</p>
                            {registro.dosis && <p className="text-gray-500 text-sm">Dosis: {registro.dosis}</p>}
                            {registro.observaciones && <p className="text-gray-500 text-sm mt-1">📝 {registro.observaciones}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {vistaAnimal === "qr" && (
              <div className="text-center">
                <p className="text-gray-500 mb-4 text-sm">Comparte este QR para ver la información de este animal</p>
                <div className="flex justify-center mb-4">
                  <QRCodeSVG value={infoQR} size={200} />
                </div>
                <p className="text-sm text-gray-400">Escanea con la cámara de tu celular</p>
                <BtnPrimario onClick={() => window.print()} className="mt-4 px-6 py-3">🖨️ Imprimir QR</BtnPrimario>
              </div>
            )}
          </div>
        </div>

      ) : (
        <div className="px-4 py-4">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {NAV_ITEMS.map(({ key, label }) => (
              <button key={key} onClick={() => setVista(key)}
                style={vista === key ? { background: GRAD, color: "white" } : {}}
                className={`py-2 px-4 rounded-lg font-bold text-sm whitespace-nowrap transition duration-200 ${vista === key ? "shadow-md" : "bg-white border text-gray-700 border-gray-300 hover:border-yellow-500 hover:text-yellow-700"}`}>
                {label}
              </button>
            ))}
          </div>

          <Suspense fallback={<div className="text-center py-10 text-gray-400">Cargando...</div>}>
            {vista === "inicio" && (
              <div>
                <div className="mb-4">
                  <input type="text" placeholder="🔍 Buscar por nombre o chapeta..."
                    value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500 bg-white shadow text-base" />
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-white rounded-xl shadow p-3 text-center">
                    <p className="text-gray-500 text-xs mb-1">Total</p>
                    <p className="text-2xl font-bold" style={{ color: "#b91c1c" }}>{animales.length}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow p-3 text-center">
                    <p className="text-gray-500 text-xs mb-1">Machos</p>
                    <p className="text-2xl font-bold text-blue-600">{machos}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow p-3 text-center">
                    <p className="text-gray-500 text-xs mb-1">Hembras</p>
                    <p className="text-2xl font-bold text-pink-600">{hembras}</p>
                  </div>
                </div>

                <div className="flex justify-center mb-4">
                  <BtnPrimario onClick={() => setMostrarFormAnimal(!mostrarFormAnimal)} className="px-8 py-3">
                    {mostrarFormAnimal ? "Cancelar" : "➕ Agregar Animal"}
                  </BtnPrimario>
                </div>

                {mostrarFormAnimal && (
                  <div className="bg-white rounded-xl shadow p-4 mb-4 max-w-lg mx-auto">
                    <h2 className="text-lg font-bold mb-4" style={{ color: "#b91c1c" }}>Registrar Nuevo Animal</h2>
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
                      <BtnPrimario onClick={agregarAnimal} disabled={cargando} className="w-full py-3">
                        {cargando ? "Guardando..." : "Guardar Animal"}
                      </BtnPrimario>
                    </div>
                  </div>
                )}

                {animalesFiltrados.length === 0 ? (
                  <div className="text-center text-gray-400 mt-10">
                    <p className="text-6xl">🐄</p>
                    <p className="text-xl mt-4">No hay animales registrados aún</p>
                    <p className="text-sm mt-2">Haz clic en "Agregar Animal" para comenzar</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {animalesFiltrados.map((animal) => (
                      <div key={animal.id}
                        onClick={() => seleccionarAnimal(animal)}
                        className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition duration-200 cursor-pointer border-2 border-transparent hover:border-yellow-400">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold" style={{ color: "#b91c1c" }}>{animal.nombre}</h3>
                            <p className="text-gray-500 text-sm">Chapeta: {animal.chapeta}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${animal.sexo === "Macho" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"}`}>
                            {animal.sexo}
                          </span>
                        </div>
                        <div className="mt-3 space-y-1 text-sm text-gray-600">
                          <p>🎂 Edad: {animal.edad} años</p>
                          <p>⚖️ Peso: {animal.peso} kg</p>
                          <p>🐮 Raza: {animal.raza}</p>
                          {animal.sexo === "Hembra" && <p>🍼 Crías: {animal.crias || 0}</p>}
                        </div>
                        <p className="text-sm mt-3 font-semibold" style={{ color: "#b91c1c" }}>Ver detalles →</p>
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
