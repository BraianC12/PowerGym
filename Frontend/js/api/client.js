// ==========================================================
// API / CLIENT
// Única capa que habla con el backend. Todo lo demás usa
// request() y nunca escribe fetch a mano.
// ==========================================================

import { token, limpiar, LOGIN_URL } from "./sesion.js";

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
  const headers = {};

  const tokenActual = token();
  if (tokenActual) {
    headers.Authorization = `Bearer ${tokenActual}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const opciones = { method, headers };

  if (body !== undefined) {
    opciones.body = JSON.stringify(body);
  }

  const respuesta = await fetch(`${API_BASE}${ruta}`, opciones);

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    // 401 fuera del login = sesión vencida o caída. Se lava y se
    // vuelve al acceso, en un solo lugar y sin que cada vista lo
    // repita. El propio login no redirige acá, si no se cicla.
    if (respuesta.status === 401 && ruta !== "/login") {
      limpiar();
      window.location.replace(LOGIN_URL);
    }

    throw new ApiError(
      datos?.error || datos?.message || error || `Error ${respuesta.status}`,
      respuesta.status,
    );
  }

  return datos;
}
