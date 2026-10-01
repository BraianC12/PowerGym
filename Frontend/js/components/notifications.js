// ==========================================================
// COMPONENTS / NOTIFICATIONS
// .toast para el panel del entrenador (indexEntrenador.html)
// y .notificacion para el panel del administrador.
// Ambos se controlan con display, no con una clase .show.
// ==========================================================

// ---- Toast (entrenador) ----

export function toast(mensaje) {
  const el = document.getElementById("toast");
  if (!el) return;

  el.textContent = mensaje;
  el.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove("show"), 2200);
}

// ---- Notificación flotante (administrador) ----

export function notificacion(mensaje, tipo = "exito") {
  const el = document.getElementById("notificacion");
  const icono = document.getElementById("notificacionIcono");
  const texto = document.getElementById("notificacionTexto");

  if (!el || !texto) return;

  el.className = `notificacion ${tipo}`;

  if (icono) {
    icono.textContent = tipo === "exito" ? "✓" : "✕";
  }

  texto.textContent = mensaje;
  el.style.display = "flex";

  clearTimeout(notificacion.t);
  notificacion.t = setTimeout(() => {
    el.style.display = "none";
  }, 3000);
}
