
# =============================================
# SMARTMEAL 2.0
# AUTENTICACION Y SESIONES DE USUARIO
# =============================================

from datetime import timedelta

from flask import jsonify, request, session
from werkzeug.security import check_password_hash

from models import db, Usuario


def registrar_autenticacion(app, limitador):

    # Duracion maxima de la sesion
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(
        hours=8
    )

    # =========================================
    # CONSULTAR SESION ACTUAL
    # =========================================

    @app.get("/api/sesion")
    def consultar_sesion():

        usuario_id = session.get("usuario_id")

        if not isinstance(usuario_id, int):
            return jsonify({
                "autenticado": False
            })

        with db.connection_context():

            usuario = Usuario.get_or_none(
                (Usuario.id == usuario_id) &
                (Usuario.activo == True)
            )

        if usuario is None:
            session.clear()
            return jsonify({
                "autenticado": False
            })

        return jsonify({
            "autenticado": True,
            "usuario": usuario.nombre_usuario
        })

    # =========================================
    # INICIAR SESION
    # =========================================

    @app.post("/api/login")
    @limitador.limit("5 per minute")
    def iniciar_sesion():

        datos = request.get_json(silent=True)

        if not isinstance(datos, dict):
            return jsonify({
                "error": "Solicitud no valida."
            }), 400

        nombre = datos.get("usuario", "")
        contrasena = datos.get("password", "")

        if (
            not isinstance(nombre, str)
            or not isinstance(contrasena, str)
        ):
            return jsonify({
                "error": "Datos de acceso no validos."
            }), 400

        nombre = nombre.strip().lower()

        if (
            not 3 <= len(nombre) <= 30
            or not 1 <= len(contrasena) <= 128
        ):
            return jsonify({
                "error": "Usuario o contraseña incorrectos."
            }), 401

        # Buscar usuario y verificar el hash

        with db.connection_context():

            usuario = Usuario.get_or_none(
                (Usuario.nombre_usuario == nombre) &
                (Usuario.activo == True)
            )

            valido = (
                usuario is not None
                and check_password_hash(
                    usuario.password_hash,
                    contrasena
                )
            )

        if not valido:
            return jsonify({
                "error": "Usuario o contraseña incorrectos."
            }), 401

        # Crear una nueva sesion

        session.clear()
        session.permanent = True

        session["usuario_id"] = usuario.id
        session["usuario_nombre"] = usuario.nombre_usuario

        return jsonify({
            "mensaje": "Sesion iniciada correctamente.",
            "autenticado": True,
            "usuario": usuario.nombre_usuario
        })

    # =========================================
    # CERRAR SESION
    # =========================================

    @app.post("/api/logout")
    def cerrar_sesion():

        session.clear()

        return jsonify({
            "mensaje": "Sesion cerrada correctamente."
        })

    print("Sistema de autenticacion registrado.")
