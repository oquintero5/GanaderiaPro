import { useState, useEffect, useMemo, useCallback } from "react";
import { listarLeche, crearRegistroLeche, actualizarLeche, eliminarLeche, cambiarPrecioQuincena } from "../api";
import { GRAD, INPUT_CLASS, COLORS } from "../shared";
import { toast } from "../toast";
import { ModalConfirmar } from "../ModalConfirmar";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// Fecha de hoy en la hora local (no UTC), en formato AAAA-MM-DD
const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// La leche se paga por quincena: del 1 al 15 y del 16 al fin de mes (igual que el backend)
function quincenaDe(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || "")) return null;
  const [y, m, d] = fecha.split("-").map(Number);
  const mm = String(m).padStart(2, "0");
  const ultimo = new Date(y, m, 0).getDate();
  const primera = d <= 15;
  return {
    inicio: `${y}-${mm}-${primera ? "01" : "16"}`,
    fin: `${y}-${mm}-${primera ? "15" : String(ultimo)}`,
    etiqueta: `${primera ? "1.ª" : "2.ª"} quincena de ${MESES[m - 1]}`,
    rango: `del ${primera ? 1 : 16} al ${primera ? 15 : ultimo} de ${MESES[m - 1]}`,
  };
}

const enQuincena = (registro, q) => q && registro.fecha >= q.inicio && registro.fecha <= q.fin;

const formInicial = () => ({ fecha: hoyISO(), litros: "", precioLitro: "" });

