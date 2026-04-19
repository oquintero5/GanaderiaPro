import { useState, useEffect } from "react";
import { listarLeche, crearRegistroLeche } from "../api";

function Lecheria({ finca_id }) {
  const [registros, setRegistros] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    fecha: "",
    litros: "",
    precioLitro: "",
    frecuenciaPago: "Mensual",
  });

  useEffect(() => {
    if (finca_id) cargarRegistros();
  }, [finca_id]);

  const cargarRegistros = async () => {
    const data = await listarLeche(finca_id);
    if (Array.isArray(data)) setRegistros(data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const agregarRegistro = async () => {
    if (!form.fecha || !form.litros || !form.precioLitro) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }
    try {
      await crearRegistroLeche({
        finca_id,
        fecha: form.fecha,
        litros: parseFloat(form.litros),
        precio_litro: parseFloat(form.precioLitro),
        frecuencia_pago: form.frecuenciaPago,
      });
      await cargarRegistros();
      setForm({ fecha: "", litros: "", precioLitro: "", frecuenciaPago: "Mensual" });
      setMostrarForm(false);
      alert("¡Registro de leche agregado!");
    } catch (e) {
      alert("Error al guardar el registro");
    }
  };

  const totalLitros = registros.reduce((acc, r) => acc + parseFloat(r.litros || 0), 0);
  const totalIngresos = registros.reduce(
    (acc, r) => acc + parseFloat(r.litros || 0) * parseFloat(r.precio_litro || 0),
    0
  );
  const promedioDiario = registros.length > 0 ? totalLitros / registros.length : 0;

  const registrosPorMes = registros.reduce((acc, r) => {
    const mes = r.fecha.substring(0, 7);
    if (!acc[mes]) acc[mes] = { litros: 0, ingresos: 0, dias: 0 };
    acc[mes].litros += parseFloat(r.litros || 0);
    acc[mes].ingresos += parseFloat(r.litros || 0) * parseFloat(r.precio_litro || 0);
    acc[mes].dias += 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-gray-500 text-sm">Total Litros</p>
          <p className="text-3xl font-bold text-green-700">{totalLitros.toFixed(1)}</p>
          <p className="text-gray-400 text-xs">litros</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-gray-500 text-sm">Promedio Diario</p>
          <p className="text-3xl font-bold text-blue-600">{promedioDiario.toFixed(1)}</p>
          <p className="text-gray-400 text-xs">litros/día</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-gray-500 text-sm">Total Ingresos</p>
          <p className="text-2xl font-bold text-green-600">${totalIngresos.toLocaleString()}</p>
          <p className="text-gray-400 text-xs">acumulado</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-gray-500 text-sm">Días Registrados</p>
          <p className="text-3xl font-bold text-purple-600">{registros.length}</p>
          <p className="text-gray-400 text-xs">días</p>
        </div>
      </div>

      {registros.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-green-700 mb-3">💵 Pago Estimado por Frecuencia</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-gray-500 text-xs">Semanal</p>
              <p className="text-lg font-bold text-green-600">${(totalIngresos / (registros.length / 7)).toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-gray-500 text-xs">Quincenal</p>
              <p className="text-lg font-bold text-green-600">${(totalIngresos / (registros.length / 15)).toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-gray-500 text-xs">Mensual</p>
              <p className="text-lg font-bold text-green-600">${(totalIngresos / (registros.length / 30)).toFixed(0)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg transition duration-200">
          {mostrarForm ? "Cancelar" : "➕ Registrar Producción del Día"}
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-green-700 mb-4">🥛 Registro Diario de Leche</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Fecha *</label>
              <input type="date" name="fecha" value={form.fecha} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Litros producidos *</label>
              <input type="number" name="litros" placeholder="Ej: 25.5" value={form.litros} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Precio por litro *</label>
              <input type="number" name="precioLitro" placeholder="Ej: 1200" value={form.precioLitro} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Frecuencia de pago</label>
              <select name="frecuenciaPago" value={form.frecuenciaPago} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500">
                <option value="Semanal">Semanal</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Mensual">Mensual</option>
              </select>
            </div>
            <button onClick={agregarRegistro}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition duration-200">
              💾 Guardar Registro
            </button>
          </div>
        </div>
      )}

      {Object.keys(registrosPorMes).length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-700 mb-3">📊 Resumen por Mes</h3>
          <div className="space-y-3">
            {Object.entries(registrosPorMes).sort().reverse().map(([mes, datos]) => (
              <div key={mes} className="bg-white rounded-xl shadow p-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-green-700">{mes}</h4>
                  <span className="text-gray-500 text-sm">{datos.dias} días registrados</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Total Litros</p>
                    <p className="font-bold text-blue-600">{datos.litros.toFixed(1)} L</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Promedio/día</p>
                    <p className="font-bold text-purple-600">{(datos.litros / datos.dias).toFixed(1)} L</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Ingresos</p>
                    <p className="font-bold text-green-600">${datos.ingresos.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="font-bold text-gray-700 mb-3">📋 Registros Diarios</h3>
      {registros.length === 0 ? (
        <div className="text-center text-gray-400 mt-10">
          <p className="text-6xl">🥛</p>
          <p className="text-xl mt-4">No hay registros de leche aún</p>
          <p className="text-sm mt-2">Haz clic en "Registrar Producción del Día" para comenzar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {registros.sort((a, b) => b.fecha.localeCompare(a.fecha)).map((registro) => (
            <div key={registro.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800">📅 {registro.fecha}</p>
                <p className="text-gray-500 text-sm">💰 Precio: ${parseFloat(registro.precio_litro).toLocaleString()}/L</p>
                <p className="text-gray-500 text-sm">🔄 Pago: {registro.frecuencia_pago}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{parseFloat(registro.litros).toFixed(1)} L</p>
                <p className="text-green-600 font-semibold">${(parseFloat(registro.litros) * parseFloat(registro.precio_litro)).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Lecheria;