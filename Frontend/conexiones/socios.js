// ---- Configuración de la API ----
const API = "http://localhost:3000/api/socios";

let sociosCargados = [];
let filtroEstado = "todos";
let cargaOk = false; // evita mostrar "no hay socios" antes de que responda la API

const $ = (id) => document.getElementById(id);
const tbody = $("tablaSocios");
const tabla = $("tablaWrap");
const estadoVacio = $("estadoVacio");
const mensaje = $("sinResultados");
const buscador = $("buscarSocio");
const chips = document.querySelectorAll(".chip");

const MSG_SIN_RESULTADOS = "Ningún socio coincide con la búsqueda o el filtro.";
const MSG_ERROR =
  "No se pudo conectar con el servidor. Revisá que la API esté corriendo en localhost:3000.";

// ---- Helpers ----
function esc(texto) {
  return String(texto ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

function claseEstado(estado) {
  const t = String(estado || "").toLowerCase();
  if (t.includes("inactiv") || t.includes("baja")) return "inactivo";
  if (t.includes("vencid")) return "vencido";
  if (t.includes("venc")) return "porvencer";
  if (t.includes("activ")) return "activo";
  return "inactivo";
}

function esInactivo(socio) {
  return claseEstado(socio && socio.estado) === "inactivo";
}

function iniciales(p) {
  return (
    ((p.nombre || "")[0] || "").toUpperCase() +
    ((p.apellido || "")[0] || "").toUpperCase()
  );
}

// ---- Cargar socios ----
async function cargarSocios() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error("Error al obtener los socios");
    sociosCargados = await res.json();
    cargaOk = true;
    render();
  } catch (error) {
    console.error(error);
    cargaOk = false;
    mostrarError();
  }
}

// ---- Render ----
function listaFiltrada() {
  const q = buscador.value.trim().toLowerCase();

  return sociosCargados.filter((s) => {
    const p = s.Persona;
    const okEstado =
      filtroEstado === "todos" || claseEstado(s.estado) === filtroEstado;
    const okTexto =
      !q ||
      `${p.nombre} ${p.apellido} ${p.email} ${p.telefono || ""}`
        .toLowerCase()
        .includes(q);
    return okEstado && okTexto;
  });
}

function render() {
  actualizarContadores(sociosCargados);

  // 1) No hay ningún socio registrado en el sistema
  if (sociosCargados.length === 0) {
    tbody.innerHTML = "";
    tabla.style.display = "none";
    mensaje.classList.remove("show");
    estadoVacio.classList.add("show");
    return;
  }

  // 2) Hay socios: mostrar tabla
  estadoVacio.classList.remove("show");
  tabla.style.display = "";

  const lista = listaFiltrada();

  // 3) Hay socios, pero la búsqueda/filtro no encuentra ninguno
  if (lista.length === 0) {
    tbody.innerHTML = "";
    mensaje.textContent = MSG_SIN_RESULTADOS;
    mensaje.classList.add("show");
    return;
  }

  mensaje.classList.remove("show");
  tbody.innerHTML = lista
    .map((s) => {
      const p = s.Persona;
      // un socio dado de baja no se puede editar ni volver a dar de baja
      const bloqueado =
        esInactivo(s) ? "disabled title=\"El socio está dado de baja\"" : "";
      return `
      <tr>
        <td>
          <div class="who">
            <span>${esc(p.nombre)} ${esc(p.apellido)}</span>
          </div>
        </td>
        <td>${esc(p.telefono || p.email)}</td>
        <td><span class="badge ${claseEstado(s.estado)}">${esc(s.estado)}</span></td>
        <td>
  <button
    class="action-btn edit"
    ${bloqueado}
    onclick="abrirEditarSocio(${Number(s.socioId)})"
  >
    Editar
  </button>

  <button
    class="action-btn delete"
    ${bloqueado}
    onclick="darDeBaja(${Number(s.socioId)})"
  >
    Dar de baja
  </button>
</td>
      </tr>`;
    })
    .join("");
}

function mostrarError() {
  tbody.innerHTML = "";
  tabla.style.display = "none";
  estadoVacio.classList.remove("show");
  mensaje.textContent = MSG_ERROR;
  mensaje.classList.add("show");
}

