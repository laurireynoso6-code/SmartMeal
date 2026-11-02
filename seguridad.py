
# ==================================================
# SMARTMEAL 2.0
# CONFIGURACION DE SEGURIDAD
# Practica Profesionalizante I
# ==================================================

import os
import secrets

from pathlib import Path

from flask import jsonify, request

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from flask_wtf.csrf import (
    CSRFProtect,
    CSRFError,
    generate_csrf
)


# ==========================================
# CLAVE SECRETA DE LA APLICACION
# ==========================================

def obtener_clave_secreta():

    # Permite configurar la clave mediante
    # una variable de entorno.

    clave_entorno = os.environ.get(
        "SMARTMEAL_SECRET_KEY"
    )

    if clave_entorno:
        return clave_entorno

    # Para el proyecto local, generamos
    # una clave y la guardamos en una
    # carpeta privada del proyecto.

    carpeta_datos = (
        Path(__file__).resolve().parent / "datos"
    )

    carpeta_datos.mkdir(exist_ok=True)

    archivo_clave = carpeta_datos / ".secret_key"

    if not archivo_clave.exists():

        nueva_clave = secrets.token_hex(32)

        archivo_clave.write_text(
            nueva_clave,
            encoding="utf-8"
        )

    return archivo_clave.read_text(
        encoding="utf-8"
    ).strip()


# ==========================================
# CONFIGURAR SEGURIDAD
# ==========================================

def configurar_seguridad(app):

    # CLAVE PARA SESIONES Y TOKENS

    app.config["SECRET_KEY"] = (
        obtener_clave_secreta()
    )

    # CONFIGURACION DE COOKIES

    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

    # Estamos desarrollando localmente con HTTP.
    # En un servidor publico con HTTPS
    # debe configurarse como True.

    app.config["SESSION_COOKIE_SECURE"] = False

    # PROTECCION CSRF

    app.config["WTF_CSRF_ENABLED"] = True

    app.config["WTF_CSRF_TIME_LIMIT"] = 3600

    CSRFProtect(app)

    # ==========================================
    # LIMITAR SOLICITUDES
    # ==========================================

    limitador = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["120 per minute"],
    storage_uri="memory://"
)

    # ==========================================
    # ENTREGAR TOKEN AL JAVASCRIPT
    # ==========================================

    @app.get("/api/csrf-token")
    def obtener_token_csrf():

        respuesta = jsonify({
            "csrf_token": generate_csrf()
        })

        respuesta.headers["Cache-Control"] = (
            "no-store"
        )

        return respuesta

    # ==========================================
    # MANEJAR ERRORES CSRF
    # ==========================================

    @app.errorhandler(CSRFError)
    def error_csrf(error):

        return jsonify({
            "error": (
                "No se pudo validar la solicitud "
                "de seguridad. Actualizá la página "
                "e intentá nuevamente."
            )
        }), 400

    # ==========================================
    # LIMITES DE SOLICITUDES
    # ==========================================

    @app.errorhandler(429)
    def demasiadas_solicitudes(error):

        mensaje = (
            "Realizaste demasiadas solicitudes. "
            "Intentá nuevamente en unos minutos."
        )

        if request.path.startswith("/api/"):

            return jsonify({
                "error": mensaje
            }), 429

        return mensaje, 429

    # ==========================================
    # ENCABEZADOS DE SEGURIDAD
    # ==========================================

    @app.after_request
    def agregar_encabezados_seguridad(respuesta):

        respuesta.headers[
            "X-Content-Type-Options"
        ] = "nosniff"

        respuesta.headers[
            "X-Frame-Options"
        ] = "DENY"

        respuesta.headers[
            "Referrer-Policy"
        ] = "strict-origin-when-cross-origin"

        politica_csp = [
            "default-src 'self'",
            (
                "script-src 'self' "
                "https://cdn.jsdelivr.net "
                "https://cdnjs.cloudflare.com"
            ),
            (
                "style-src 'self' 'unsafe-inline' "
                "https://fonts.googleapis.com "
                "https://cdn.jsdelivr.net "
                "https://cdnjs.cloudflare.com"
            ),
            (
                "font-src 'self' "
                "https://fonts.gstatic.com "
                "https://cdn.jsdelivr.net "
                "https://cdnjs.cloudflare.com"
            ),
            "img-src 'self' data: https:",
            "media-src 'self' https:",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'"
        ]

        respuesta.headers[
            "Content-Security-Policy"
        ] = "; ".join(politica_csp)

        return respuesta

    print(
        "Protecciones de seguridad y CSRF activadas."
    )
    return limitador