import { useState, useEffect } from "react";
import { listarFinanzas, crearFinanza } from "../api";

const GRAD = "linear-gradient(135deg, #fcd34d, #b91c1c)";
const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400";
const API_URL = import.meta.env.VITE_API_URL || "https://ganaderiapro-production.up.railway.app";

async function actualizarFinanza(id, datos) {
  const res = await fetch(`${API_URL}/finanzas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return res.json();
}

const CATEGORIAS_INGRESO = ["Venta de Animal","Venta de Leche","Venta de Cría","Otro Ingreso"];
const CATEGORIAS_GASTO = ["Compra de Animal","Compra de Insumos","Veterinario","Alimentación","Mano de Obra","Transporte","Otro Gasto"];

function Finanzas({ registrosExternos = [], onAgregarRegistro, finca_id }) {
  const [registrosLocales, setRegistrosLocales] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formEditar, setFormEditar] = useState({});
  const [form, setForm] = useState({ tipo: "", categoria: "", descripcion: "", monto: "", fecha: "" });

  const registros = [...registrosExternos, ...registrosLocales];

  useEffect(() => {
    if (finca_id) cargarFinanzas();
  }, [finca_id]);

  const cargarFinanzas = async () => {
    const data = await listarFinanzas(finca_id);
    if (Array.isArray(data)) setRegistrosLocales(data);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const agregarRegistro = async () => {
    if (!form.tipo || !form.categoria || !form.monto || !form.fecha) {
      alert("Por favor completa los campos obligatorios");
      return;
    }
    try {
      await crearFinanza({ finca_id, tipo: form.tipo, categoria: form.categoria, descripcion: form.descripcion, monto: parseFloat(form.monto), fecha: form.fecha });
      await cargarFinanzas();
      setForm({ tipo: "", categoria: "", descripcion: "", monto: "", fecha: "" });
      setMostrarForm(false);
      alert("¡Registro agregado exitosamente!");
    } catch (e) {
      alert("Error al guardar el registro financiero");
    }
  };

  const guardarEdicion = async (registro) => {
    try {
      await actualizarFinanza(registro.id, {
        finca_id,
        tipo: formEditar.tipo,
        categoria: formEditar.categoria,
        descripcion: formEditar.descripcion || "",
        monto: parseFloat(formEditar.monto),
        fecha: formEditar.fecha,
      });
      await cargarFinanzas();
      setEditandoId(null);
      alert("¡Registro actualizado!");
    } catch (e) {
      alert("Error al actualizar el registro");
    }
  };

  const totalIngresos = registros.filter(r => r.tipo === "Ingreso").reduce((acc, r) => acc + parseFloat(r.monto || 0), 0);
  const totalGastos = registros.filter(r => r.tipo === "Gasto").reduce((acc, r) => acc + parseFloat(r.monto || 0), 0);
  const balance = totalIngresos - totalGastos;

  return (
    <div>
      {/* Resumen */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        <div className="bg-amber-50 border-l-4 border-amber-700 rounded-xl shadow p-4 flex justify-between items-center">
          <p className="text-amber-900 font-bold">💰 Total Ingresos</p>
          <p className="text-amber-800 font-bold text-xl">${totalIngresos.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 border-l-4 border-red-400 rounded-xl shadow p-4 flex justify-between items-center">
          <p className="text-red-700 font-bold">💸 Total Gastos</p>
          <p className="text-red-500 font-bold text-xl">${totalGastos.toLocaleString()}</p>
        </div>
        <div className={`${balance >= 0 ? "bg-amber-50 border-amber-700" : "bg-red-50 border-red-400"} border-l-4 rounded-xl shadow p-4 flex justify-between items-center`}>
          <p className={`font-bold ${balance >= 0 ? "text-amber-900" : "text-red-700"}`}>⚖️ Balance</p>
          <p className={`font-bold text-xl ${balance >= 0 ? "text-amber-800" : "text-red-500"}`}>${balance.toLocaleString()}</p>
        </div>
      </div>

      {/* Botón agregar */}
      <div className="flex justify-center mb-4">
        <button onClick={() => setMostrarForm(!mostrarForm)}
          style={{ background: GRAD }}
          className="text-white font-bold px-8 py-3 rounded-lg shadow-md">
          {mostrarForm ? "Cancelar" : "➕ Agregar Registro"}
        </button>
      </div>

      {/* Formulario nuevo */}
      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-4 mb-4 max-w-lg mx-auto">
          <h2 className="text-lg font-bold mb-4" style={{ color: "#b91c1c" }}>Nuevo Registro</h2>
          <div className="space-y-3">
            <select name="tipo" value={form.tipo} onChange={handleChange} className={inputClass}>
              <option value="">Tipo de registro *</option>
              <option value="Ingreso">💰 Ingreso</option>
              <option value="Gasto">💸 Gasto</option>
            </select>
            <select name="categoria" value={form.categoria} onChange={handleChange} className={inputClass}>
              <option value="">Categoría *</option>
              {form.tipo === "Ingreso" && CATEGORIAS_INGRESO.map(c => <option key={c}>{c}</option>)}
              {form.tipo === "Gasto" && CATEGORIAS_GASTO.map(c => <option key={c}>{c}</option>)}
              {!form.tipo && <option disabled>Selecciona primero el tipo</option>}
            </select>
            <input name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} className={inputClass} />
            <input name="monto" type="number" placeholder="Monto *" value={form.monto} onChange={handleChange} className={inputClass} />
            <input name="fecha" type="date" value={form.fecha} onChange={handleChange} className={inputClass} />
            <button onClick={agregarRegistro} style={{ background: GRAD }} className="w-full text-white font-bold py-3 rounded-lg shadow-md">
              Guardar Registro
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
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
              className={`bg-white rounded-xl shadow p-4 border-l-4 ${registro.tipo === "Ingreso" ? "border-amber-700" : "border-red-400"}`}>
              {editandoId === registro.id ? (
                <div className="space-y-2">
                  <select value={formEditar.tipo}
                    onChange={(e) => setFormEditar({ ...formEditar, tipo: e.target.value, categoria: "" })} className={inputClass}>
                    <option value="Ingreso">💰 Ingreso</option>
                    <option value="Gasto">💸 Gasto</option>
                  </select>
                  <select value={formEditar.categoria}
                    onChange={(e) => setFormEditar({ ...formEditar, categoria: e.target.value })} className={inputClass}>
                    {formEditar.tipo === "Ingreso" && CATEGORIAS_INGRESO.map(c => <option key={c}>{c}</option>)}
                    {formEditar.tipo === "Gasto" && CATEGORIAS_GASTO.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input placeholder="Descripción" value={formEditar.descripcion || ""}
                    onChange={(e) => setFormEditar({ ...formEditar, descripcion: e.target.value })} className={inputClass} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Monto" value={formEditar.monto}
                      onChange={(e) => setFormEditar({ ...formEditar, monto: e.target.value })} className={inputClass} />
                    <input type="date" value={formEditar.fecha}
                      onChange={(e) => setFormEditar({ ...formEditar, fecha: e.target.value })} className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => guardarEdicion(registro)} style={{ background: GRAD }}
                      className="text-white font-bold py-2 rounded-lg text-sm">💾 Guardar</button>
                    <button onClick={() => setEditandoId(null)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 rounded-lg text-sm">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <span className={`font-bold text-xs px-2 py-1 rounded-full ${registro.tipo === "Ingreso" ? "bg-amber-100 text-amber-900" : "bg-red-100 text-red-700"}`}>
                      {registro.tipo === "Ingreso" ? "💰" : "💸"} {registro.tipo}
                    </span>
                    <p className="font-bold text-gray-800 mt-1 text-sm">{registro.categoria}</p>
                    {registro.descripcion && <p className="text-gray-500 text-xs truncate">{registro.descripcion}</p>}
                    <p className="text-gray-400 text-xs">📅 {registro.fecha}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className={`text-base font-bold whitespace-nowrap ${registro.tipo === "Ingreso" ? "text-amber-800" : "text-red-500"}`}>
                      ${parseFloat(registro.monto).toLocaleString()}
                    </p>
                    <button onClick={() => { setEditandoId(registro.id); setFormEditar({ tipo: registro.tipo, categoria: registro.categoria, descripcion: registro.descripcion || "", monto: registro.monto, fecha: registro.fecha }); }}
                      className="text-yellow-600 hover:text-yellow-700 font-semibold text-xs">✏️ Editar</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Finanzas;
