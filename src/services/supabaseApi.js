const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const ETAPAS = [
  'Solicitud de cita',
  'Vehículo recibido',
  'En diagnóstico',
  'Pendiente validación admin',
  'Esperando aprobación',
  'Reparación aprobada',
  'En reparación',
  'Listo para entregar'
];

const getHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_KEY,
    Prefer: 'return=representation'
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

// --- TALLERES (PostgreSQL) ---
export const obtenerTalleres = async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/talleres?select=*&order=id.asc`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Error al cargar los talleres desde PostgreSQL.');
  return res.json();
};

export const crearTaller = async (taller, jwtToken) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/talleres`, {
    method: 'POST',
    headers: getHeaders(jwtToken),
    body: JSON.stringify(taller)
  });
  if (!res.ok) throw new Error('Error al registrar la sede. Verifica tu sesión JWT.');
  const data = await res.json();
  return data[0];
};

// --- ÓRDENES DE TRABAJO (CRUD PostgreSQL) ---
export const obtenerOrdenes = async (jwtToken) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ordenes?select=*&order=id.desc`, {
    headers: getHeaders(jwtToken)
  });
  if (!res.ok) throw new Error('Error al obtener las órdenes de trabajo.');
  return res.json();
};

export const obtenerOrdenPorId = async (id) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ordenes?id=eq.${id}&select=*`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('No se pudo consultar la cotización.');
  const data = await res.json();
  return data[0] || null;
};

export const crearOrden = async (orden, jwtToken = null) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ordenes`, {
    method: 'POST',
    headers: getHeaders(jwtToken),
    body: JSON.stringify(orden)
  });
  if (!res.ok) throw new Error('Error al registrar la solicitud u orden.');
  const data = await res.json();
  return data[0];
};

export const actualizarOrden = async (id, cambios, jwtToken = null) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ordenes?id=eq.${id}`, {
    method: 'PATCH',
    headers: getHeaders(jwtToken),
    body: JSON.stringify(cambios)
  });
  if (!res.ok) throw new Error('Error al actualizar la orden en la base de datos.');
  const data = await res.json();
  return data[0];
};

export const eliminarOrden = async (id, jwtToken) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ordenes?id=eq.${id}`, {
    method: 'DELETE',
    headers: getHeaders(jwtToken)
  });
  if (!res.ok) throw new Error('Error al eliminar la orden.');
};

// --- API EXTERNA: Geocodificación OpenStreetMap (Nominatim) ---
export const geocodificarDireccion = async (direccion, distrito) => {
  const query = encodeURIComponent(`${direccion}, ${distrito}, Lima, Peru`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

  const response = await fetch(url, {
    headers: { 'Accept-Language': 'es' }
  });

  if (!response.ok) {
    throw new Error('No se pudo conectar con el servicio de mapas OpenStreetMap.');
  }

  const resultados = await response.json();
  if (!resultados || resultados.length === 0) {
    throw new Error('Dirección no encontrada en el mapa. Verifica la calle y el distrito.');
  }

  return {
    lat: parseFloat(resultados[0].lat),
    lng: parseFloat(resultados[0].lon)
  };
};