function Lecheria({ finca_id }) {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formEditar, setFormEditar] = useState({});
  const [porEliminar, setPorEliminar] = useState(null);
  const [form, setForm] = useState(formInicial);
  const [editandoPrecio, setEditandoPrecio] = useState(false);
  const [nuevoPrecio, setNuevoPrecio] = useState("");

  useEffect(() => { if (finca_id) cargarRegistros(); }, [finca_id]);

  const cargarRegistros = async () => {
    setCargando(true);
    try {
      const data = await listarLeche(finca_id);
      if (Array.isArray(data)) setRegistros(data);
    } catch (e) { toast.error(e?.message || "No se pudieron cargar los registros de leche"); }
    setCargando(false);
  };

  const ejecutarEliminar = async () => {
    const item = porEliminar;
    setPorEliminar(null);
    try {
      await eliminarLeche(item.id);
      setRegistros((prev) => prev.filter((x) => x.id !== item.id));
      toast.success("Registro de leche eliminado");
    } catch (e) { toast.error(e?.message || "Error al eliminar"); }
  };

  const handleChange = useCallback((e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })), []);

  // Precio ya usado en una quincena (el del último registro de esa quincena), o null si es nueva
  const precioDeQuincena = useCallback((fecha) => {
    const q = quincenaDe(fecha);
    const enEsa = registros.filter((r) => enQuincena(r, q)).sort((a, b) => b.id - a.id);
    return enEsa.length ? parseFloat(enEsa[0].precio_litro) : null;
  }, [registros]);

  const quincenaForm = useMemo(() => quincenaDe(form.fecha), [form.fecha]);
  const precioForm = useMemo(() => precioDeQuincena(form.fecha), [precioDeQuincena, form.fecha]);

  const agregarRegistro = async () => {
    const pidePrecio = precioForm === null;
    if (!form.fecha || !form.litros || (pidePrecio && !form.precioLitro)) {
      toast.error(pidePrecio ? "Ingresa la fecha, los litros y el precio del litro de esta quincena" : "Ingresa la fecha y los litros");
      return;
    }
    setGuardando(true);
    try {
      const datos = { finca_id, fecha: form.fecha, litros: parseFloat(form.litros), frecuencia_pago: "Quincenal" };
      if (pidePrecio) datos.precio_litro = parseFloat(form.precioLitro);
      await crearRegistroLeche(datos);
      await cargarRegistros();
      setForm(formInicial());
      setMostrarForm(false);
      toast.success("¡Leche registrada! El ingreso de la quincena ya está en Finanzas");
    } catch (e) { toast.error(e?.message || "Error al guardar el registro"); }
    setGuardando(false);
  };

  const guardarEdicion = async (registro) => {
    setGuardando(true);
    try {
      await actualizarLeche(registro.id, { finca_id, fecha: formEditar.fecha, litros: parseFloat(formEditar.litros), frecuencia_pago: registro.frecuencia_pago || "Quincenal" });
      await cargarRegistros();
      setEditandoId(null);
      toast.success("¡Registro actualizado!");
    } catch (e) { toast.error(e?.message || "Error al actualizar el registro"); }
    setGuardando(false);
  };

  const guardarPrecioQuincena = async (fecha) => {
    if (!nuevoPrecio || parseFloat(nuevoPrecio) <= 0) { toast.error("Ingresa un precio válido"); return; }
    setGuardando(true);
    try {
      await cambiarPrecioQuincena({ finca_id, fecha, precio_litro: parseFloat(nuevoPrecio) });
      await cargarRegistros();
      setEditandoPrecio(false);
      setNuevoPrecio("");
      toast.success("Precio actualizado en toda la quincena y en Finanzas");
    } catch (e) { toast.error(e?.message || "Error al cambiar el precio"); }
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
      <div className="inline-block w-7 h-7 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
      <p className="text-sm">Cargando lechería...</p>
    </div>
  );

  return (
    <div>
      {porEliminar && (
        <ModalConfirmar
          mensaje={`¿Eliminar el registro de leche del ${porEliminar.fecha} (${porEliminar.litros} L)? Esta acción no se puede deshacer.`}
          onConfirmar={ejecutarEliminar}
          onCancelar={() => setPorEliminar(null)}
        />
      )}
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

      {(() => {
        const hoy = hoyISO();
        const q = quincenaDe(hoy);
        const regs = registros.filter((r) => enQuincena(r, q));
        const litros = regs.reduce((acc, r) => acc + parseFloat(r.litros || 0), 0);
        const total = regs.reduce((acc, r) => acc + parseFloat(r.litros || 0) * parseFloat(r.precio_litro || 0), 0);
        const precio = precioDeQuincena(hoy);
        return (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-blue-900 text-sm">🗓️ Quincena actual</h3>
                <p className="text-xs text-gray-500">{q.rango}</p>
              </div>
              {precio !== null && !editandoPrecio && (
                <button onClick={() => { setEditandoPrecio(true); setNuevoPrecio(String(precio)); }}
                  className="text-xs font-medium hover:underline" style={{ color: COLORS.primaryLight }}>✏️ Cambiar precio</button>
              )}
            </div>
            {regs.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no hay leche registrada en esta quincena. Con el primer registro se te pedirá el precio del litro.</p>
            ) : editandoPrecio ? (
              <div className="space-y-2">
                <label className="block text-gray-600 text-xs font-medium">Nuevo precio por litro (se aplica a toda la quincena)</label>
                <input type="number" inputMode="decimal" value={nuevoPrecio} onChange={(e) => setNuevoPrecio(e.target.value)} className={INPUT_CLASS} />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => guardarPrecioQuincena(hoy)} disabled={guardando} style={{ background: GRAD }} className="text-white font-medium py-2 rounded-lg text-sm disabled:opacity-60">{guardando ? "..." : "💾 Guardar precio"}</button>
                  <button onClick={() => setEditandoPrecio(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {[["Litros", `${litros.toLocaleString("es-CO")} L`], ["Precio/L", `$${precio.toLocaleString("es-CO")}`], ["A cobrar", `$${Math.round(total).toLocaleString("es-CO")}`]].map(([label, valor]) => (
                  <div key={label} className="bg-white rounded-lg p-3 text-center border border-blue-100">
                    <p className="text-gray-400 text-xs">{label}</p>
                    <p className="text-base font-bold mt-1" style={{ color: label === "A cobrar" ? COLORS.emerald : COLORS.primary }}>{valor}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

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
            <div>
              <label className="block text-gray-600 text-xs font-medium mb-1">Fecha *</label>
              <input type="date" name="fecha" value={form.fecha} onChange={handleChange} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="block text-gray-600 text-xs font-medium mb-1">Litros producidos *</label>
              <input type="number" inputMode="decimal" name="litros" value={form.litros} onChange={handleChange} className={INPUT_CLASS} placeholder="0.0" />
            </div>
            {quincenaForm && (precioForm === null ? (
              <div>
                <label className="block text-gray-600 text-xs font-medium mb-1">Precio por litro de la {quincenaForm.etiqueta} *</label>
                <input type="number" inputMode="decimal" name="precioLitro" value={form.precioLitro} onChange={handleChange} className={INPUT_CLASS} placeholder="0" />
                <p className="text-xs text-gray-400 mt-1">Solo se pide una vez por quincena ({quincenaForm.rango}).</p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                💲 Precio de la {quincenaForm.etiqueta}: <b>${precioForm.toLocaleString("es-CO")}/L</b>
              </p>
            ))}
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
                    {[["Fecha","date","fecha"],["Litros","number","litros"]].map(([label, type, key]) => (
                      <div key={key}>
                        <label className="text-xs text-gray-400">{label}</label>
                        <input type={type} value={formEditar[key]} onChange={(e) => setFormEditar((prev) => ({ ...prev, [key]: e.target.value }))} className={INPUT_CLASS} />
                      </div>
                    ))}
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
                    <p className="text-gray-400 text-xs mt-0.5">💰 ${parseFloat(registro.precio_litro).toLocaleString("es-CO")}/L · {quincenaDe(registro.fecha)?.etiqueta}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-lg font-bold text-blue-600">{parseFloat(registro.litros).toFixed(1)} L</p>
                    <p className="text-sm font-semibold" style={{ color: COLORS.emerald }}>${(parseFloat(registro.litros) * parseFloat(registro.precio_litro)).toLocaleString()}</p>
                    <button onClick={() => { setEditandoId(registro.id); setFormEditar({ fecha: registro.fecha, litros: registro.litros }); }}
                      className="text-xs font-medium hover:underline" style={{ color: COLORS.primaryLight }}>✏️ Editar</button>
                    <button onClick={() => setPorEliminar(registro)} className="text-xs font-medium hover:underline text-red-600">🗑️ Eliminar</button>
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