function actualizarContadores(socios) {
  const totalEl = $("totalSocios");
  const activosEl = $("sociosActivos");
  const proximosEl = $("proximosVencimientos");

  if (totalEl) totalEl.textContent = socios.length;
  if (activosEl)
    activosEl.textContent = socios.filter(
      (s) => claseEstado(s.estado) === "activo",
    ).length;
  if (proximosEl)
    proximosEl.textContent = socios.filter(
      (s) => claseEstado(s.estado) === "porvencer",
    ).length;
}

// ---- Buscar y filtrar (en el cliente) ----
buscador.addEventListener("input", () => {
  if (cargaOk) render();
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    filtroEstado = chip.dataset.filtro;
    chips.forEach((c) =>
      c.setAttribute("aria-pressed", c === chip ? "true" : "false"),
    );
    if (cargaOk) render();
  });
});

// ---- Estado vacío: botón de agregar primer socio ----
$("btnVacioAgregar").addEventListener("click", () =>
  $("btnAgregarSocio").click(),
);

// ---- Modal: agregar socio ----
const modal = $("modalSocio");
const btnAgregar = $("btnAgregarSocio");
const btnCerrar = $("btnCerrarModal");
const formSocio = $("formSocio");

btnAgregar.addEventListener("click", () => (modal.style.display = "flex"));
btnCerrar.addEventListener("click", cerrarModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) cerrarModal();
});

function cerrarModal() {
  modal.style.display = "none";
  formSocio.reset();
}

formSocio.addEventListener("submit", async (e) => {
  e.preventDefault();

  const msg = $("form-msg-socio");
  const socio = {
    nombre: formSocio.nombre.value.trim(),
    apellido: formSocio.apellido.value.trim(),
    telefono: formSocio.telefono.value.trim(),
    email: formSocio.email.value.trim(),
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
      body: JSON.stringify(socio),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al crear el socio");

    msg.className = "form__msg";
    msg.textContent = "";
    cerrarModal();
    cargarSocios();
  } catch (error) {
    msg.className = "form__msg error";
    msg.textContent = error.message;
  }
});

// ---- Editar socio ----
// ---- Modal: editar socio ----

const modalEditar = $("modalEditarSocio");
const btnCerrarEditar = $("btnCerrarEditar");
const formEditar = $("formEditarSocio");

let socioEditandoId = null;

function abrirEditarSocio(socioId) {

  const socio = sociosCargados.find(
    s => Number(s.socioId) === Number(socioId)
  );

  if (!socio) {
    alert("No se encontró el socio.");
    return;
  }

  // un socio dado de baja no se puede editar
  if (esInactivo(socio)) {
    alert("Este socio está dado de baja y no se puede editar.");
    return;
  }

  const p = socio.Persona;

  socioEditandoId = socioId;

  $("editarNombre").value = p.nombre || "";
  $("editarApellido").value = p.apellido || "";
  $("editarTelefono").value = p.telefono || "";
  $("editarEmail").value = p.email || "";

  $("form-msg-editar").textContent = "";
  $("form-msg-editar").className = "form__msg";

  modalEditar.style.display = "flex";
}
btnCerrarEditar.addEventListener("click", cerrarModalEditar);

modalEditar.addEventListener("click", e => {
  if (e.target === modalEditar) {
    cerrarModalEditar();
  }
});

function cerrarModalEditar() {
  modalEditar.style.display = "none";
  formEditar.reset();
  socioEditandoId = null;
}
formEditar.addEventListener("submit", async e => {

  e.preventDefault();

  const msg = $("form-msg-editar");

  const datos = {
    nombre: formEditar.nombre.value.trim(),
    apellido: formEditar.apellido.value.trim(),
    telefono: formEditar.telefono.value.trim(),
    email: formEditar.email.value.trim()
  };

  if (!datos.nombre || !datos.apellido || !datos.email) {

    msg.className = "form__msg error";
    msg.textContent = "Completá nombre, apellido y email.";

    return;
  }

  try {

    const res = await fetch(`${API}/${socioEditandoId}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(datos)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || "Error al editar el socio"
      );
    }

    cerrarModalEditar();

    await cargarSocios();

  } catch (error) {

    console.error(error);

    msg.className = "form__msg error";
    msg.textContent = error.message;
  }
});
// ---- Dar de baja (PATCH) ----
async function darDeBaja(socioId) {
  const socio = sociosCargados.find((s) => Number(s.socioId) === Number(socioId));

  if (!socio) {
    alert("No se encontró el socio.");
    return;
  }

  // un socio ya dado de baja no se puede volver a dar de baja
  if (esInactivo(socio)) {
    alert("Este socio ya se encuentra dado de baja.");
    return;
  }

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
