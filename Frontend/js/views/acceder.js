// ==========================================================
// VIEW / ACCEDER
// Formulario de login. El backend ya responde; acá solo se
// guarda la sesión y se redirige según el rol.
// ==========================================================

import { $ } from "../components/dom.js";
import { login } from "../api/authApi.js";
import { guardar, leer, rutaDelUsuario } from "../api/sesion.js";

const form = $("login-form");
const msg = $("form-msg");
const boton = form.querySelector("button[type=submit]");

const campoEmail = form.elements.email;
const campoContrasena = form.elements.contrasena;

const PALABRAS = [
  "ENTRENAMIENTO",
  "NUTRICIÓN",
  "DISCIPLINA",
  "CONSTANCIA",
  "RESULTADOS",
  "ENERGÍA",
];

function pintarMensaje(texto, esError = false) {
  msg.textContent = texto;
  msg.classList.toggle("error", esError);
}

function marcarInvalido(invalido) {
  campoEmail.classList.toggle("invalid", invalido);
  campoContrasena.classList.toggle("invalid", invalido);
}

// El track se anima con translateX(-50%), así que el contenido
// va duplicado para que el bucle no se vea el corte.
function pintarTicker() {
  const track = $("ticker");
  if (!track) return;

  const mitad = PALABRAS.map((p) => `<span>${p}<i> / </i></span>`).join("");
  track.innerHTML = mitad + mitad;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = campoEmail.value.trim();
  const contrasena = campoContrasena.value;

  // El backend también valida esto, pero mejor no hacer el viaje.
  if (!email || !contrasena) {
    marcarInvalido(true);
    pintarMensaje("Completá tu email y tu contraseña.", true);
    return;
  }

  marcarInvalido(false);
  boton.disabled = true;
  pintarMensaje("Verificando credenciales...");

  try {
    const datos = await login(email, contrasena);

    guardar({ token: datos.token, usuario: datos.usuario });
    pintarMensaje("Acceso concedido. Redirigiendo...");
    window.location.replace(rutaDelUsuario(datos.usuario));
  } catch (error) {
    pintarMensaje(error.message, true);
    marcarInvalido(true);
    boton.disabled = false;
    campoContrasena.value = "";
    campoContrasena.focus();
  }
});

// Si ya hay sesión viva no tiene sentido quedarse en el login.
const sesionViva = leer();
if (sesionViva) {
  window.location.replace(rutaDelUsuario(sesionViva.usuario));
} else {
  pintarTicker();
  campoEmail.focus();
}