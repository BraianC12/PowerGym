// ==========================================================
// VIEW / DASHBOARD ADMINISTRADOR
// Resumen con datos de la API + calendario del mes.
// ==========================================================

import { $ } from "../components/dom.js";
import { exigirSesion } from "../api/sesion.js";
import { obtenerSocios } from "../api/sociosApi.js";
import { obtenerEntrenadores } from "../api/entrenadoresApi.js";
import { obtenerHistorial } from "../api/avisosApi.js";

exigirSesion();

// ---------- Resumen ----------

const statSociosActivos = $("statSociosActivos");
const statEntrenadores = $("statEntrenadores");
const statVencimientos = $("statVencimientos");

function claseEstado(estado) {
  const t = String(estado || "").toLowerCase();

  if (t.includes("inactiv") || t.includes("baja")) {
    return "inactivo";
  }

  if (t.includes("activ")) {
    return "activo";
  }

  return "inactivo";
}

async function cargarResumen() {
  try {
    const [socios, entrenadores] = await Promise.all([
      obtenerSocios(),
      obtenerEntrenadores(),
    ]);

    const sociosActivos = Array.isArray(socios)
      ? socios.filter((s) => claseEstado(s.estado) === "activo").length
      : 0;

    const entrenadoresTotal = Array.isArray(entrenadores)
      ? entrenadores.length
      : Array.isArray(entrenadores?.entrenadores)
        ? entrenadores.entrenadores.length
        : 0;

    statSociosActivos.textContent = sociosActivos;
    statEntrenadores.textContent = entrenadoresTotal;
  } catch (error) {
    console.error("No se pudo cargar el resumen:", error);
  }

  cargarVencimientos();
}

async function cargarVencimientos() {
  try {
    const { resumen } = await obtenerHistorial();
    statVencimientos.textContent = Number(resumen?.hoy) || 0;
  } catch (error) {
    console.error("No se pudo cargar los vencimientos:", error);
  }
}

cargarResumen();

// ---------- Calendario ----------

const calendar = $("calendar");
const calendarTitle = $("calendarTitle");

const prevMonth = $("prevMonth");
const nextMonth = $("nextMonth");

let currentDate = new Date();

const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
];

function mostrarCalendario() {

    calendar.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    calendarTitle.textContent = `${meses[month]} ${year}`;

    // Primer día del mes
    const primerDia = new Date(year, month, 1);

    // Último día del mes
    const ultimoDia = new Date(year, month + 1, 0);

    // Convertimos domingo = 0 a lunes = 0
    let diaInicio = primerDia.getDay();

    if (diaInicio === 0) {
        diaInicio = 6;
    } else {
        diaInicio--;
    }

    // Días del mes anterior
    const mesAnterior = new Date(year, month, 0);
    const diasMesAnterior = mesAnterior.getDate();

    for (let i = diaInicio - 1; i >= 0; i--) {

        const dia = document.createElement("div");

        dia.classList.add("calendar-day", "other-month");

        dia.textContent = diasMesAnterior - i;

        calendar.appendChild(dia);
    }

    // Días del mes actual
    for (let diaNumero = 1; diaNumero <= ultimoDia.getDate(); diaNumero++) {

        const dia = document.createElement("div");

        dia.classList.add("calendar-day");

        dia.textContent = diaNumero;

        // Marcar día actual
        const hoy = new Date();

        if (
            diaNumero === hoy.getDate() &&
            month === hoy.getMonth() &&
            year === hoy.getFullYear()
        ) {
            dia.classList.add("today");
        }

        calendar.appendChild(dia);
    }

    // Completar última semana
    const diasRestantes = 42 - calendar.children.length;

    for (let i = 1; i <= diasRestantes; i++) {

        const dia = document.createElement("div");

        dia.classList.add("calendar-day", "other-month");

        dia.textContent = i;

        calendar.appendChild(dia);
    }
}

// Mes anterior
prevMonth.addEventListener("click", () => {

    currentDate.setMonth(currentDate.getMonth() - 1);

    mostrarCalendario();
});

// Mes siguiente
nextMonth.addEventListener("click", () => {

    currentDate.setMonth(currentDate.getMonth() + 1);

    mostrarCalendario();
});

mostrarCalendario();