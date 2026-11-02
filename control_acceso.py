
# ==================================================
# SMARTMEAL 2.0
# CONTROL DE ACCESO A PAGINAS Y API
# Practica Profesionalizante I
# ==================================================

from flask import (
    jsonify,
    redirect,
    request,
    session
)

from models import db, Usuario


# Paginas que necesitan inicio de sesion
PAGINAS_PRIVADAS = {
    "/pages/alimentos.html",
    "/pages/compras.html"
}


# Endpoints que necesitan inicio de sesion
API_PRIVADAS = {
    "/api/alimentos",
    "/api/compras",
    "/api/resumen",
    "/api/recomendaciones"
}


def es_api_privada(ruta):

    return (
        ruta in API_PRIVADAS
        or ruta.startswith("/api/alimentos/")
        or ruta.startswith("/api/compras/")
    )


def configurar_control_acceso(app):

    # ==========================================
    # COMPROBAR LA SESION ANTES DE CADA SOLICITUD
    # ==========================================

    @app.before_request
    def verificar_acceso():

        ruta = request.path

        pagina_privada = ruta in PAGINAS_PRIVADAS
        api_privada = es_api_privada(ruta)

        # Las paginas publicas pueden abrirse
        # sin iniciar sesion.
        if not pagina_privada and not api_privada:
            return None

        usuario_id = session.get("usuario_id")

        # Verificar que exista un usuario
        # en la sesion.
        usuario_valido = False

        if isinstance(usuario_id, int):

            with db.connection_context():

                usuario = Usuario.get_or_none(
                    (Usuario.id == usuario_id) &
                    (Usuario.activo == True)
                )

                usuario_valido = usuario is not None

        if usuario_valido:
            return None

        # Limpiar sesiones incorrectas o vencidas
        session.clear()

        # Las API responden con un error JSON
        if api_privada:

            return jsonify({
                "error": (
                    "Debés iniciar sesión para "
                    "realizar esta operación."
                )
            }), 401

        # Las paginas HTML redirigen al login
        return redirect("/pages/login.html")

    # ==========================================
    # EVITAR CACHE DE INFORMACION PRIVADA
    # ==========================================

    @app.after_request
    def controlar_cache(respuesta):

        ruta = request.path

        if (
            ruta in PAGINAS_PRIVADAS
            or es_api_privada(ruta)
            or ruta == "/api/sesion"
        ):

            respuesta.headers["Cache-Control"] = (
                "no-store"
            )

        return respuesta

    print("Control de acceso privado activado.")
