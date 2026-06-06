import { useState, useEffect, useMemo, useCallback } from "react";
import { listarLeche, crearRegistroLeche, actualizarLeche } from "../api";
import { GRAD, INPUT_CLASS, COLORS } from "../shared";
import { toast } from "../toast";

const FORM_INICIAL = { fecha: "", litros: "", precioLitro: "", frecuenciaPago: "Mensual" };

function Lecheria({ finca_id }) {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formEditar, setFormEditar] = useState({});
  const [form, setForm] = useState(FORM_INICIAL);

  useEffect(() => { if (finca_id) cargarRegistros(); }, [finca_id]);

  const cargarRegistros = async () => {
    setCargando(true);
    const data = await listarLeche(finca_id);
    if (Array.isArray(data)) setRegistros(data);
    setCargando(false);
  };

  const handleChange = useCallback((e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })), []);

  const agregarRegistro = async () => {
    if (!form.fecha || !form.litros || !form.precioLitro) { toast.error("Por favor completa todos los campos obligatorios"); return; }
    setGuardando(true);
    try {
      await crearRegistroLeche({ finca_id, fecha: form.fecha, litros: parseFloat(form.litros), precio_litro: parseFloat(form.precioLitro), frecuencia_pago: form.frecuenciaPago });
      await cargarRegistros();
      setForm(FORM_INICIAL);
      setMostrarForm(false);
      toast.success("¡Registro de leche agregado!");
    } catch { toast.error("Error al guardar el registro"); }
    setGuardando(false);
  };

  const guardarEdicion = async (registro) => {
    setGuardando(true);
    try {
      await actualizarLeche(registro.id, { finca_id, fecha: formEditar.fecha, litros: parseFloat(formEditar.litros), precio_litro: parseFloat(formEditar.precio_litro), frecuencia_pago: formEditar.frecuencia_pago });
      await cargarRegistros();
      setEditandoId(null);
      toast.success("¡Registro actualizado!");
    } catch { toast.error("Error al actualizar el registro"); }
    setGuardando(false);
  };

  const { totalLitros, totalIngresos, promedioDiario, registrosPorMes } = useMemo(() => {
    const totalLitros = registros.reduce((acc, r) => acc + parseFloat(r.litros || 0), 0);
    const totalIngresos = registros.reduce((acc, r) => acc + parseFloat(r.litros || 0) * parseFloat(r.precio_litro || 0), 0);
    const promedioDiario = registros.length > 0 ? totalLitros / registros.length : 0;
    const registrosPorMes = registros.reduce((acc, r) => {
      const mes = r.fecha.substring(0, 7);
      if (!acc[mes]) acc[mes] = { litros: 0, ingresos: 0, dias: 0 };
      acc[mes].litros += parseFloat(r.litros || 0);
      acc[mes].ingresos += parseFloat(r.litros || 0) * parseFloat(r.precio_litro || 0);
      acc[mes].dias += 1;
      return acc;
    }, {});
    return { totalLitros, totalIngresos, promedioDiario, registrosPorMes };
  }, [registros]);

  const registrosOrdenados = useMemo(() => [...registros].sort((a, b) => b.fecha.localeCompare(a.fecha)), [registros]);

  if (cargando) return (
    <div className="text-center py-12 text-gray-400">
      <div className="inline-block w-7 h-7 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-3" />
      <p className="text-sm">Cargando lechería...</p>
    </div>
  );

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Litros", value: `${totalLitros.toFixed(1)} L`, color: COLORS.primary },
          { label: "Promedio Diario", value: `${promedioDiario.toFixed(1)} L/día`, color: "#2563eb" },
          { label: "Total Ingresos", value: `$${totalIngresos.toLocaleString()}`, color: COLORS.emerald },
          { label: "Días Registrados", value: registros.length, color: "#7c3aed" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-gray-400 text-xs mb-1">{label}</p>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {registros.length > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5">
          <h3 className="font-semibold text-green-800 text-sm mb-3">💵 Pago Estimado por Frecuencia</h3>
          <div className="grid grid-cols-3 gap-3">
            {[["Semanal", 7], ["Quincenal", 15], ["Mensual", 30]].map(([label, dias]) => (
              <div key={label} className="bg-white rounded-lg p-3 text-center border border-green-100">
                <p className="text-gray-400 text-xs">{label}</p>
                <p className="text-base font-bold mt-1" style={{ color: COLORS.primary }}>${(totalIngresos / (registros.length / dias)).toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center mb-5">
        <button onClick={() => setMostrarForm(!mostrarForm)} style={{ background: GRAD }}
          className="text-white font-medium px-6 py-2.5 rounded-lg shadow-sm text-sm transition duration-200">
          {mostrarForm ? "Cancelar" : "＋ Registrar Producción del Día"}
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5 max-w-lg mx-auto">
          <h2 className="text-base font-semibold mb-4 text-gray-800">🥛 Registro Diario de Leche</h2>
          <div className="space-y-3">
            {[["Fecha *", "date", "fecha"], ["Litros producidos *", "number", "litros"], ["Precio por litro *", "number", "precioLitro"]].map(([label, type, name]) => (
              <div key={name}>
                <label className="block text-gray-600 text-xs font-medium mb-1">{label}</label>
                <input type={type} name={name} value={form[name]} onChange={handleChange} className={INPUT_CLASS} placeholder={type === "number" ? "0.0" : ""} />
              </div>
            ))}
            <div>
              <label className="block text-gray-600 text-xs font-medium mb-1">Frecuencia de pago</label>
              <select name="frecuenciaPago" value={form.frecuenciaPago} onChange={handleChange} className={INPUT_CLASS}>
                <option value="Semanal">Semanal</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Mensual">Mensual</option>
              </select>
            </div>
            <button onClick={agregarRegistro} disabled={guardando} style={{ background: GRAD }}
              className="w-full text-white font-medium py-2.5 rounded-lg shadow-sm text-sm disabled:opacity-60">
              {guardando ? "Guardando..." : "💾 Guardar Registro"}
            </button>
          </div>
        </div>
      )}

      {Object.keys(registrosPorMes).length > 0 && (
        <div className="mb-5">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">📊 Resumen por Mes</h3>
          <div className="space-y-2">
            {Object.entries(registrosPorMes).sort().reverse().map(([mes, datos]) => (
              <div key={mes} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-sm" style={{ color: COLORS.primary }}>{mes}</h4>
                  <span className="text-gray-400 text-xs">{datos.dias} días</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div><p className="text-gray-400">Total</p><p className="font-semibold text-blue-600">{datos.litros.toFixed(1)} L</p></div>
                  <div><p className="text-gray-400">Promedio</p><p className="font-semibold text-purple-600">{(datos.litros / datos.dias).toFixed(1)} L</p></div>
                  <div><p className="text-gray-400">Ingresos</p><p className="font-semibold" style={{ color: COLORS.emerald }}>${datos.ingresos.toLocaleString()}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="font-semibold text-gray-700 text-sm mb-3">📋 Registros Diarios</h3>
      {registros.length === 0 ? (
        <div className="text-center text-gray-400 mt-12">
          <p className="text-5xl mb-4">🥛</p>
          <p className="text-base font-medium text-gray-500">No hay registros de leche aún</p>
        </div>
      ) : (
        <div className="space-y-2">
          {registrosOrdenados.map((registro) => (
            <div key={registro.id} className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 p-4" style={{ borderLeftColor: COLORS.primaryLight }}>
              {editandoId === registro.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {[["Fecha","date","fecha"],["Litros","number","litros"],["Precio/L","number","precio_litro"]].map(([label, type, key]) => (
                      <div key={key}>
                        <label className="text-xs text-gray-400">{label}</label>
                        <input type={type} value={formEditar[key]} onChange={(e) => setFormEditar((prev) => ({ ...prev, [key]: e.target.value }))} className={INPUT_CLASS} />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-gray-400">Frecuencia</label>
                      <select value={formEditar.frecuencia_pago} onChange={(e) => setFormEditar((prev) => ({ ...prev, frecuencia_pago: e.target.value }))} className={INPUT_CLASS}>
                        <option>Semanal</option><option>Quincenal</option><option>Mensual</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => guardarEdicion(registro)} disabled={guardando} style={{ background: GRAD }} className="text-white font-medium py-2 rounded-lg text-sm disabled:opacity-60">{guardando ? "..." : "💾 Guardar"}</button>
                    <button onClick={() => setEditandoId(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">📅 {registro.fecha}</p>
                    <p className="text-gray-400 text-xs mt-0.5">💰 ${parseFloat(registro.precio_litro).toLocaleString()}/L · 🔄 {registro.frecuencia_pago}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-lg font-bold text-blue-600">{parseFloat(registro.litros).toFixed(1)} L</p>
                    <p className="text-sm font-semibold" style={{ color: COLORS.emerald }}>${(parseFloat(registro.litros) * parseFloat(registro.precio_litro)).toLocaleString()}</p>
                    <button onClick={() => { setEditandoId(registro.id); setFormEditar({ fecha: registro.fecha, litros: registro.litros, precio_litro: registro.precio_litro, frecuencia_pago: registro.frecuencia_pago }); }}
                      className="text-xs font-medium hover:underline" style={{ color: COLORS.primaryLight }}>✏️ Editar</button>
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

export default Lecheria;
