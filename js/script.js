
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

/* ==================================================
   SMARTMEAL 2.0
   SOLICITUDES PROTEGIDAS CON CSRF
================================================== */

async function fetchSeguro(direccion, opciones = {}) {

    const metodo = (
        opciones.method || "GET"
    ).toUpperCase();

    const metodosProtegidos = [
        "POST",
        "PUT",
        "PATCH",
        "DELETE"
    ];

    // Las consultas GET no modifican datos,
    // por lo que no necesitan token CSRF.

    if (!metodosProtegidos.includes(metodo)) {

        return fetch(direccion, opciones);

    }

    // Solo permitimos modificar datos
    // de nuestra propia API.

    const destino = new URL(
        direccion,
        window.location.href
    );

    if (
        destino.origin !== window.location.origin ||
        !destino.pathname.startsWith("/api/")
    ) {

        throw new Error(
            "La solicitud no pertenece a SmartMeal."
        );

    }

    // Consultar el token de seguridad.

    const respuestaToken = await fetch(
        "/api/csrf-token",
        {
            method: "GET",
            cache: "no-store",
            credentials: "same-origin"
        }
    );

    if (!respuestaToken.ok) {

        throw new Error(
            "No se pudo obtener el token de seguridad."
        );

    }

    const datosToken = await respuestaToken.json();

    if (!datosToken.csrf_token) {

        throw new Error(
            "El servidor no entregó un token válido."
        );

    }

    // Agregar el token a los encabezados.

    const encabezados = new Headers(
        opciones.headers || {}
    );

    encabezados.set(
        "X-CSRFToken",
        datosToken.csrf_token
    );

    // Enviar la solicitud protegida.

    return fetch(direccion, {
        ...opciones,
        headers: encabezados,
        credentials: "same-origin"
    });

}

/* ==================================================
   SMARTMEAL 2.0
   NAVEGACION DE SESION
================================================== */

async function prepararMenuSesion() {

    const menu = document.querySelector(".nav-links");

    // La pagina de login no tiene este menu
    if (!menu) {
        return;
    }

    // Evitar crear botones duplicados
    if (document.querySelector("#item-sesion")) {
        return;
    }

    const item = document.createElement("li");
    item.id = "item-sesion";

    const paginaSecundaria = window.location.pathname
        .split("/")
        .includes("pages");

    const rutaLogin = paginaSecundaria
        ? "login.html"
        : "pages/login.html";

    try {

        const respuesta = await fetch("/api/sesion", {
            cache: "no-store",
            credentials: "same-origin"
        });

        if (!respuesta.ok) {
            throw new Error(
                "No se pudo consultar la sesión."
            );
        }

        const sesion = await respuesta.json();

        if (sesion.autenticado) {

            // USUARIO CON SESION INICIADA

            const boton = document.createElement("button");

            boton.type = "button";
            boton.className = "nav-sesion-boton";

            boton.textContent = "Cerrar sesión";

            boton.addEventListener("click", async function () {

                boton.disabled = true;
                boton.textContent = "Cerrando sesión...";

                try {

                    const respuestaLogout = await fetchSeguro(
                        "/api/logout",
                        {
                            method: "POST"
                        }
                    );

                    if (!respuestaLogout.ok) {
                        throw new Error(
                            "No se pudo cerrar la sesión."
                        );
                    }

                    // Volver al inicio de sesión
                    window.location.assign(
                        "/pages/login.html"
                    );

                } catch (error) {

                    alert(error.message);

                    boton.disabled = false;
                    boton.textContent = "Cerrar sesión";

                }

            });

            item.appendChild(boton);

        } else {

            // USUARIO SIN SESION INICIADA

            const enlace = document.createElement("a");

            enlace.href = rutaLogin;
            enlace.textContent = "Iniciar sesión";

            item.appendChild(enlace);

        }

    } catch (error) {

        // Si falla la consulta, mostrar acceso al login
        const enlace = document.createElement("a");

        enlace.href = rutaLogin;
        enlace.textContent = "Iniciar sesión";

        item.appendChild(enlace);

    }

    menu.appendChild(item);

}


// Ejecutar al abrir cada pagina
prepararMenuSesion();
