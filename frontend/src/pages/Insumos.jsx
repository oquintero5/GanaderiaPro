import { useState, useEffect, useMemo, useCallback } from "react";
import { listarInsumos, crearInsumo, actualizarInsumo } from "../api";
import { GRAD, INPUT_CLASS, COLORS } from "../shared";
import { toast } from "../toast";

const CATEGORIAS = ["Sal Mineral","Vitamina","Vacuna","Purga","Medicamento","Concentrado","Herramienta","Otro"];
const UNIDADES = ["kg","litros","unidades","bultos","cajas"];
const FORM_INICIAL = { nombre: "", categoria: "", cantidad: "", unidad: "", precio: "", proveedor: "" };

const CATEGORIA_COLOR = { "Sal Mineral": "#0369a1", "Vitamina": "#7c3aed", "Vacuna": "#059669", "Purga": "#d97706", "Medicamento": "#dc2626", "Concentrado": "#166534", "Herramienta": "#475569", "Otro": "#6b7280" };

function Insumos({ onAgregarInsumo, finca_id }) {
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formEditar, setFormEditar] = useState({});
  const [form, setForm] = useState(FORM_INICIAL);

  useEffect(() => { if (finca_id) cargarInsumos(); }, [finca_id]);

  const cargarInsumos = async () => {
    setCargando(true);
    const data = await listarInsumos(finca_id);
    if (Array.isArray(data)) setInsumos(data);
    setCargando(false);
  };

  const handleChange = useCallback((e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })), []);

  const agregarInsumo = async () => {
    if (!form.nombre || !form.categoria || !form.cantidad || !form.precio) { toast.error("Por favor completa los campos obligatorios"); return; }
    setGuardando(true);
    try {
      await crearInsumo({ finca_id, nombre: form.nombre, categoria: form.categoria, cantidad: parseFloat(form.cantidad), unidad: form.unidad, precio: parseFloat(form.precio), proveedor: form.proveedor });
      if (onAgregarInsumo) onAgregarInsumo(form);
      await cargarInsumos();
      setForm(FORM_INICIAL);
      setMostrarForm(false);
      toast.success("¡Insumo agregado exitosamente!");
    } catch { toast.error("Error al guardar el insumo"); }
    setGuardando(false);
  };

  const guardarEdicion = async (insumo) => {
    setGuardando(true);
    try {
      await actualizarInsumo(insumo.id, { finca_id, nombre: formEditar.nombre, categoria: formEditar.categoria, cantidad: parseFloat(formEditar.cantidad), unidad: formEditar.unidad, precio: parseFloat(formEditar.precio), proveedor: formEditar.proveedor || "" });
      await cargarInsumos();
      setEditandoId(null);
      toast.success("¡Insumo actualizado!");
    } catch { toast.error("Error al actualizar el insumo"); }
    setGuardando(false);
  };

  const totalInvertido = useMemo(() => insumos.reduce((acc, i) => acc + (parseFloat(i.precio) * parseFloat(i.cantidad) || 0), 0), [insumos]);

  if (cargando) return (
    <div className="text-center py-12 text-gray-400">
      <div className="inline-block w-7 h-7 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-3" />
      <p className="text-sm">Cargando insumos...</p>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-gray-400 text-xs mb-1">Total Insumos</p>
          <p className="text-3xl font-bold" style={{ color: COLORS.primary }}>{insumos.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-gray-400 text-xs mb-1">Total Invertido</p>
          <p className="text-2xl font-bold" style={{ color: COLORS.emerald }}>${totalInvertido.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex justify-center mb-5">
        <button onClick={() => setMostrarForm(!mostrarForm)} style={{ background: GRAD }}
          className="text-white font-medium px-6 py-2.5 rounded-lg shadow-sm text-sm">
          {mostrarForm ? "Cancelar" : "＋ Agregar Insumo"}
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5 max-w-lg mx-auto">
          <h2 className="text-base font-semibold mb-4 text-gray-800">Registrar Insumo</h2>
          <div className="space-y-3">
            <input name="nombre" placeholder="Nombre del insumo *" value={form.nombre} onChange={handleChange} className={INPUT_CLASS} />
            <select name="categoria" value={form.categoria} onChange={handleChange} className={INPUT_CLASS}>
              <option value="">Selecciona Categoría *</option>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input name="cantidad" type="number" placeholder="Cantidad *" value={form.cantidad} onChange={handleChange} className={INPUT_CLASS} />
              <select name="unidad" value={form.unidad} onChange={handleChange} className={INPUT_CLASS}>
                <option value="">Unidad</option>
                {UNIDADES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <input name="precio" type="number" placeholder="Precio unitario *" value={form.precio} onChange={handleChange} className={INPUT_CLASS} />
            <input name="proveedor" placeholder="Proveedor" value={form.proveedor} onChange={handleChange} className={INPUT_CLASS} />
            <button onClick={agregarInsumo} disabled={guardando} style={{ background: GRAD }}
              className="w-full text-white font-medium py-2.5 rounded-lg shadow-sm text-sm disabled:opacity-60">
              {guardando ? "Guardando..." : "Guardar Insumo"}
            </button>
          </div>
        </div>
      )}

      {insumos.length === 0 ? (
        <div className="text-center text-gray-400 mt-12">
          <p className="text-5xl mb-4">🌱</p>
          <p className="text-base font-medium text-gray-500">No hay insumos registrados aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insumos.map((insumo) => (
            <div key={insumo.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition duration-200">
              {editandoId === insumo.id ? (
                <div className="space-y-2">
                  <input placeholder="Nombre *" value={formEditar.nombre} onChange={(e) => setFormEditar((prev) => ({ ...prev, nombre: e.target.value }))} className={INPUT_CLASS} />
                  <select value={formEditar.categoria} onChange={(e) => setFormEditar((prev) => ({ ...prev, categoria: e.target.value }))} className={INPUT_CLASS}>
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Cantidad" value={formEditar.cantidad} onChange={(e) => setFormEditar((prev) => ({ ...prev, cantidad: e.target.value }))} className={INPUT_CLASS} />
                    <select value={formEditar.unidad} onChange={(e) => setFormEditar((prev) => ({ ...prev, unidad: e.target.value }))} className={INPUT_CLASS}>
                      {UNIDADES.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <input type="number" placeholder="Precio" value={formEditar.precio} onChange={(e) => setFormEditar((prev) => ({ ...prev, precio: e.target.value }))} className={INPUT_CLASS} />
                  <input placeholder="Proveedor" value={formEditar.proveedor || ""} onChange={(e) => setFormEditar((prev) => ({ ...prev, proveedor: e.target.value }))} className={INPUT_CLASS} />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => guardarEdicion(insumo)} disabled={guardando} style={{ background: GRAD }} className="text-white font-medium py-2 rounded-lg text-sm disabled:opacity-60">{guardando ? "..." : "💾 Guardar"}</button>
                    <button onClick={() => setEditandoId(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition">Cancelar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-800 text-sm">{insumo.nombre}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ background: CATEGORIA_COLOR[insumo.categoria] || "#6b7280" }}>
                      {insumo.categoria}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>📦 {insumo.cantidad} {insumo.unidad}</p>
                    <p>💰 Precio: ${parseFloat(insumo.precio).toLocaleString()}</p>
                    <p className="font-semibold" style={{ color: COLORS.emerald }}>💵 Total: ${(parseFloat(insumo.precio) * parseFloat(insumo.cantidad)).toLocaleString()}</p>
                    {insumo.proveedor && <p>🏪 {insumo.proveedor}</p>}
                  </div>
                  <button onClick={() => { setEditandoId(insumo.id); setFormEditar({ nombre: insumo.nombre, categoria: insumo.categoria, cantidad: insumo.cantidad, unidad: insumo.unidad, precio: insumo.precio, proveedor: insumo.proveedor || "" }); }}
                    className="mt-3 text-xs font-medium hover:underline" style={{ color: COLORS.primaryLight }}>
                    ✏️ Editar
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Insumos;
