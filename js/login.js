
/* ==========================================
   SMARTMEAL 2.0
   INICIO DE SESION
========================================== */

const formularioLogin = document.querySelector("#form-login");

const campoUsuario = document.querySelector("#login-usuario");
const campoPassword = document.querySelector("#login-password");

const botonLogin = document.querySelector("#boton-login");
const mensajeLogin = document.querySelector("#mensaje-login");


// Activar el boton cuando JavaScript esta listo
botonLogin.disabled = false;


// ==========================================
// MOSTRAR MENSAJES
// ==========================================

function mostrarMensajeLogin(texto, tipo = "") {

    mensajeLogin.textContent = texto;
    mensajeLogin.className = "login-mensaje " + tipo;

}


// ==========================================
// ENVIAR USUARIO Y CONTRASEÑA
// ==========================================

formularioLogin.addEventListener("submit", async function (evento) {

    evento.preventDefault();

    if (!formularioLogin.reportValidity()) {
        return;
    }

    const datos = {
        usuario: campoUsuario.value.trim(),
        password: campoPassword.value
    };

    botonLogin.disabled = true;

    mostrarMensajeLogin("Comprobando tus datos...");

    try {

        const respuesta = await fetchSeguro("/api/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(datos)

        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {

            throw new Error(
                resultado.error ||
                "No se pudo iniciar sesión."
            );

        }

        mostrarMensajeLogin(
            "¡Inicio de sesión correcto!",
            "exito"
        );

        // Ir al inventario luego del acceso correcto

        window.location.assign(
            "/pages/alimentos.html"
        );

    } catch (error) {

        mostrarMensajeLogin(
            error.message,
            "error"
        );

        // No conservar la contraseña si fue incorrecta
        campoPassword.value = "";
        campoPassword.focus();

    } finally {

        botonLogin.disabled = false;

    }

});
