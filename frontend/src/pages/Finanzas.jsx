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
    tipo: "",
    categoria: "",
    descripcion: "",
    monto: "",
    fecha: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const agregarRegistro = async () => {
    if (!form.tipo || !form.categoria || !form.monto || !form.fecha) {
      alert("Por favor completa los campos obligatorios");
      return;
    }
    const nuevoRegistro = { ...form, id: Date.now() };
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
  if (onAgregarRegistro) onAgregarRegistro(nuevoRegistro);
} catch (e) {
  alert("Error al guardar el registro financiero");
}
    setForm({ tipo: "", categoria: "", descripcion: "", monto: "", fecha: "" });
    setMostrarForm(false);
    alert("¡Registro agregado exitosamente!");
  };

  const totalIngresos = registros
    .filter((r) => r.tipo === "Ingreso")
    .reduce((acc, r) => acc + parseFloat(r.monto || 0), 0);

  const totalGastos = registros
    .filter((r) => r.tipo === "Gasto")
    .reduce((acc, r) => acc + parseFloat(r.monto || 0), 0);

  const balance = totalIngresos - totalGastos;

  return (
    <div>
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-gray-500 text-sm">Total Ingresos</p>
          <p className="text-3xl font-bold text-green-600">
            ${totalIngresos.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-gray-500 text-sm">Total Gastos</p>
          <p className="text-3xl font-bold text-red-500">
            ${totalGastos.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-gray-500 text-sm">Balance</p>
          <p className={`text-3xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-500"}`}>
            ${balance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Botón agregar */}
      <div className="text-center mb-6">
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg transition duration-200">
          {mostrarForm ? "Cancelar" : "➕ Agregar Registro"}
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-green-700 mb-4">Nuevo Registro</h2>
          <div className="space-y-3">

            <select name="tipo" value={form.tipo} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500">
              <option value="">Tipo de registro *</option>
              <option value="Ingreso">💰 Ingreso</option>
              <option value="Gasto">💸 Gasto</option>
            </select>

            <select name="categoria" value={form.categoria} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500">
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
            </select>

            <input name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />

            <input name="monto" type="number" placeholder="Monto *" value={form.monto} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />

            <input name="fecha" type="date" value={form.fecha} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />

            <button onClick={agregarRegistro}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition duration-200">
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
              className={`bg-white rounded-xl shadow p-4 border-l-4 ${registro.tipo === "Ingreso" ? "border-green-500" : "border-red-500"}`}>
              <div className="flex justify-between items-center">
                <div>
                  <span className={`font-bold text-sm px-2 py-1 rounded-full ${registro.tipo === "Ingreso" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {registro.tipo === "Ingreso" ? "💰" : "💸"} {registro.tipo}
                  </span>
                  <p className="font-bold text-gray-800 mt-1">{registro.categoria}</p>
                  {registro.descripcion && <p className="text-gray-500 text-sm">{registro.descripcion}</p>}
                  <p className="text-gray-400 text-sm">📅 {registro.fecha}</p>
                </div>
                <p className={`text-2xl font-bold ${registro.tipo === "Ingreso" ? "text-green-600" : "text-red-500"}`}>
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