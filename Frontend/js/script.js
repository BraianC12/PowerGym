
// ---- Ticker inferior (contenido duplicado para bucle continuo) ----
const items = [
  "POWER GYM",
  "PANEL DE ADMINISTRACIÓN",
  "GESTIONÁ TU GIMNASIO",
  "CONTROLÁ TU NEGOCIO",
  "TODO BAJO CONTROL"
];

const unit = items.map(t => `<span>${t}</span><span><i>●</i></span>`).join("");
document.getElementById("ticker").innerHTML = unit.repeat(5);

// ---- Login ----
const form = document.getElementById("login-form");
const msg = document.getElementById("form-msg");
form.addEventListener("submit", e => {
  e.preventDefault();
  const usuario = form.usuario.value.trim();
  const clave = form.clave.value.trim();

  if (!usuario || !clave) {
    msg.className = "form__msg error";
    msg.textContent = "Ingresá tu usuario y contraseña.";
    return;
  }

  if (usuario !== ADMIN.usuario || clave !== ADMIN.clave) {
    msg.className = "form__msg error";
    msg.textContent = "Usuario o contraseña incorrectos.";
    return;
  }

  sessionStorage.setItem("pg_session", "active");
  msg.className = "form__msg";
  msg.textContent = "Bienvenido, Administrador. Ingresando...";
  setTimeout(() => location.href = "dashboard.html", 600);
});