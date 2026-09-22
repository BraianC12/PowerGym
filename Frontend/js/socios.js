// ---- Configuración de la API ----
const API = "http://localhost:3000/api/socios";

let sociosCargados = [];

// ---- Cargar y renderizar socios ----
async function cargarSocios() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error("Error al obtener los socios");
    sociosCargados = await res.json();
    renderTabla(sociosCargados);
    actualizarContadores(sociosCargados);
  } catch (error) {
    console.error(error);
  }
}

function renderTabla(socios) {
  const tbody = document.getElementById("tablaSocios");

  if (socios.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">No hay socios registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = socios.map(s => {
    const p = s.Persona;
    return `
      <tr>
        <td>${p.nombre} ${p.apellido}</td>
        <td>${p.telefono || p.email}</td>
        <td><span class="status active">${s.estado}</span></td>
        <td>
          <button class="action-btn delete" onclick="darDeBaja(${s.socioId})">Dar de baja</button>
        </td>
      </tr>`;
  }).join("");
}

function actualizarContadores(socios) {
  const totalEl = document.getElementById("totalSocios");
  const activosEl = document.getElementById("sociosActivos");

  if (totalEl) totalEl.textContent = socios.length;
  if (activosEl) activosEl.textContent = socios.filter(s => s.estado === "Activo").length;
}

// ---- Buscar socio (filtro en el cliente) ----
document.querySelector(".search").addEventListener("input", e => {
  const termino = e.target.value.trim().toLowerCase();

  const filtrados = sociosCargados.filter(s => {
    const p = s.Persona;
    return `${p.nombre} ${p.apellido} ${p.email} ${p.telefono || ""}`
      .toLowerCase()
      .includes(termino);
  });

  renderTabla(filtrados);
});

// ---- Modal: agregar socio ----
const modal = document.getElementById("modalSocio");
const btnAgregar = document.getElementById("btnAgregarSocio");
const btnCerrar = document.getElementById("btnCerrarModal");
const formSocio = document.getElementById("formSocio");

btnAgregar.addEventListener("click", () => (modal.style.display = "flex"));
btnCerrar.addEventListener("click", cerrarModal);
modal.addEventListener("click", e => { if (e.target === modal) cerrarModal(); });

function cerrarModal() {
  modal.style.display = "none";
  formSocio.reset();
}

formSocio.addEventListener("submit", async e => {
  e.preventDefault();

  const msg = document.getElementById("form-msg-socio");
  const socio = {
    nombre: formSocio.nombre.value.trim(),
    apellido: formSocio.apellido.value.trim(),
    telefono: formSocio.telefono.value.trim(),
    email: formSocio.email.value.trim()
  };

  if (!socio.nombre || !socio.apellido || !socio.email) {
    msg.className = "form__msg error";
    msg.textContent = "Completá nombre, apellido y email.";
    return;
  }

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(socio)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al crear el socio");

    msg.className = "form__msg";
    cerrarModal();
    cargarSocios();
  } catch (error) {
    msg.className = "form__msg error";
    msg.textContent = error.message;
  }
});

// ---- Dar de baja (PATCH) ----
async function darDeBaja(socioId) {
  if (!confirm("¿Dar de baja a este socio?")) return;

  try {
    const res = await fetch(`${API}/${socioId}`, { method: "PATCH" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al dar de baja");

    cargarSocios();
  } catch (error) {
    alert(error.message);
  }
}

document.addEventListener("DOMContentLoaded", cargarSocios);