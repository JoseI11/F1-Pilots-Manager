import json
import sqlite3

# Nombre del archivo JSON y de la base de datos
JSON_FILE = 'test_env.json'
DATABASE_FILE = 'pilotos.db'

def migrate_data():
    """
    Lee los datos del archivo JSON y los inserta en la base de datos SQLite.
    """
    try:
        # Paso 1: Leer los datos del archivo JSON
        with open(JSON_FILE, 'r', encoding='utf-8') as file:
            pilotos_json = json.load(file)
            print(f"✅ Datos cargados desde {JSON_FILE} correctamente.")

        # Paso 2: Conectar a la base de datos
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        print(f"✅ Conexión a la base de datos {DATABASE_FILE} establecida.")

        # Paso 3: Insertar los datos en la tabla
        for piloto in pilotos_json:
            # Eliminar la clave "id" porque SQLite la genera automáticamente
            piloto_a_insertar = (piloto['name'], piloto['team'], piloto['number'])
            
            cursor.execute("INSERT INTO pilotos (name, team, number) VALUES (?, ?, ?)", piloto_a_insertar)
        
        # Guardar los cambios
        conn.commit()
        print(f"✅ {len(pilotos_json)} pilotos insertados en la base de datos.")

    except FileNotFoundError:
        print(f"❌ Error: No se encontró el archivo {JSON_FILE}.")
    except Exception as e:
        print(f"❌ Ocurrió un error durante la migración: {e}")
    finally:
        # Paso 4: Cerrar la conexión
        if 'conn' in locals() and conn:
            conn.close()
            print("✅ Conexión a la base de datos cerrada.")

if __name__ == '__main__':
    migrate_data()
