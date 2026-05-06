import { useState, useEffect } from "react";
import { listarObreros, crearObrero, actualizarPagoObrero } from "../api";

function Obreros({ finca_id }) {
  const [obreros, setObreros] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    dias_trabajados: "",
    precio_jornal: "",
    fecha: "",
    comentario: "",
    pagado: false,
  });

  useEffect(() => {
    if (finca_id) cargarObreros();
  }, [finca_id]);

  const cargarObreros = async () => {
    try {
      const data = await listarObreros(finca_id);
      if (Array.isArray(data)) setObreros(data);
    } catch (e) {
      console.error("Error cargando obreros", e);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const totalAPagar = () => {
    const dias = parseFloat(form.dias_trabajados || 0);
    const jornal = parseFloat(form.precio_jornal || 0);
    return dias * jornal;
  };

  const agregarObrero = async () => {
    if (!form.nombre || !form.dias_trabajados || !form.precio_jornal || !form.fecha) {
      alert("Por favor completa los campos obligatorios");
      return;
    }
    try {
      await crearObrero({
        finca_id,
        nombre: form.nombre,
        dias_trabajados: parseFloat(form.dias_trabajados),
        precio_jornal: parseFloat(form.precio_jornal),
        total_pagar: totalAPagar(),
        fecha: form.fecha,
        comentario: form.comentario,
        pagado: false,
      });
      await cargarObreros();
      setForm({ nombre: "", dias_trabajados: "", precio_jornal: "", fecha: "", comentario: "", pagado: false });
      setMostrarForm(false);
      alert("¡Obrero registrado exitosamente!");
    } catch (e) {
      alert("Error al guardar el obrero");
    }
  };

  const togglePago = async (obrero) => {
    try {
      await actualizarPagoObrero(obrero.id, { ...obrero, pagado: !obrero.pagado });
      await cargarObreros();
    } catch (e) {
      alert("Error al actualizar el pago");
    }
  };

  const totalPendiente = obreros
    .filter((o) => !o.pagado)
    .reduce((acc, o) => acc + parseFloat(o.total_pagar || 0), 0);

  return (
    <div>
      {/* Resumen */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-xl shadow p-4 flex justify-between items-center">
          <p className="text-yellow-700 font-bold text-base">👷 Total Pendiente de Pago</p>
          <p className="text-yellow-600 font-bold text-xl">${totalPendiente.toLocaleString()}</p>
        </div>
      </div>

      {/* Botón agregar */}
      <div className="text-center mb-4">
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-red-700 hover:bg-red-800 text-white font-bold px-8 py-3 rounded-lg transition duration-200">
          {mostrarForm ? "Cancelar" : "➕ Agregar Obrero"}
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-4 mb-4 max-w-lg mx-auto">
          <h2 className="text-lg font-bold text-red-800 mb-4">Registrar Obrero</h2>
          <div className="space-y-3">

            <input name="nombre" placeholder="Nombre del obrero *" value={form.nombre} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600" />

            <input name="dias_trabajados" type="number" placeholder="Días trabajados *" value={form.dias_trabajados} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600" />

            <input name="precio_jornal" type="number" placeholder="Precio del jornal *" value={form.precio_jornal} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600" />

            {/* Total calculado automáticamente */}
            {form.dias_trabajados && form.precio_jornal && (
              <div className="bg-red-50 border border-green-300 rounded-lg px-4 py-3">
                <p className="text-red-800 font-bold text-center">
                  Total a pagar: ${totalAPagar().toLocaleString()}
                </p>
              </div>
            )}

            <input
              name="fecha"
              type="text"
              placeholder="Fecha (AAAA-MM-DD) *"
              value={form.fecha}
              onFocus={(e) => e.target.type = "date"}
              onBlur={(e) => { if (!form.fecha) e.target.type = "text" }}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600"
            />

            <input name="comentario" placeholder="Comentario (opcional)" value={form.comentario} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600" />

            <button onClick={agregarObrero}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-lg transition duration-200">
              Guardar Obrero
            </button>
          </div>
        </div>
      )}

      {/* Lista de obreros */}
      {obreros.length === 0 ? (
        <div className="text-center text-gray-400 mt-10">
          <p className="text-6xl">👷</p>
          <p className="text-xl mt-4">No hay obreros registrados aún</p>
          <p className="text-sm mt-2">Haz clic en "Agregar Obrero" para comenzar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {obreros.map((obrero) => (
            <div key={obrero.id}
              className={`bg-white rounded-xl shadow p-4 border-l-4 ${obrero.pagado ? "border-red-600" : "border-red-500"}`}>
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-base">👷 {obrero.nombre}</p>
                  <p className="text-gray-500 text-sm">📅 {obrero.fecha}</p>
                  <p className="text-gray-500 text-sm">🗓 {obrero.dias_trabajados} días × ${parseFloat(obrero.precio_jornal).toLocaleString()}</p>
                  <p className="font-bold text-gray-700 text-sm mt-1">Total: ${parseFloat(obrero.total_pagar).toLocaleString()}</p>
                  {obrero.comentario && <p className="text-gray-400 text-xs mt-1">💬 {obrero.comentario}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => togglePago(obrero)}
                    className={`px-3 py-2 rounded-lg font-bold text-white text-sm whitespace-nowrap ${obrero.pagado ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"}`}>
                    {obrero.pagado ? "✅ Pagado" : "❌ Pendiente"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Obreros;