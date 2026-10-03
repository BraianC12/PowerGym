import { request } from "./client.js";

// ==========================================================
// API / AUTH
// ==========================================================
const RUTA = "/login";

// Iniciar sesión.
// Devuelve { message, token, usuario } tal cual lo manda el backend.
export function login(email, contrasena) {
  return request(RUTA, {
    method: "POST",
    body: { email, contrasena },
    error: "No se pudo conectar con el servidor",
  });
}