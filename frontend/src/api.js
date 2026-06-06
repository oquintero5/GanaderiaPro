const API_URL = import.meta.env.VITE_API_URL || "https://ganaderiapro-production.up.railway.app";

async function req(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}

const post = (path, data) => req(path, { method: "POST", body: JSON.stringify(data) });
const put  = (path, data) => req(path, { method: "PUT",  body: JSON.stringify(data) });
const del  = (path)       => req(path, { method: "DELETE" });

// Fincas
export const registrarFinca  = (datos) => post("/fincas/registro", datos);
export const loginFinca      = (datos) => post("/fincas/login", datos);

// Animales
export const listarAnimales  = (finca_id)        => req(`/animales/${finca_id}`);
export const crearAnimal     = (datos)            => post("/animales", datos);
export const actualizarAnimal = (id, datos)       => put(`/animales/${id}`, datos);
export const eliminarAnimal  = (id)               => del(`/animales/${id}`);

// Historial Salud
export const listarHistorial  = (animal_id)       => req(`/historial/${animal_id}`);
export const agregarHistorial = (datos)           => post("/historial", datos);
export const actualizarHistorial = (id, datos)    => put(`/historial/${id}`, datos);

// Insumos
export const listarInsumos   = (finca_id)         => req(`/insumos/${finca_id}`);
export const crearInsumo     = (datos)            => post("/insumos", datos);
export const actualizarInsumo = (id, datos)       => put(`/insumos/${id}`, datos);

// Finanzas
export const listarFinanzas  = (finca_id)         => req(`/finanzas/${finca_id}`);
export const crearFinanza    = (datos)            => post("/finanzas", datos);
export const actualizarFinanza = (id, datos)      => put(`/finanzas/${id}`, datos);

// Lechería
export const listarLeche          = (finca_id)    => req(`/leche/${finca_id}`);
export const crearRegistroLeche   = (datos)       => post("/leche", datos);
export const actualizarLeche      = (id, datos)   => put(`/leche/${id}`, datos);

// Obreros
export const listarObreros        = (finca_id)    => req(`/obreros/${finca_id}`);
export const crearObrero          = (datos)       => post("/obreros", datos);
export const actualizarPagoObrero = (id, datos)   => put(`/obreros/${id}`, datos);
export const actualizarObrero     = (id, datos)   => put(`/obreros/${id}`, datos);
