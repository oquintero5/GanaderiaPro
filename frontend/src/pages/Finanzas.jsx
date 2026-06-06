import { useState, useEffect, useMemo, useCallback } from "react";
import { listarFinanzas, crearFinanza, actualizarFinanza } from "../api";
import { GRAD, INPUT_CLASS, COLORS } from "../shared";
import { toast } from "../toast";

const CATEGORIAS_INGRESO = ["Venta de Animal","Venta de Leche","Venta de Cría","Otro Ingreso"];
const CATEGORIAS_GASTO = ["Compra de Animal","Compra de Insumos","Veterinario","Alimentación","Mano de Obra","Transporte","Otro Gasto"];
const FORM_INICIAL = { tipo: "", categoria: "", descripcion: "", monto: "", fecha: "" };

function Finanzas({ finca_id }) {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formEditar, setFormEditar] = useState({});
  const [form, setForm] = useState(FORM_INICIAL);

  useEffect(() => { if (finca_id) cargarFinanzas(); }, [finca_id]);

  const cargarFinanzas = async () => {
    setCargando(true);
    const data = await listarFinanzas(finca_id);
    if (Array.isArray(data)) setRegistros(data);
    setCargando(false);
  };

  const handleChange = useCallback((e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })), []);

  const agregarRegistro = async () => {
    if (!form.tipo || !form.categoria || !form.monto || !form.fecha) { toast.error("Por favor completa los campos obligatorios"); return; }
    setGuardando(true);
    try {
      await crearFinanza({ finca_id, tipo: form.tipo, categoria: form.categoria, descripcion: form.descripcion, monto: parseFloat(form.monto), fecha: form.fecha });
      await cargarFinanzas();
      setForm(FORM_INICIAL);
      setMostrarForm(false);
      toast.success("¡Registro agregado exitosamente!");
    } catch { toast.error("Error al guardar el registro financiero"); }
    setGuardando(false);
  };

  const guardarEdicion = async (registro) => {
    setGuardando(true);
    try {
      await actualizarFinanza(registro.id, { finca_id, tipo: formEditar.tipo, categoria: formEditar.categoria, descripcion: formEditar.descripcion || "", monto: parseFloat(formEditar.monto), fecha: formEditar.fecha });
      await cargarFinanzas();
      setEditandoId(null);
      toast.success("¡Registro actualizado!");
    } catch { toast.error("Error al actualizar el registro"); }
    setGuardando(false);
  };

  const { totalIngresos, totalGastos, balance } = useMemo(() => {
    const totalIngresos = registros.filter(r => r.tipo === "Ingreso").reduce((acc, r) => acc + parseFloat(r.monto || 0), 0);
    const totalGastos = registros.filter(r => r.tipo === "Gasto").reduce((acc, r) => acc + parseFloat(r.monto || 0), 0);
    return { totalIngresos, totalGastos, balance: totalIngresos - totalGastos };
  }, [registros]);

  if (cargando) return (
    <div className="text-center py-12 text-gray-400">
      <div className="inline-block w-7 h-7 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-3" />
      <p className="text-sm">Cargando finanzas...</p>
    </div>
  );

  return (
    <div>
      {/* Balance cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-gray-400 text-xs mb-1">Ingresos</p>
          <p className="text-lg font-bold" style={{ color: COLORS.emerald }}>${totalIngresos.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-gray-400 text-xs mb-1">Gastos</p>
          <p className="text-lg font-bold text-red-600">${totalGastos.toLocaleString()}</p>
        </div>
        <div className={`rounded-xl shadow-sm border p-4 text-center ${balance >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
          <p className="text-gray-400 text-xs mb-1">Balance</p>
          <p className="text-lg font-bold" style={{ color: balance >= 0 ? COLORS.primary : COLORS.red }}>${balance.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <button onClick={() => setMostrarForm(!mostrarForm)} style={{ background: GRAD }}
          className="text-white font-medium px-6 py-2.5 rounded-lg shadow-sm text-sm">
          {mostrarForm ? "Cancelar" : "＋ Agregar Registro"}
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 max-w-lg mx-auto">
          <h2 className="text-base font-semibold mb-4 text-gray-800">Nuevo Registro</h2>
          <div className="space-y-3">
            <select name="tipo" value={form.tipo} onChange={handleChange} className={INPUT_CLASS}>
              <option value="">Tipo de registro *</option>
              <option value="Ingreso">💰 Ingreso</option>
              <option value="Gasto">💸 Gasto</option>
            </select>
            <select name="categoria" value={form.categoria} onChange={handleChange} className={INPUT_CLASS}>
              <option value="">Categoría *</option>
              {form.tipo === "Ingreso" && CATEGORIAS_INGRESO.map(c => <option key={c}>{c}</option>)}
              {form.tipo === "Gasto" && CATEGORIAS_GASTO.map(c => <option key={c}>{c}</option>)}
              {!form.tipo && <option disabled>Selecciona primero el tipo</option>}
            </select>
            <input name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} className={INPUT_CLASS} />
            <input name="monto" type="number" placeholder="Monto *" value={form.monto} onChange={handleChange} className={INPUT_CLASS} />
            <input name="fecha" type="date" value={form.fecha} onChange={handleChange} className={INPUT_CLASS} />
            <button onClick={agregarRegistro} disabled={guardando} style={{ background: GRAD }}
              className="w-full text-white font-medium py-2.5 rounded-lg shadow-sm text-sm disabled:opacity-60">
              {guardando ? "Guardando..." : "Guardar Registro"}
            </button>
          </div>
        </div>
      )}

      {registros.length === 0 ? (
        <div className="text-center text-gray-400 mt-12">
          <p className="text-5xl mb-4">💰</p>
          <p className="text-base font-medium text-gray-500">No hay registros financieros aún</p>
        </div>
      ) : (
        <div className="space-y-2">
          {registros.map((registro) => {
            const esIngreso = registro.tipo === "Ingreso";
            return (
              <div key={registro.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 p-4`}
                style={{ borderLeftColor: esIngreso ? COLORS.emerald : COLORS.red }}>
                {editandoId === registro.id ? (
                  <div className="space-y-2">
                    <select value={formEditar.tipo} onChange={(e) => setFormEditar((prev) => ({ ...prev, tipo: e.target.value, categoria: "" }))} className={INPUT_CLASS}>
                      <option value="Ingreso">💰 Ingreso</option>
                      <option value="Gasto">💸 Gasto</option>
                    </select>
                    <select value={formEditar.categoria} onChange={(e) => setFormEditar((prev) => ({ ...prev, categoria: e.target.value }))} className={INPUT_CLASS}>
                      {formEditar.tipo === "Ingreso" && CATEGORIAS_INGRESO.map(c => <option key={c}>{c}</option>)}
                      {formEditar.tipo === "Gasto" && CATEGORIAS_GASTO.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <input placeholder="Descripción" value={formEditar.descripcion || ""} onChange={(e) => setFormEditar((prev) => ({ ...prev, descripcion: e.target.value }))} className={INPUT_CLASS} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="Monto" value={formEditar.monto} onChange={(e) => setFormEditar((prev) => ({ ...prev, monto: e.target.value }))} className={INPUT_CLASS} />
                      <input type="date" value={formEditar.fecha} onChange={(e) => setFormEditar((prev) => ({ ...prev, fecha: e.target.value }))} className={INPUT_CLASS} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => guardarEdicion(registro)} disabled={guardando} style={{ background: GRAD }} className="text-white font-medium py-2 rounded-lg text-sm disabled:opacity-60">{guardando ? "..." : "💾 Guardar"}</button>
                      <button onClick={() => setEditandoId(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${esIngreso ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        {esIngreso ? "💰 Ingreso" : "💸 Gasto"}
                      </span>
                      <p className="font-semibold text-gray-800 text-sm mt-1">{registro.categoria}</p>
                      {registro.descripcion && <p className="text-gray-400 text-xs truncate">{registro.descripcion}</p>}
                      <p className="text-gray-400 text-xs">📅 {registro.fecha}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className={`text-base font-bold whitespace-nowrap ${esIngreso ? "text-emerald-600" : "text-red-600"}`}>
                        ${parseFloat(registro.monto).toLocaleString()}
                      </p>
                      <button onClick={() => { setEditandoId(registro.id); setFormEditar({ tipo: registro.tipo, categoria: registro.categoria, descripcion: registro.descripcion || "", monto: registro.monto, fecha: registro.fecha }); }}
                        className="text-xs font-medium hover:underline" style={{ color: COLORS.primaryLight }}>✏️ Editar</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Finanzas;
