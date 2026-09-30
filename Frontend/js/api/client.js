// ==========================================================
// API / CLIENT
// Única capa que habla con el backend. Todo lo demás usa
// request() y nunca escribe fetch a mano.
// ==========================================================

export const API_BASE = "http://localhost:3000/api";

export class ApiError extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.name = "ApiError";
    this.estado = estado;
  }
}

// ruta: "/socios", "/socios/12", ...
// method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
// body: objeto a enviar como JSON (opcional)
// error: mensaje a usar si el backend no devuelve uno propio
export async function request(ruta, { method = "GET", body, error } = {}) {
  const opciones = { method };

  if (body !== undefined) {
    opciones.headers = { "Content-Type": "application/json" };
    opciones.body = JSON.stringify(body);
  }

  const respuesta = await fetch(`${API_BASE}${ruta}`, opciones);

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new ApiError(datos?.error || error || `Error ${respuesta.status}`, respuesta.status);
  }

  return datos;
}
