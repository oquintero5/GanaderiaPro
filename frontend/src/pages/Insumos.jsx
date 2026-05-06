import { useState, useEffect } from "react";
import { listarInsumos, crearInsumo } from "../api";

function Insumos({ onAgregarInsumo, finca_id }) {
  const [insumos, setInsumos] = useState([]);

  useEffect(() => {
    if (finca_id) cargarInsumos();
  }, [finca_id]);

  const cargarInsumos = async () => {
    const data = await listarInsumos(finca_id);
    if (Array.isArray(data)) setInsumos(data);
  };
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    cantidad: "",
    unidad: "",
    precio: "",
    proveedor: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const agregarInsumo = async () => {
    if (!form.nombre || !form.categoria || !form.cantidad || !form.precio) {
      alert("Por favor completa los campos obligatorios");
      return;
    }
    try {
      const nuevoInsumo = { ...form, finca_id };
      await crearInsumo({
        finca_id,
        nombre: form.nombre,
        categoria: form.categoria,
        cantidad: parseFloat(form.cantidad),
        unidad: form.unidad,
        precio: parseFloat(form.precio),
        proveedor: form.proveedor,
      });
      if (onAgregarInsumo) onAgregarInsumo(nuevoInsumo);
      await cargarInsumos();
      setForm({ nombre: "", categoria: "", cantidad: "", unidad: "", precio: "", proveedor: "" });
      setMostrarForm(false);
      alert("¡Insumo agregado exitosamente!");
    } catch (e) {
      alert("Error al guardar el insumo");
    }
  };

  const totalInvertido = insumos.reduce((acc, i) => acc + (parseFloat(i.precio) * parseFloat(i.cantidad) || 0), 0);

  return (
    <div>
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-gray-500 text-sm">Total Insumos</p>
          <p className="text-4xl font-bold text-red-800">{insumos.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-gray-500 text-sm">Total Invertido</p>
          <p className="text-3xl font-bold text-blue-600">${totalInvertido.toLocaleString()}</p>
        </div>
      </div>

      {/* Botón agregar */}
      <div className="text-center mb-6">
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-red-700 hover:bg-red-800 text-white font-bold px-8 py-3 rounded-lg transition duration-200">
          {mostrarForm ? "Cancelar" : "➕ Agregar Insumo"}
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-red-800 mb-4">Registrar Insumo</h2>
          <div className="space-y-3">
            <input name="nombre" placeholder="Nombre del insumo *" value={form.nombre} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600" />
            
            <select name="categoria" value={form.categoria} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600">
              <option value="">Selecciona Categoría *</option>
              <option value="Sal Mineral">Sal Mineral</option>
              <option value="Vitamina">Vitamina</option>
              <option value="Vacuna">Vacuna</option>
              <option value="Purga">Purga</option>
              <option value="Medicamento">Medicamento</option>
              <option value="Concentrado">Concentrado</option>
              <option value="Herramienta">Herramienta</option>
              <option value="Otro">Otro</option>
            </select>

            <div className="grid grid-cols-2 gap-3">
              <input name="cantidad" type="number" placeholder="Cantidad *" value={form.cantidad} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600" />
              <select name="unidad" value={form.unidad} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600">
                <option value="">Unidad</option>
                <option value="kg">kg</option>
                <option value="litros">litros</option>
                <option value="unidades">unidades</option>
                <option value="bultos">bultos</option>
                <option value="cajas">cajas</option>
              </select>
            </div>

            <input name="precio" type="number" placeholder="Precio unitario *" value={form.precio} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600" />

            <input name="proveedor" placeholder="Proveedor" value={form.proveedor} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-600" />

            <button onClick={agregarInsumo}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-lg transition duration-200">
              Guardar Insumo
            </button>
          </div>
        </div>
      )}

      {/* Lista de insumos */}
      {insumos.length === 0 ? (
        <div className="text-center text-gray-400 mt-10">
          <p className="text-6xl">🌱</p>
          <p className="text-xl mt-4">No hay insumos registrados aún</p>
          <p className="text-sm mt-2">Haz clic en "Agregar Insumo" para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insumos.map((insumo) => (
            <div key={insumo.id} className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition duration-200">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-red-800">{insumo.nombre}</h3>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {insumo.categoria}
                </span>
              </div>
              <div className="mt-4 space-y-1 text-sm text-gray-600">
                <p>📦 Cantidad: {insumo.cantidad} {insumo.unidad}</p>
                <p>💰 Precio: ${parseFloat(insumo.precio).toLocaleString()}</p>
                <p>💵 Total: ${(parseFloat(insumo.precio) * parseFloat(insumo.cantidad)).toLocaleString()}</p>
                {insumo.proveedor && <p>🏪 Proveedor: {insumo.proveedor}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Insumos;
