import { useState, useEffect, useMemo, useCallback } from "react";
import { listarInsumos, crearInsumo, actualizarInsumo } from "../api";
import { GRAD, INPUT_CLASS } from "../shared";
import { toast } from "../toast";

const CATEGORIAS = ["Sal Mineral","Vitamina","Vacuna","Purga","Medicamento","Concentrado","Herramienta","Otro"];
const UNIDADES = ["kg","litros","unidades","bultos","cajas"];
const FORM_INICIAL = { nombre: "", categoria: "", cantidad: "", unidad: "", precio: "", proveedor: "" };

function Insumos({ onAgregarInsumo, finca_id }) {
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formEditar, setFormEditar] = useState({});
  const [form, setForm] = useState(FORM_INICIAL);

  useEffect(() => {
    if (finca_id) cargarInsumos();
  }, [finca_id]);

  const cargarInsumos = async () => {
    setCargando(true);
    const data = await listarInsumos(finca_id);
    if (Array.isArray(data)) setInsumos(data);
    setCargando(false);
  };

  const handleChange = useCallback(
    (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })),
    []
  );

  const agregarInsumo = async () => {
    if (!form.nombre || !form.categoria || !form.cantidad || !form.precio) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }
    setGuardando(true);
    try {
      await crearInsumo({
        finca_id,
        nombre: form.nombre,
        categoria: form.categoria,
        cantidad: parseFloat(form.cantidad),
        unidad: form.unidad,
        precio: parseFloat(form.precio),
        proveedor: form.proveedor,
      });
      if (onAgregarInsumo) onAgregarInsumo(form);
      await cargarInsumos();
      setForm(FORM_INICIAL);
      setMostrarForm(false);
      toast.success("¡Insumo agregado exitosamente!");
    } catch {
      toast.error("Error al guardar el insumo");
    }
    setGuardando(false);
  };

  const guardarEdicion = async (insumo) => {
    setGuardando(true);
    try {
      await actualizarInsumo(insumo.id, {
        finca_id,
        nombre: formEditar.nombre,
        categoria: formEditar.categoria,
        cantidad: parseFloat(formEditar.cantidad),
        unidad: formEditar.unidad,
        precio: parseFloat(formEditar.precio),
        proveedor: formEditar.proveedor || "",
      });
      await cargarInsumos();
      setEditandoId(null);
      toast.success("¡Insumo actualizado!");
    } catch {
      toast.error("Error al actualizar el insumo");
    }
    setGuardando(false);
  };

  const totalInvertido = useMemo(
    () => insumos.reduce((acc, i) => acc + (parseFloat(i.precio) * parseFloat(i.cantidad) || 0), 0),
    [insumos]
  );

  if (cargando) return (
    <div className="text-center py-10 text-gray-400">
      <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-yellow-500 rounded-full animate-spin mb-3" />
      <p>Cargando insumos...</p>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-gray-500 text-sm">Total Insumos</p>
          <p className="text-4xl font-bold" style={{ color: "#b91c1c" }}>{insumos.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-gray-500 text-sm">Total Invertido</p>
          <p className="text-3xl font-bold text-blue-600">${totalInvertido.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <button onClick={() => setMostrarForm(!mostrarForm)}
          style={{ background: GRAD }}
          className="text-white font-bold px-8 py-3 rounded-lg shadow-md">
          {mostrarForm ? "Cancelar" : "➕ Agregar Insumo"}
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 max-w-lg mx-auto">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#b91c1c" }}>Registrar Insumo</h2>
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
              className="w-full text-white font-bold py-3 rounded-lg shadow-md disabled:opacity-60">
              {guardando ? "Guardando..." : "Guardar Insumo"}
            </button>
          </div>
        </div>
      )}

      {insumos.length === 0 ? (
        <div className="text-center text-gray-400 mt-10">
          <p className="text-6xl">🌱</p>
          <p className="text-xl mt-4">No hay insumos registrados aún</p>
          <p className="text-sm mt-2">Haz clic en "Agregar Insumo" para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insumos.map((insumo) => (
            <div key={insumo.id} className="bg-white rounded-xl shadow p-4 border-l-4 hover:shadow-lg transition duration-200" style={{ borderColor: "#b91c1c" }}>
              {editandoId === insumo.id ? (
                <div className="space-y-2">
                  <input placeholder="Nombre *" value={formEditar.nombre}
                    onChange={(e) => setFormEditar((prev) => ({ ...prev, nombre: e.target.value }))} className={INPUT_CLASS} />
                  <select value={formEditar.categoria}
                    onChange={(e) => setFormEditar((prev) => ({ ...prev, categoria: e.target.value }))} className={INPUT_CLASS}>
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Cantidad" value={formEditar.cantidad}
                      onChange={(e) => setFormEditar((prev) => ({ ...prev, cantidad: e.target.value }))} className={INPUT_CLASS} />
                    <select value={formEditar.unidad}
                      onChange={(e) => setFormEditar((prev) => ({ ...prev, unidad: e.target.value }))} className={INPUT_CLASS}>
                      {UNIDADES.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <input type="number" placeholder="Precio" value={formEditar.precio}
                    onChange={(e) => setFormEditar((prev) => ({ ...prev, precio: e.target.value }))} className={INPUT_CLASS} />
                  <input placeholder="Proveedor" value={formEditar.proveedor || ""}
                    onChange={(e) => setFormEditar((prev) => ({ ...prev, proveedor: e.target.value }))} className={INPUT_CLASS} />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => guardarEdicion(insumo)} disabled={guardando} style={{ background: GRAD }}
                      className="text-white font-bold py-2 rounded-lg text-sm disabled:opacity-60">
                      {guardando ? "..." : "💾 Guardar"}
                    </button>
                    <button onClick={() => setEditandoId(null)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 rounded-lg text-sm">Cancelar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold" style={{ color: "#b91c1c" }}>{insumo.nombre}</h3>
                    <span className="bg-amber-100 text-amber-900 px-2 py-1 rounded-full text-xs font-semibold">{insumo.categoria}</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>📦 Cantidad: {insumo.cantidad} {insumo.unidad}</p>
                    <p>💰 Precio: ${parseFloat(insumo.precio).toLocaleString()}</p>
                    <p>💵 Total: ${(parseFloat(insumo.precio) * parseFloat(insumo.cantidad)).toLocaleString()}</p>
                    {insumo.proveedor && <p>🏪 Proveedor: {insumo.proveedor}</p>}
                  </div>
                  <button onClick={() => { setEditandoId(insumo.id); setFormEditar({ nombre: insumo.nombre, categoria: insumo.categoria, cantidad: insumo.cantidad, unidad: insumo.unidad, precio: insumo.precio, proveedor: insumo.proveedor || "" }); }}
                    className="mt-3 text-yellow-600 hover:text-yellow-700 font-semibold text-sm">
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
