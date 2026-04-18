import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import Insumos from "./Insumos";
import Finanzas from "./Finanzas";
import { listarAnimales, crearAnimal, agregarHistorial, listarHistorial, actualizarAnimal, actualizarHistorial } from "../api";

function Dashboard({ finca }) {
  const [animales, setAnimales] = useState([]);
  const [registrosFinanzas, setRegistrosFinanzas] = useState([]);
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
  const [nuevoRegistroSalud, setNuevoRegistroSalud] = useState({
    fecha: "", tipo: "", producto: "", dosis: "", observaciones: "",
  });
  const [form, setForm] = useState({
    nombre: "", chapeta: "", edad: "", peso: "", sexo: "", raza: "", crias: "",
  });

  useEffect(() => {
    if (finca?.finca_id) cargarAnimales();
  }, [finca]);

  const cargarAnimales = async () => {
    const data = await listarAnimales(finca.finca_id);
    if (Array.isArray(data)) {
      setAnimales(data.map((a) => ({ ...a, historialSalud: [] })));
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
        setForm({ nombre: "", chapeta: "", edad: "", peso: "", sexo: "", raza: "", crias: "" });
        setMostrarFormAnimal(false);
        alert("¡Animal registrado exitosamente!");
      }
    } catch (e) {
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
      await agregarHistorial({
        animal_id: animalSeleccionado.id,
        ...nuevoRegistroSalud,
      });
      const historial = await listarHistorial(animalSeleccionado.id);
      setAnimalSeleccionado({ ...animalSeleccionado, historialSalud: Array.isArray(historial) ? historial : [] });
      setNuevoRegistroSalud({ fecha: "", tipo: "", producto: "", dosis: "", observaciones: "" });
      alert("¡Registro de salud agregado!");
    } catch (e) {
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
      await cargarAnimales();
      const historial = await listarHistorial(animalSeleccionado.id);
      setAnimalSeleccionado({
        ...animalSeleccionado,
        ...formEditar,
        historialSalud: Array.isArray(historial) ? historial : []
      });
      setEditandoAnimal(false);
      alert("¡Animal actualizado exitosamente!");
    } catch (e) {
      alert("Error al actualizar el animal");
    }
  };

  const guardarEdicionRegistro = async (registroId) => {
    try {
      await actualizarHistorial(registroId, {
        animal_id: animalSeleccionado.id,
        ...formEditarRegistro,
      });
      const historial = await listarHistorial(animalSeleccionado.id);
      setAnimalSeleccionado({
        ...animalSeleccionado,
        historialSalud: Array.isArray(historial) ? historial : []
      });
      setEditandoRegistroId(null);
      alert("¡Registro actualizado exitosamente!");
    } catch (e) {
      alert("Error al actualizar el registro");
    }
  };

  const agregarInsumoConFinanzas = async (insumo) => {
    try {
      const { crearFinanza } = await import("../api");
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
  };

  const machos = animales.filter((a) => a.sexo === "Macho").length;
  const hembras = animales.filter((a) => a.sexo === "Hembra").length;
  const animalesFiltrados = animales.filter((a) =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.chapeta.toLowerCase().includes(busqueda.toLowerCase())
  );

  const infoQR = animalSeleccionado
    ? `AgroGanaderíaPro\nAnimal: ${animalSeleccionado.nombre}\nChapeta: ${animalSeleccionado.chapeta}\nRaza: ${animalSeleccionado.raza}\nEdad: ${animalSeleccionado.edad} años\nPeso: ${animalSeleccionado.peso} kg\nSexo: ${animalSeleccionado.sexo}\nFinca: ${finca?.nombreFinca}`
    : "";

  return (
    <div className="min-h-screen bg-gray-100">

      <div className="bg-green-700 text-white py-6 px-8 shadow-lg">
        <h1 className="text-4xl font-bold text-center">🐄 {finca?.nombreFinca || "Mi Finca"}</h1>
        <p className="text-center text-green-200 mt-1">AgroGanaderíaPro</p>
      </div>

      {animalSeleccionado ? (
        <div className="px-8 py-6 max-w-2xl mx-auto">
          <button onClick={() => { setAnimalSeleccionado(null); setVistaAnimal("info"); setEditandoAnimal(false); }}
            className="mb-4 text-green-600 font-semibold hover:underline">
            ← Volver al listado
          </button>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-3xl font-bold text-green-700">{animalSeleccionado.nombre}</h2>
                <p className="text-gray-500">Chapeta: {animalSeleccionado.chapeta}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${animalSeleccionado.sexo === "Macho" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"}`}>
                {animalSeleccionado.sexo}
              </span>
            </div>

            <div className="flex gap-2 mb-6">
              <button onClick={() => setVistaAnimal("info")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm ${vistaAnimal === "info" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                📋 Información
              </button>
              <button onClick={() => setVistaAnimal("salud")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm ${vistaAnimal === "salud" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                💉 Historial de Salud
              </button>
              <button onClick={() => setVistaAnimal("qr")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm ${vistaAnimal === "qr" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                📱 Código QR
              </button>
            </div>

            {vistaAnimal === "info" && (
              <div>
                {!editandoAnimal ? (
                  <div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-500 text-sm">Edad</p>
                        <p className="text-xl font-bold text-gray-800">🎂 {animalSeleccionado.edad} años</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-500 text-sm">Peso</p>
                        <p className="text-xl font-bold text-gray-800">⚖️ {animalSeleccionado.peso} kg</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-500 text-sm">Raza</p>
                        <p className="text-xl font-bold text-gray-800">🐮 {animalSeleccionado.raza}</p>
                      </div>
                      {animalSeleccionado.sexo === "Hembra" && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-500 text-sm">Crías</p>
                          <p className="text-xl font-bold text-gray-800">🍼 {animalSeleccionado.crias || 0}</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setFormEditar({
                          nombre: animalSeleccionado.nombre,
                          chapeta: animalSeleccionado.chapeta,
                          edad: animalSeleccionado.edad,
                          peso: animalSeleccionado.peso,
                          raza: animalSeleccionado.raza,
                          crias: animalSeleccionado.crias || 0,
                        });
                        setEditandoAnimal(true);
                      }}
                      className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg transition duration-200">
                      ✏️ Editar Información
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-700">Editar Animal</h3>
                    <input placeholder="Nombre *" value={formEditar.nombre}
                      onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                    <input placeholder="Chapeta *" value={formEditar.chapeta}
                      onChange={(e) => setFormEditar({ ...formEditar, chapeta: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                    <input placeholder="Edad (años)" value={formEditar.edad}
                      onChange={(e) => setFormEditar({ ...formEditar, edad: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                    <input placeholder="Peso (kg)" value={formEditar.peso}
                      onChange={(e) => setFormEditar({ ...formEditar, peso: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                    <input placeholder="Raza" value={formEditar.raza}
                      onChange={(e) => setFormEditar({ ...formEditar, raza: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                    {animalSeleccionado.sexo === "Hembra" && (
                      <input placeholder="Número de crías" value={formEditar.crias}
                        onChange={(e) => setFormEditar({ ...formEditar, crias: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => guardarEdicionAnimal()}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition duration-200">
                        💾 Guardar
                      </button>
                      <button onClick={() => setEditandoAnimal(false)}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-lg transition duration-200">
                        Cancelar
                      </button>
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
                    onChange={(e) => setNuevoRegistroSalud({ ...nuevoRegistroSalud, fecha: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                  <select value={nuevoRegistroSalud.tipo}
                    onChange={(e) => setNuevoRegistroSalud({ ...nuevoRegistroSalud, tipo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500">
                    <option value="">Tipo de tratamiento *</option>
                    <option value="Vacuna">Vacuna</option>
                    <option value="Vitamina">Vitamina</option>
                    <option value="Purga">Purga</option>
                    <option value="Medicamento">Medicamento</option>
                    <option value="Otro">Otro</option>
                  </select>
                  <input placeholder="Producto o medicamento *" value={nuevoRegistroSalud.producto}
                    onChange={(e) => setNuevoRegistroSalud({ ...nuevoRegistroSalud, producto: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                  <input placeholder="Dosis" value={nuevoRegistroSalud.dosis}
                    onChange={(e) => setNuevoRegistroSalud({ ...nuevoRegistroSalud, dosis: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                  <textarea placeholder="Observaciones" value={nuevoRegistroSalud.observaciones}
                    onChange={(e) => setNuevoRegistroSalud({ ...nuevoRegistroSalud, observaciones: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" rows={3} />
                  <button onClick={agregarRegistroSalud}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition duration-200">
                    💉 Agregar Registro
                  </button>
                </div>

                <h3 className="font-bold text-gray-700 mb-3">Historial ({animalSeleccionado.historialSalud.length} registros)</h3>
                {animalSeleccionado.historialSalud.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No hay registros de salud aún</p>
                ) : (
                  <div className="space-y-3">
                    {animalSeleccionado.historialSalud.map((registro) => (
                      <div key={registro.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-500">
                        {editandoRegistroId === registro.id ? (
                          <div className="space-y-2">
                            <input type="date" value={formEditarRegistro.fecha}
                              onChange={(e) => setFormEditarRegistro({ ...formEditarRegistro, fecha: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500" />
                            <select value={formEditarRegistro.tipo}
                              onChange={(e) => setFormEditarRegistro({ ...formEditarRegistro, tipo: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500">
                              <option value="Vacuna">Vacuna</option>
                              <option value="Vitamina">Vitamina</option>
                              <option value="Purga">Purga</option>
                              <option value="Medicamento">Medicamento</option>
                              <option value="Otro">Otro</option>
                            </select>
                            <input placeholder="Producto" value={formEditarRegistro.producto}
                              onChange={(e) => setFormEditarRegistro({ ...formEditarRegistro, producto: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500" />
                            <input placeholder="Dosis" value={formEditarRegistro.dosis}
                              onChange={(e) => setFormEditarRegistro({ ...formEditarRegistro, dosis: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500" />
                            <textarea placeholder="Observaciones" value={formEditarRegistro.observaciones}
                              onChange={(e) => setFormEditarRegistro({ ...formEditarRegistro, observaciones: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500" rows={2} />
                            <div className="grid grid-cols-2 gap-2">
                              <button onClick={() => guardarEdicionRegistro(registro.id)}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-sm">
                                💾 Guardar
                              </button>
                              <button onClick={() => setEditandoRegistroId(null)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 rounded-lg text-sm">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-bold text-green-700">{registro.tipo}</span>
                                <span className="text-gray-500 text-sm ml-2">{registro.fecha}</span>
                              </div>
                              <button
                                onClick={() => {
                                  setEditandoRegistroId(registro.id);
                                  setFormEditarRegistro({
                                    fecha: registro.fecha,
                                    tipo: registro.tipo,
                                    producto: registro.producto,
                                    dosis: registro.dosis || "",
                                    observaciones: registro.observaciones || "",
                                  });
                                }}
                                className="text-yellow-500 hover:text-yellow-600 font-semibold text-sm">
                                ✏️ Editar
                              </button>
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
                <p className="text-gray-500 mb-4">Comparte este QR para que cualquier persona pueda ver la información de este animal</p>
                <div className="flex justify-center mb-4">
                  <QRCodeSVG value={infoQR} size={200} />
                </div>
                <p className="text-sm text-gray-400">Escanea con la cámara de tu celular</p>
                <button onClick={() => window.print()}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition duration-200">
                  🖨️ Imprimir QR
                </button>
              </div>
            )}
          </div>
        </div>

      ) : (
        <div className="px-8 py-6">
          <div className="flex justify-center gap-4 mb-6">
            <button onClick={() => setVista("inicio")}
              className={`px-6 py-3 rounded-lg font-bold transition duration-200 ${vista === "inicio" ? "bg-green-600 text-white" : "bg-white text-green-600 border border-green-600"}`}>
              🐄 Ganado
            </button>
            <button onClick={() => setVista("insumos")}
              className={`px-6 py-3 rounded-lg font-bold transition duration-200 ${vista === "insumos" ? "bg-green-600 text-white" : "bg-white text-green-600 border border-green-600"}`}>
              🌱 Insumos
            </button>
            <button onClick={() => setVista("finanzas")}
              className={`px-6 py-3 rounded-lg font-bold transition duration-200 ${vista === "finanzas" ? "bg-green-600 text-white" : "bg-white text-green-600 border border-green-600"}`}>
              💰 Finanzas
            </button>
          </div>

          {vista === "inicio" && (
            <div>
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="🔍 Buscar animal por nombre o chapeta..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 bg-white shadow" />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow p-6 text-center">
                  <p className="text-gray-500 text-sm">Total Animales</p>
                  <p className="text-4xl font-bold text-green-700">{animales.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow p-6 text-center">
                  <p className="text-gray-500 text-sm">Machos</p>
                  <p className="text-4xl font-bold text-blue-600">{machos}</p>
                </div>
                <div className="bg-white rounded-xl shadow p-6 text-center">
                  <p className="text-gray-500 text-sm">Hembras</p>
                  <p className="text-4xl font-bold text-pink-600">{hembras}</p>
                </div>
              </div>

              <div className="text-center mb-6">
                <button onClick={() => setMostrarFormAnimal(!mostrarFormAnimal)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg transition duration-200">
                  {mostrarFormAnimal ? "Cancelar" : "➕ Agregar Animal"}
                </button>
              </div>

              {mostrarFormAnimal && (
                <div className="bg-white rounded-xl shadow p-6 mb-6 max-w-lg mx-auto">
                  <h2 className="text-xl font-bold text-green-700 mb-4">Registrar Nuevo Animal</h2>
                  <div className="space-y-3">
                    <input name="nombre" placeholder="Nombre del animal *" value={form.nombre} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                    <input name="chapeta" placeholder="ID / Chapeta *" value={form.chapeta} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                    <input name="edad" placeholder="Edad (años) *" value={form.edad} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                    <input name="peso" placeholder="Peso en kg *" value={form.peso} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                    <select name="sexo" value={form.sexo} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500">
                      <option value="">Selecciona Sexo *</option>
                      <option value="Macho">Macho</option>
                      <option value="Hembra">Hembra</option>
                    </select>
                    <input name="raza" placeholder="Raza *" value={form.raza} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                    {form.sexo === "Hembra" && (
                      <input name="crias" placeholder="Número de crías que ha tenido" value={form.crias} onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                    )}
                    <button onClick={agregarAnimal} disabled={cargando}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition duration-200 disabled:opacity-50">
                      {cargando ? "Guardando..." : "Guardar Animal"}
                    </button>
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
                      onClick={async () => {
                        const historial = await listarHistorial(animal.id);
                        setAnimalSeleccionado({ ...animal, historialSalud: Array.isArray(historial) ? historial : [] });
                        setFormEditar({
                          nombre: animal.nombre,
                          chapeta: animal.chapeta,
                          edad: animal.edad,
                          peso: animal.peso,
                          raza: animal.raza,
                          crias: animal.crias || 0,
                        });
                        setEditandoAnimal(false);
                      }}
                      className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition duration-200 cursor-pointer hover:border-green-500 border-2 border-transparent">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-green-700">{animal.nombre}</h3>
                          <p className="text-gray-500 text-sm">Chapeta: {animal.chapeta}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${animal.sexo === "Macho" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"}`}>
                          {animal.sexo}
                        </span>
                      </div>
                      <div className="mt-4 space-y-1 text-sm text-gray-600">
                        <p>🎂 Edad: {animal.edad} años</p>
                        <p>⚖️ Peso: {animal.peso} kg</p>
                        <p>🐮 Raza: {animal.raza}</p>
                        {animal.sexo === "Hembra" && <p>🍼 Crías: {animal.crias || 0}</p>}
                      </div>
                      <p className="text-green-500 text-sm mt-3 font-semibold">Ver detalles →</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {vista === "insumos" && (
            <div className="px-8">
              <Insumos onAgregarInsumo={agregarInsumoConFinanzas} finca_id={finca?.finca_id} />
            </div>
          )}

          {vista === "finanzas" && (
            <div className="px-8">
              <Finanzas registrosExternos={registrosFinanzas} onAgregarRegistro={(r) => setRegistrosFinanzas((prev) => [...prev, r])} finca_id={finca?.finca_id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;