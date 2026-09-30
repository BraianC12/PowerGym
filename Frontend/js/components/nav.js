(function () {
    const toggle = document.getElementById("navToggle");
    const menu = document.getElementById("menu");

    if (toggle && menu) {
        const abierto = () => menu.classList.contains("open");

        const setEstado = (open) => {
            menu.classList.toggle("open", open);
            toggle.setAttribute("aria-expanded", String(open));
            toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
        };

        toggle.addEventListener("click", () => setEstado(!abierto()));

        menu.addEventListener("click", (e) => {
            if (e.target.closest("a")) setEstado(false);
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && abierto()) {
                setEstado(false);
                toggle.focus();
            }
        });

        window.addEventListener("resize", () => {
            const oculto = window.getComputedStyle(toggle).display === "none";

            if (oculto && abierto()) setEstado(false);
        });
    }
})();
