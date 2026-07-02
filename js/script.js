const botonMenu = document.querySelector(".menu-toggle");
const menuPrincipal = document.querySelector(".nav-links");

if (botonMenu && menuPrincipal) {
    botonMenu.addEventListener("click", () => {
        const menuAbierto = menuPrincipal.classList.toggle("abierto");

        botonMenu.setAttribute("aria-expanded", menuAbierto);

        const icono = botonMenu.querySelector("i");

        if (menuAbierto) {
            botonMenu.setAttribute("aria-label", "Cerrar menú");

            if (icono) {
                icono.className = "bi bi-x-lg";
            }
        } else {
            botonMenu.setAttribute("aria-label", "Abrir menú");

            if (icono) {
                icono.className = "bi bi-list";
            }
        }
    });

    const enlacesMenu = menuPrincipal.querySelectorAll("a");

    enlacesMenu.forEach((enlace) => {
        enlace.addEventListener("click", () => {
            menuPrincipal.classList.remove("abierto");
            botonMenu.setAttribute("aria-expanded", "false");

            const icono = botonMenu.querySelector("i");

            if (icono) {
                icono.className = "bi bi-list";
            }
        });
    });
}

/* Formulario de contacto */

const formularioContacto = document.querySelector("#formulario-contacto");
const mensajeFormulario = document.querySelector("#mensaje-formulario");

if (formularioContacto && mensajeFormulario) {
    formularioContacto.addEventListener("submit", (evento) => {
        evento.preventDefault();

        if (!formularioContacto.checkValidity()) {
            formularioContacto.reportValidity();
            return;
        }

        mensajeFormulario.textContent =
            "¡Mensaje enviado correctamente! Gracias por comunicarte con SmartMeal.";

        mensajeFormulario.classList.add("mensaje-exito");

        formularioContacto.reset();
    });
}