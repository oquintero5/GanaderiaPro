const API_URL = import.meta.env.VITE_API_URL || "https://ganaderiapro-backend-944496395089.us-central1.run.app";
const TIEMPO_MAXIMO_MS = 20000;

let _token = null;
let _onSesionExpirada = null;

export function setToken(token) { _token = token; }
export function clearToken()    { _token = null; }
export function alExpirarSesion(fn) { _onSesionExpirada = fn; }

// Convierte el "detail" de FastAPI (texto o lista de errores de validación) en un mensaje legible
function mensajeDeError(detail, status) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return "Revisa los datos: hay campos vacíos o con un formato inválido";
  if (status === 429) return "Demasiados intentos, espera un minuto";
  if (status >= 500) return "El servidor tuvo un problema. Intenta de nuevo en un momento.";
  return "No se pudo completar la operación";
}

export class ErrorApi extends Error {
  constructor(mensaje, status) { super(mensaje); this.status = status; }
}

// Las rutas protegidas lanzan ErrorApi si el servidor responde con error.
// Las rutas públicas (login/registro) devuelven el JSON tal cual para que la pantalla muestre el detalle.
async function req(path, options = {}, { lanzarError = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;

  const controller = new AbortController();
  const temporizador = setTimeout(() => controller.abort(), TIEMPO_MAXIMO_MS);
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { headers, ...options, signal: controller.signal });
  } catch {
    throw new ErrorApi("No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.", 0);
  } finally {
    clearTimeout(temporizador);
  }

  let data = null;
  try { data = await res.json(); } catch { data = null; }

  if (res.ok) return data;

  // Token vencido o inválido en una ruta protegida: cerrar sesión
  if (res.status === 401 && _token && !path.startsWith("/fincas/")) {
    clearToken();
    if (_onSesionExpirada) _onSesionExpirada();
    throw new ErrorApi("Tu sesión expiró. Vuelve a entrar.", 401);
  }

  const mensaje = mensajeDeError(data?.detail, res.status);
  if (!lanzarError) return { ...(data || {}), detail: mensaje, status: res.status };
  throw new ErrorApi(mensaje, res.status);
}

const post = (path, data, opts) => req(path, { method: "POST", body: JSON.stringify(data) }, opts);
const put  = (path, data) => req(path, { method: "PUT",  body: JSON.stringify(data) });
const del  = (path)       => req(path, { method: "DELETE" });

// Fincas (rutas públicas — no necesitan token)
export const registrarFinca = (datos) => post("/fincas/registro", datos, { lanzarError: false });
export const loginFinca     = (datos) => post("/fincas/login", datos, { lanzarError: false });

// Animales
export const listarAnimales   = (finca_id)   => req(`/animales/${finca_id}`);
export const crearAnimal      = (datos)      => post("/animales", datos);
export const actualizarAnimal = (id, datos)  => put(`/animales/${id}`, datos);
export const eliminarAnimal   = (id)         => del(`/animales/${id}`);

// Historial Salud
export const listarHistorial     = (animal_id) => req(`/historial/${animal_id}`);
export const agregarHistorial    = (datos)     => post("/historial", datos);
export const actualizarHistorial = (id, datos) => put(`/historial/${id}`, datos);
export const eliminarHistorial   = (id)        => del(`/historial/${id}`);

// Insumos
export const listarInsumos    = (finca_id)  => req(`/insumos/${finca_id}`);
export const crearInsumo      = (datos)     => post("/insumos", datos);
export const actualizarInsumo = (id, datos) => put(`/insumos/${id}`, datos);
export const eliminarInsumo   = (id)        => del(`/insumos/${id}`);

// Finanzas
export const listarFinanzas    = (finca_id)  => req(`/finanzas/${finca_id}`);
export const crearFinanza      = (datos)     => post("/finanzas", datos);
export const actualizarFinanza = (id, datos) => put(`/finanzas/${id}`, datos);
export const eliminarFinanza   = (id)        => del(`/finanzas/${id}`);

// Lechería
export const listarLeche        = (finca_id)  => req(`/leche/${finca_id}`);
export const crearRegistroLeche = (datos)     => post("/leche", datos);
export const actualizarLeche    = (id, datos) => put(`/leche/${id}`, datos);
export const eliminarLeche      = (id)        => del(`/leche/${id}`);

// Obreros
export const listarObreros        = (finca_id)  => req(`/obreros/${finca_id}`);
export const crearObrero          = (datos)     => post("/obreros", datos);
export const actualizarPagoObrero = (id, datos) => put(`/obreros/${id}`, datos);
export const actualizarObrero     = (id, datos) => put(`/obreros/${id}`, datos);
export const eliminarObrero       = (id)        => del(`/obreros/${id}`);
