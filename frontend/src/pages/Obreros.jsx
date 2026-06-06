import { useState, useEffect, useMemo, useCallback } from "react";
import { listarObreros, crearObrero, actualizarPagoObrero, actualizarObrero } from "../api";
import { GRAD, INPUT_CLASS, COLORS } from "../shared";
import { toast } from "../toast";

const FORM_INICIAL = { nombre: "", dias_trabajados: "", precio_jornal: "", fecha: "", comentario: "", pagado: false };

function Obreros({ finca_id }) {
  const [obreros, setObreros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formEditar, setFormEditar] = useState({});
  const [form, setForm] = useState(FORM_INICIAL);

  useEffect(() => { if (finca_id) cargarObreros(); }, [finca_id]);

  const cargarObreros = async () => {
    setCargando(true);
    try {
      const data = await listarObreros(finca_id);
      if (Array.isArray(data)) setObreros(data);
    } catch (e) { console.error("Error cargando obreros", e); }
    setCargando(false);
  };

  const handleChange = useCallback((e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })), []);

  const totalAPagar = useMemo(() => parseFloat(form.dias_trabajados || 0) * parseFloat(form.precio_jornal || 0), [form.dias_trabajados, form.precio_jornal]);
  const totalEditarAPagar = useMemo(() => parseFloat(formEditar.dias_trabajados || 0) * parseFloat(formEditar.precio_jornal || 0), [formEditar.dias_trabajados, formEditar.precio_jornal]);

  const agregarObrero = async () => {
    if (!form.nombre || !form.dias_trabajados || !form.precio_jornal || !form.fecha) { toast.error("Por favor completa los campos obligatorios"); return; }
    setGuardando(true);
    try {
      await crearObrero({ finca_id, nombre: form.nombre, dias_trabajados: parseFloat(form.dias_trabajados), precio_jornal: parseFloat(form.precio_jornal), total_pagar: totalAPagar, fecha: form.fecha, comentario: form.comentario, pagado: false });
      await cargarObreros();
      setForm(FORM_INICIAL);
      setMostrarForm(false);
      toast.success("¡Obrero registrado exitosamente!");
    } catch { toast.error("Error al guardar el obrero"); }
    setGuardando(false);
  };

  const guardarEdicion = async (obrero) => {
    setGuardando(true);
    try {
      await actualizarObrero(obrero.id, { finca_id, nombre: formEditar.nombre, dias_trabajados: parseFloat(formEditar.dias_trabajados), precio_jornal: parseFloat(formEditar.precio_jornal), total_pagar: totalEditarAPagar, fecha: formEditar.fecha, comentario: formEditar.comentario || "", pagado: obrero.pagado });
      await cargarObreros();
      setEditandoId(null);
      toast.success("¡Obrero actualizado!");
    } catch { toast.error("Error al actualizar el obrero"); }
    setGuardando(false);
  };

  const togglePago = async (obrero) => {
    try {
      await actualizarPagoObrero(obrero.id, { ...obrero, pagado: !obrero.pagado });
      setObreros((prev) => prev.map((o) => o.id === obrero.id ? { ...o, pagado: !o.pagado } : o));
      toast.info(obrero.pagado ? `${obrero.nombre} marcado como pendiente` : `✅ ${obrero.nombre} marcado como pagado`);
    } catch { toast.error("Error al actualizar el pago"); }
  };

  const { totalPendiente, pagados, pendientes } = useMemo(() => ({
    totalPendiente: obreros.filter(o => !o.pagado).reduce((acc, o) => acc + parseFloat(o.total_pagar || 0), 0),
    pagados: obreros.filter(o => o.pagado).length,
    pendientes: obreros.filter(o => !o.pagado).length,
  }), [obreros]);

  if (cargando) return (
    <div className="text-center py-12 text-gray-400">
      <div className="inline-block w-7 h-7 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-3" />
      <p className="text-sm">Cargando obreros...</p>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-gray-400 text-xs mb-1">Pendiente</p>
          <p className="text-lg font-bold text-orange-600">${totalPendiente.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-gray-400 text-xs mb-1">Pagados</p>
          <p className="text-lg font-bold" style={{ color: COLORS.emerald }}>{pagados}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-gray-400 text-xs mb-1">Pendientes</p>
          <p className="text-lg font-bold text-orange-500">{pendientes}</p>
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <button onClick={() => setMostrarForm(!mostrarForm)} style={{ background: GRAD }}
          className="text-white font-medium px-6 py-2.5 rounded-lg shadow-sm text-sm">
          {mostrarForm ? "Cancelar" : "＋ Agregar Obrero"}
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 max-w-lg mx-auto">
          <h2 className="text-base font-semibold mb-4 text-gray-800">Registrar Obrero</h2>
          <div className="space-y-3">
            <input name="nombre" placeholder="Nombre del obrero *" value={form.nombre} onChange={handleChange} className={INPUT_CLASS} />
            <div className="grid grid-cols-2 gap-3">
              <input name="dias_trabajados" type="number" placeholder="Días trabajados *" value={form.dias_trabajados} onChange={handleChange} className={INPUT_CLASS} />
              <input name="precio_jornal" type="number" placeholder="Precio jornal *" value={form.precio_jornal} onChange={handleChange} className={INPUT_CLASS} />
            </div>
            {form.dias_trabajados && form.precio_jornal && (
              <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3">
                <p className="text-green-800 font-semibold text-center text-sm">Total a pagar: ${totalAPagar.toLocaleString()}</p>
              </div>
            )}
            <input name="fecha" type="date" value={form.fecha} onChange={handleChange} className={INPUT_CLASS} />
            <input name="comentario" placeholder="Comentario (opcional)" value={form.comentario} onChange={handleChange} className={INPUT_CLASS} />
            <button onClick={agregarObrero} disabled={guardando} style={{ background: GRAD }}
              className="w-full text-white font-medium py-2.5 rounded-lg shadow-sm text-sm disabled:opacity-60">
              {guardando ? "Guardando..." : "Guardar Obrero"}
            </button>
          </div>
        </div>
      )}

      {obreros.length === 0 ? (
        <div className="text-center text-gray-400 mt-12">
          <p className="text-5xl mb-4">👷</p>
          <p className="text-base font-medium text-gray-500">No hay obreros registrados aún</p>
        </div>
      ) : (
        <div className="space-y-2">
          {obreros.map((obrero) => (
            <div key={obrero.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 p-4`}
              style={{ borderLeftColor: obrero.pagado ? COLORS.emerald : "#f97316" }}>
              {editandoId === obrero.id ? (
                <div className="space-y-2">
                  <input placeholder="Nombre *" value={formEditar.nombre} onChange={(e) => setFormEditar((prev) => ({ ...prev, nombre: e.target.value }))} className={INPUT_CLASS} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Días" value={formEditar.dias_trabajados} onChange={(e) => setFormEditar((prev) => ({ ...prev, dias_trabajados: e.target.value }))} className={INPUT_CLASS} />
                    <input type="number" placeholder="Jornal" value={formEditar.precio_jornal} onChange={(e) => setFormEditar((prev) => ({ ...prev, precio_jornal: e.target.value }))} className={INPUT_CLASS} />
                  </div>
                  {formEditar.dias_trabajados && formEditar.precio_jornal && (
                    <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-2">
                      <p className="text-green-800 font-semibold text-center text-sm">Total: ${totalEditarAPagar.toLocaleString()}</p>
                    </div>
                  )}
                  <input type="date" value={formEditar.fecha} onChange={(e) => setFormEditar((prev) => ({ ...prev, fecha: e.target.value }))} className={INPUT_CLASS} />
                  <input placeholder="Comentario" value={formEditar.comentario || ""} onChange={(e) => setFormEditar((prev) => ({ ...prev, comentario: e.target.value }))} className={INPUT_CLASS} />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => guardarEdicion(obrero)} disabled={guardando} style={{ background: GRAD }} className="text-white font-medium py-2 rounded-lg text-sm disabled:opacity-60">{guardando ? "..." : "💾 Guardar"}</button>
                    <button onClick={() => setEditandoId(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">👷 {obrero.nombre}</p>
                    <p className="text-gray-400 text-xs mt-0.5">📅 {obrero.fecha}</p>
                    <p className="text-gray-400 text-xs">{obrero.dias_trabajados} días × ${parseFloat(obrero.precio_jornal).toLocaleString()}</p>
                    <p className="font-semibold text-sm mt-1" style={{ color: COLORS.slate }}>Total: ${parseFloat(obrero.total_pagar).toLocaleString()}</p>
                    {obrero.comentario && <p className="text-gray-400 text-xs mt-0.5">💬 {obrero.comentario}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => togglePago(obrero)}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-white text-xs whitespace-nowrap transition ${obrero.pagado ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-500 hover:bg-orange-600"}`}>
                      {obrero.pagado ? "✅ Pagado" : "⏳ Pendiente"}
                    </button>
                    <button onClick={() => { setEditandoId(obrero.id); setFormEditar({ nombre: obrero.nombre, dias_trabajados: obrero.dias_trabajados, precio_jornal: obrero.precio_jornal, fecha: obrero.fecha, comentario: obrero.comentario || "" }); }}
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

export default Obreros;
