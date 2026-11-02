
# ==================================================
# SMARTMEAL 2.0
# CREACION SEGURA DE USUARIO
# Practica Profesionalizante I
# ==================================================

import re
from getpass import getpass

from werkzeug.security import generate_password_hash
from peewee import IntegrityError

from models import (
    db,
    Usuario,
    inicializar_base_datos
)


def crear_usuario():

    print("\n================================")
    print("       SMARTMEAL 2.0")
    print("     CREAR PRIMER USUARIO")
    print("================================\n")

    # Comprobar que exista la tabla
    inicializar_base_datos()

    with db.connection_context():

        # Por ahora, una cuenta por instalación
        if Usuario.select().exists():

            print("Ya existe un usuario registrado.")
            print("No se creó ninguna cuenta nueva.")
            return

        # ======================================
        # NOMBRE DE USUARIO
        # ======================================

        nombre = input(
            "Elegí un nombre de usuario: "
        ).strip().lower()

        if not re.fullmatch(
            r"[a-z0-9_-]{3,30}",
            nombre
        ):

            print("\nNombre de usuario no válido.")
            print(
                "Usá entre 3 y 30 caracteres: "
                "letras sin acentos, números, "
                "guiones o guion bajo."
            )
            return

        # ======================================
        # CONTRASEÑA
        # ======================================

        print("\nLa contraseña no aparecerá al escribir.")

        contrasena = getpass(
            "Elegí una contraseña: "
        )

        if not 12 <= len(contrasena) <= 128:

            print(
                "\nLa contraseña debe tener "
                "entre 12 y 128 caracteres."
            )
            return

        repetir = getpass(
            "Repetí la contraseña: "
        )

        if contrasena != repetir:

            print("\nLas contraseñas no coinciden.")
            return

        # ======================================
        # PROTEGER Y GUARDAR
        # ======================================

        # Nunca guardamos la contraseña original.
        # Werkzeug genera un hash seguro.

        hash_contrasena = generate_password_hash(
            contrasena,
            method="scrypt"
        )

        try:

            Usuario.create(
                nombre_usuario=nombre,
                password_hash=hash_contrasena,
                activo=True
            )

        except IntegrityError:

            print(
                "\nNo se pudo crear el usuario."
            )
            return

    print("\n================================")
    print("¡USUARIO CREADO CORRECTAMENTE!")
    print("================================")
    print(f"Nombre de usuario: {nombre}")
    print("Contraseña: protegida mediante hash.")
    print("\nLa cuenta está guardada en SQLite.")


if __name__ == "__main__":
    crear_usuario()
