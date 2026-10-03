// ==========================================================
// VIEW / DASHBOARD ADMINISTRADOR
// Calendario del mes. El resto del layout viene del CSS.
// ==========================================================

import { $ } from "../components/dom.js";
import { exigirSesion } from "../api/sesion.js";

exigirSesion();

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