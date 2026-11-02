
/* ==================================================
   SMARTMEAL 2.0
   JAVASCRIPT GENERAL
   Navegacion, menu responsive y formulario
================================================== */

// ==========================================
// NAVEGACION: VOY DE COMPRAS
// ==========================================

const menuPrincipal = document.querySelector(".nav-links");

if (menuPrincipal) {

    // Comprobamos si estamos dentro de la carpeta pages
    const paginaSecundaria = window.location.pathname
        .split("/")
        .includes("pages");

    // Creamos la ruta correspondiente
    const rutaCompras = paginaSecundaria
        ? "compras.html"
        : "pages/compras.html";

    // Buscamos si ya existe el enlace de compras
    let enlaceCompras = Array.from(
        menuPrincipal.querySelectorAll("a")
    ).find(enlace =>
        enlace.textContent.toLowerCase().includes("voy de compras") ||
        (enlace.getAttribute("href") || "").includes("chatgpt.site")
    );

    if (enlaceCompras) {

        // Si existe, actualizamos su destino
        enlaceCompras.href = rutaCompras;

        // Ya no necesitamos abrir otra pestaña
        enlaceCompras.removeAttribute("target");
        enlaceCompras.removeAttribute("rel");

    } else {

        // Si no existe, creamos el enlace
        const nuevoItem = document.createElement("li");
        const nuevoEnlace = document.createElement("a");

        nuevoEnlace.href = rutaCompras;

        const icono = document.createElement("i");
        icono.className = "bi bi-cart3";

        nuevoEnlace.append(
            icono,
            document.createTextNode(" Voy de compras")
        );

        nuevoItem.appendChild(nuevoEnlace);

        // Lo ubicamos antes de Contacto
        const enlaceContacto = Array.from(
            menuPrincipal.querySelectorAll("a")
        ).find(enlace =>
            (enlace.getAttribute("href") || "").endsWith("contacto.html")
        );

        if (enlaceContacto) {
            menuPrincipal.insertBefore(
                nuevoItem,
                enlaceContacto.closest("li")
            );
        } else {
            menuPrincipal.appendChild(nuevoItem);
        }

        enlaceCompras = nuevoEnlace;
    }

    // Marcar como activa la pagina de compras
    if (window.location.pathname.endsWith("/compras.html")) {

        menuPrincipal.querySelectorAll("a").forEach(enlace => {
            enlace.classList.remove("nav-activo");
        });

        enlaceCompras.classList.add("nav-activo");
    }
}


// ==========================================
// MENU HAMBURGUESA
// ==========================================

const botonMenu = document.querySelector(".menu-toggle");

if (botonMenu && menuPrincipal) {

    function cerrarMenu() {

        menuPrincipal.classList.remove("abierto");

        botonMenu.setAttribute("aria-expanded", "false");
        botonMenu.setAttribute("aria-label", "Abrir menú");

        const icono = botonMenu.querySelector("i");

        if (icono) {
            icono.className = "bi bi-list";
        }
    }

    botonMenu.addEventListener("click", () => {

        const abierto = menuPrincipal.classList.toggle("abierto");

        botonMenu.setAttribute("aria-expanded", String(abierto));

        botonMenu.setAttribute(
            "aria-label",
            abierto ? "Cerrar menú" : "Abrir menú"
        );

        const icono = botonMenu.querySelector("i");

        if (icono) {
            icono.className = abierto
                ? "bi bi-x-lg"
                : "bi bi-list";
        }

    });

    // Cerrar al seleccionar una pagina
    menuPrincipal.querySelectorAll("a").forEach(enlace => {

        enlace.addEventListener("click", cerrarMenu);

    });

    // Cerrar al presionar Escape
    document.addEventListener("keydown", evento => {

        if (evento.key === "Escape") {
            cerrarMenu();
        }

    });
}


// ==========================================
// FORMULARIO DE CONTACTO
// ==========================================

const formularioContacto = document.querySelector("#formulario-contacto");

const mensajeFormulario = document.querySelector("#mensaje-formulario");

if (formularioContacto && mensajeFormulario) {

    formularioContacto.addEventListener("submit", evento => {

        evento.preventDefault();

        if (!formularioContacto.reportValidity()) {
            return;
        }

        // El formulario todavia es una demostracion
        mensajeFormulario.textContent =
            "Formulario validado correctamente. " +
            "Esta versión de demostración no envía mensajes.";

        mensajeFormulario.classList.add("mensaje-exito");

        formularioContacto.reset();

    });

}
