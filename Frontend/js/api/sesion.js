// ==========================================================
// API / SESION
// Token y usuario logueado. Sin imports para que client.js
// pueda consumirlo sin ciclo de dependencias.
// ==========================================================

const CLAVE = "powergym_sesion_v1";

// 1h, igual al expiresIn de authController.js
const DURACION_MS = 60 * 60 * 1000;

export const LOGIN_URL = "/Frontend/pages/Acceder.html";

// A dónde va cada rol después de entrar.
export const RUTAS_POR_ROL = {
  "Dueño": "/Frontend/pages/administrador/dashboard.html",
  "Profesor": "/Frontend/pages/entrenador/indexEntrenador.html",
};

export const RUTAS_POR_DEFECTO = "/Frontend/pages/administrador/dashboard.html";

// Guardar el token devuelto por POST /api/login
// token: string del JWT
// usuario: { id, nombre, rol } tal cual lo devuelve el backend
export function guardar({ token, usuario }) {
  const sesion = {
    token,
    usuario: usuario ?? null,
    expiraEn: Date.now() + DURACION_MS,
  };

  localStorage.setItem(CLAVE, JSON.stringify(sesion));
}

// Sesión vigente, o null si no hay, venció o está corrupta.
export function leer() {
  const crudo = localStorage.getItem(CLAVE);
  if (!crudo) return null;

  let sesion;
  try {
    sesion = JSON.parse(crudo);
  } catch {
    localStorage.removeItem(CLAVE);
    return null;
  }

  if (!sesion?.token || !(sesion.expiraEn > Date.now())) {
    localStorage.removeItem(CLAVE);
    return null;
  }

  return sesion;
}

export function token() {
  return leer()?.token ?? null;
}

export function usuario() {
  return leer()?.usuario ?? null;
}

export function limpiar() {
  localStorage.removeItem(CLAVE);
}

// Panel correspondiente al rol de la sesión.
export function rutaDelUsuario(u) {
  return RUTAS_POR_ROL[u?.rol] ?? RUTAS_POR_DEFECTO;
}

// Corta y vuelve al login. Se usa en las vistas para que no se
// pueda entrar a un panel por URL directa.
export function exigirSesion() {
  const sesion = leer();
  if (sesion) return true;

  window.location.replace(LOGIN_URL);
  return false;
}