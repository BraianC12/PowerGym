// ==========================================================
// COMPONENTS / MODAL
// Abrir, cerrar y cerrar-al-clicar-fuera. El CSS de
// components/modals.css mantiene el modal en display:none
// y el JS lo muestra con display:flex.
// ==========================================================

export function abrir(modal) {
  modal.style.display = "flex";
}

export function cerrar(modal) {
  modal.style.display = "none";
}

// Botón de cerrar + click en el fondo
export function conectarCierre(modal, botonCerrar, alCerrar) {
  botonCerrar.addEventListener("click", () => {
    cerrar(modal);
    alCerrar?.();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      cerrar(modal);
      alCerrar?.();
    }
  });
}
