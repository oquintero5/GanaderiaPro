const API_URL = import.meta.env.VITE_API_URL || "https://ganaderiapro-production.up.railway.app";

// Fincas
export const registrarFinca = async (datos) => {
  const res = await fetch(`${API_URL}/fincas/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return res.json();
};

export const loginFinca = async (datos) => {
  const res = await fetch(`${API_URL}/fincas/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return res.json();
};

// Animales
export const listarAnimales = async (finca_id) => {
  const res = await fetch(`${API_URL}/animales/${finca_id}`);
  return res.json();
};

export const crearAnimal = async (datos) => {
  const res = await fetch(`${API_URL}/animales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return res.json();
};

export const eliminarAnimal = async (animal_id) => {
  const res = await fetch(`${API_URL}/animales/${animal_id}`, {
    method: "DELETE",
  });
  return res.json();
};

// Historial Salud
export const listarHistorial = async (animal_id) => {
  const res = await fetch(`${API_URL}/historial/${animal_id}`);
  return res.json();
};

export const agregarHistorial = async (datos) => {
  const res = await fetch(`${API_URL}/historial`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return res.json();
};

// Insumos
export const listarInsumos = async (finca_id) => {
  const res = await fetch(`${API_URL}/insumos/${finca_id}`);
  return res.json();
};

export const crearInsumo = async (datos) => {
  const res = await fetch(`${API_URL}/insumos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return res.json();
};

// Finanzas
export const listarFinanzas = async (finca_id) => {
  const res = await fetch(`${API_URL}/finanzas/${finca_id}`);
  return res.json();
};

export const crearFinanza = async (datos) => {
  const res = await fetch(`${API_URL}/finanzas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return res.json();
};
// Actualizar Animal
export const actualizarAnimal = async (animal_id, datos) => {
  const res = await fetch(`${API_URL}/animales/${animal_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return res.json();
};

// Actualizar Historial
export const actualizarHistorial = async (registro_id, datos) => {
  const res = await fetch(`${API_URL}/historial/${registro_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return res.json();
};

// Lechería
export const listarLeche = async (finca_id) => {
  const res = await fetch(`${API_URL}/leche/${finca_id}`);
  return res.json();
};

export const crearRegistroLeche = async (datos) => {
  const res = await fetch(`${API_URL}/leche`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return res.json();
};

// Obreros
export const listarObreros = async (finca_id) => {
  const res = await fetch(`${API_URL}/obreros/${finca_id}`);
  return res.json();
};

export const crearObrero = async (datos) => {
  const res = await fetch(`${API_URL}/obreros`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return res.json();
};

export const actualizarPagoObrero = async (obrero_id, datos) => {
  const res = await fetch(`${API_URL}/obreros/${obrero_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return res.json();
};