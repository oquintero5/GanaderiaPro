import { useState, useEffect } from "react";
import { listarFinanzas, crearFinanza } from "../api";

function Finanzas({ registrosExternos = [], onAgregarRegistro, finca_id }) {
  const [registrosLocales, setRegistrosLocales] = useState([]);
  const registros = [...registrosExternos, ...registrosLocales];

  useEffect(() => {
    if (finca_id) cargarFinanzas();
  }, [finca_id]);

  const cargarFinanzas = async () => {
    const data = await listarFinanzas(finca_id);
    if (Array.isArray(data)) setRegistrosLocales(data);
  };

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    tipo: "", categoria: "", descripcion: "", monto: "", fecha: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const agregarRegistro = async () => {
    if (!form.tipo || !form.categoria || !form.monto || !form.fecha) {
      alert("Por favor completa los campos obligatorios");
      return;
    }
    try {
      await crearFinanza({
        finca_id,
        tipo: form.tipo,
        categoria: form.categoria,
        descripcion: form.descripcion,
        monto: parseFloat(form.monto),
        fecha: form.fecha,
      });
      await cargarFinanzas();
      setForm({ tipo: "", categoria: "", descripcion: "", monto: "", fecha: "" });
      setMostrarForm(false);
      alert("¡Registro agregado exitosamente!");
    } catch (e) {
      alert("Error al guardar el registro financiero");
    }
  };

  const totalIngresos = registros
    .filter((r) => r.tipo === "Ingreso")
    .reduce((acc, r) => acc + parseFloat(r.monto || 0), 0);

  const totalGastos = registros
    .filter((r) => r.tipo === "Gasto")
    .reduce((acc, r) => acc + parseFloat(r.monto || 0), 0);

  const balance = totalIngresos - totalGastos;

  // Formatea números grandes: 3000000 → $3M, 150000 → $150K
  const formatMonto = (valor) => {
    if (Math.abs(valor) >= 1000000) return `$${(valor / 1000000).toFixed(1)}M`;
    if (Math.abs(valor) >= 1000) return `$${(valor / 1000).toFixed(0)}K`;
    return `$${valor.toLocaleString()}`;
  };

  return (
    <div>
      {/* Resumen — tarjetas compactas para móvil */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        <div className="bg-amber-50 border-l-4 border-amber-700 rounded-xl shadow p-4 flex justify-between items-center">
          <p className="text-amber-900 font-bold text-base">💰 Total Ingresos</p>
          <p className="text-amber-800 font-bold text-xl">${totalIngresos.toLocaleString()}</p>
        </div>
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-xl shadow p-4 flex justify-between items-center">
          <p className="text-amber-800 font-bold text-base">💸 Total Gastos</p>
          <p className="text-amber-500 font-bold text-xl">${totalGastos.toLocaleString()}</p>
        </div>
        <div className={`${balance >= 0 ? "bg-amber-50 border-amber-700" : "bg-amber-50 border-amber-500"} border-l-4 rounded-xl shadow p-4 flex justify-between items-center`}>
          <p className={`font-bold text-base ${balance >= 0 ? "text-amber-900" : "text-amber-800"}`}>⚖️ Balance</p>
          <p className={`font-bold text-xl ${balance >= 0 ? "text-amber-800" : "text-amber-500"}`}>${balance.toLocaleString()}</p>
        </div>
      </div>

      {/* Botón agregar */}
      <div className="text-center mb-4">
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-amber-800 hover:bg-amber-900 text-white font-bold px-8 py-3 rounded-lg transition duration-200">
          {mostrarForm ? "Cancelar" : "➕ Agregar Registro"}
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-4 mb-4 max-w-lg mx-auto">
          <h2 className="text-lg font-bold text-amber-900 mb-4">Nuevo Registro</h2>
          <div className="space-y-3">

            <select name="tipo" value={form.tipo} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-700">
              <option value="">Tipo de registro *</option>
              <option value="Ingreso">💰 Ingreso</option>
              <option value="Gasto">💸 Gasto</option>
            </select>

            <select name="categoria" value={form.categoria} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-700">
              <option value="">Categoría *</option>
              {form.tipo === "Ingreso" && (
                <>
                  <option value="Venta de Animal">Venta de Animal</option>
                  <option value="Venta de Leche">Venta de Leche</option>
                  <option value="Venta de Cría">Venta de Cría</option>
                  <option value="Otro Ingreso">Otro Ingreso</option>
                </>
              )}
              {form.tipo === "Gasto" && (
                <>
                  <option value="Compra de Animal">Compra de Animal</option>
                  <option value="Compra de Insumos">Compra de Insumos</option>
                  <option value="Veterinario">Veterinario</option>
                  <option value="Alimentación">Alimentación</option>
                  <option value="Mano de Obra">Mano de Obra</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Otro Gasto">Otro Gasto</option>
                </>
              )}
              {form.tipo === "" && (
                <option disabled>Selecciona primero el tipo</option>
              )}
            </select>

            <input name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-700" />

            <input name="monto" type="number" placeholder="Monto *" value={form.monto} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-700" />

            <input
              name="fecha"
              type="text"
              placeholder="Fecha (AAAA-MM-DD) *"
              value={form.fecha}
              onFocus={(e) => e.target.type = "date"}
              onBlur={(e) => { if (!form.fecha) e.target.type = "text" }}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-700"
            />

            <button onClick={agregarRegistro}
              className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold py-3 rounded-lg transition duration-200">
              Guardar Registro
            </button>
          </div>
        </div>
      )}

      {/* Lista de registros */}
      {registros.length === 0 ? (
        <div className="text-center text-gray-400 mt-10">
          <p className="text-6xl">💰</p>
          <p className="text-xl mt-4">No hay registros financieros aún</p>
          <p className="text-sm mt-2">Haz clic en "Agregar Registro" para comenzar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {registros.map((registro) => (
            <div key={registro.id}
              className={`bg-white rounded-xl shadow p-4 border-l-4 ${registro.tipo === "Ingreso" ? "border-amber-700" : "border-amber-500"}`}>
              <div className="flex justify-between items-center gap-2">
                <div className="flex-1 min-w-0">
                  <span className={`font-bold text-xs px-2 py-1 rounded-full ${registro.tipo === "Ingreso" ? "bg-amber-100 text-amber-900" : "bg-amber-100 text-amber-700"}`}>
                    {registro.tipo === "Ingreso" ? "💰" : "💸"} {registro.tipo}
                  </span>
                  <p className="font-bold text-gray-800 mt-1 text-sm">{registro.categoria}</p>
                  {registro.descripcion && <p className="text-gray-500 text-xs truncate">{registro.descripcion}</p>}
                  <p className="text-gray-400 text-xs">📅 {registro.fecha}</p>
                </div>
                <p className={`text-base font-bold whitespace-nowrap ${registro.tipo === "Ingreso" ? "text-amber-800" : "text-amber-500"}`}>
                  ${parseFloat(registro.monto).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Finanzas;