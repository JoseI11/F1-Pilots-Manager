from flask import Flask, request, jsonify, abort
import sqlite3
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
import logging
from functools import wraps
import math
from flask import Flask, request, jsonify, render_template
app = Flask(__name__)
CORS(app)

# Configuración
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
DATABASE = 'pilotos.db'
ITEMS_PER_PAGE = 10

# Helpers
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def validate_pilot_data(data, is_update=False):
    errors = []
    
    if 'name' not in data or not data['name'].strip():
        errors.append("El nombre es requerido")
    elif len(data['name'].strip()) > 100:
        errors.append("El nombre no puede tener más de 100 caracteres")
        
    if 'team' not in data or not data['team'].strip():
        errors.append("El equipo es requerido")
    elif len(data['team'].strip()) > 100:
        errors.append("El equipo no puede tener más de 100 caracteres")
        
    if 'number' not in data:
        errors.append("El número es requerido")
    elif not isinstance(data['number'], int) or data['number'] <= 0:
        errors.append("El número debe ser un entero positivo")
    
    return errors

def check_duplicate_number(number, exclude_id=None):
    conn = get_db_connection()
    try:
        if exclude_id:
            result = conn.execute(
                'SELECT id FROM pilotos WHERE number = ? AND id != ?', 
                (number, exclude_id)
            ).fetchone()
        else:
            result = conn.execute(
                'SELECT id FROM pilotos WHERE number = ?', 
                (number,)
            ).fetchone()
        return result is not None
    finally:
        conn.close()

# Manejo de errores
@app.errorhandler(HTTPException)
def handle_http_exception(e):
    return jsonify({
        "error": e.name,
        "message": e.description,
    }), e.code

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({
        "error": "Recurso no encontrado",
        "message": "El recurso solicitado no existe"
    }), 404

@app.errorhandler(400)
def bad_request_error(error):
    return jsonify({
        "error": "Solicitud incorrecta",
        "message": str(error.description) if error.description else "La solicitud no pudo ser procesada"
    }), 400

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Error interno del servidor: {str(error)}")
    return jsonify({
        "error": "Error interno del servidor",
        "message": "Ocurrió un error inesperado en el servidor"
    }), 500

# Rutas
@app.route('/pilotos', methods=['GET'])
def get_pilotos():
    try:
        # Parámetros de paginación
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', ITEMS_PER_PAGE, type=int)
        per_page = min(per_page, 50)  # Límite de 50 ítems por página
        
        # Filtros
        name_filter = request.args.get('name', '').strip()
        team_filter = request.args.get('team', '').strip()
        number_filter = request.args.get('number', type=int)
        
        conn = get_db_connection()
        
        # Construir consulta dinámica
        query = 'FROM pilotos WHERE 1=1'
        params = []
        
        if name_filter:
            query += ' AND name LIKE ?'
            params.append(f'%{name_filter}%')
            
        if team_filter:
            query += ' AND team LIKE ?'
            params.append(f'%{team_filter}%')
            
        if number_filter:
            query += ' AND number = ?'
            params.append(number_filter)
        
        # Obtener total de registros
        count_query = 'SELECT COUNT(*) as total ' + query
        total_items = conn.execute(count_query, params).fetchone()['total']
        total_pages = math.ceil(total_items / per_page)
        
        # Aplicar paginación
        offset = (page - 1) * per_page
        query = 'SELECT * ' + query + ' ORDER BY name LIMIT ? OFFSET ?'
        params.extend([per_page, offset])
        
        pilotos = conn.execute(query, params).fetchall()
        pilotos = [dict(piloto) for piloto in pilotos]
        
        return jsonify({
            'items': pilotos,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_items': total_items,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        })
        
    except Exception as e:
        logger.error(f"Error al obtener pilotos: {str(e)}")
        abort(500, description="Error al obtener la lista de pilotos")
    finally:
        conn.close()

@app.route('/estadisticas', methods=['GET'])
def get_estadisticas():
    try:
        conn = get_db_connection()
        
        # Obtener todos los pilotos
        pilotos = conn.execute('SELECT * FROM pilotos').fetchall()
        
        if not pilotos:
            return jsonify({
                'total_pilotos': 0,
                'equipos': {},
                'estadisticas': {
                    'numero_maximo': 0,
                    'numero_minimo': 0,
                    'promedio_numeros': 0
                }
            })
        
        # Calcular estadísticas
        equipos = {}
        numeros = []
        
        for piloto in pilotos:
            equipo = piloto['team']
            numero = piloto['number']
            
            # Estadísticas por equipo
            if equipo not in equipos:
                equipos[equipo] = {
                    'cantidad': 0,
                    'numeros': []
                }
            equipos[equipo]['cantidad'] += 1
            equipos[equipo]['numeros'].append(numero)
            
            # Para estadísticas generales
            numeros.append(numero)
        
        # Calcular promedios por equipo
        for equipo in equipos:
            equipos[equipo]['promedio'] = sum(equipos[equipo]['numeros']) / len(equipos[equipo]['numeros'])
        
        # Estadísticas generales
        estadisticas = {
            'total_pilotos': len(pilotos),
            'numero_maximo': max(numeros) if numeros else 0,
            'numero_minimo': min(numeros) if numeros else 0,
            'promedio_numeros': sum(numeros) / len(numeros) if numeros else 0
        }
        
        return jsonify({
            'total_pilotos': estadisticas['total_pilotos'],
            'equipos': equipos,
            'estadisticas': estadisticas
        })
        
    except Exception as e:
        logger.error(f"Error al obtener estadísticas: {str(e)}")
        return jsonify({'error': 'Error al obtener estadísticas'}), 500
    finally:
        conn.close()

@app.route('/pilotos/<int:pilot_id>', methods=['GET'])
def get_piloto(pilot_id):
    conn = get_db_connection()
    try:
        piloto = conn.execute(
            'SELECT * FROM pilotos WHERE id = ?', 
            (pilot_id,)
        ).fetchone()
        
        if piloto is None:
            abort(404, description="Piloto no encontrado")
            
        return jsonify(dict(piloto))
    except Exception as e:
        logger.error(f"Error al obtener piloto {pilot_id}: {str(e)}")
        abort(500, description="Error al obtener el piloto")
    finally:
        conn.close()

@app.route('/pilotos', methods=['POST'])
def create_piloto():
    try:
        data = request.get_json()
        
        if not data:
            abort(400, description="No se proporcionaron datos")
            
        errors = validate_pilot_data(data)
        if errors:
            return jsonify({
                "error": "Error de validación",
                "details": errors
            }), 400
            
        if check_duplicate_number(data['number']):
            return jsonify({
                "error": "Error de validación",
                "details": ["Ya existe un piloto con este número"]
            }), 400
            
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO pilotos (name, team, number) VALUES (?, ?, ?)",
                (data['name'].strip(), data['team'].strip(), data['number'])
            )
            conn.commit()
            new_id = cursor.lastrowid
            
            return jsonify({
                "id": new_id,
                "name": data['name'].strip(),
                "team": data['team'].strip(),
                "number": data['number']
            }), 201
        except sqlite3.IntegrityError as e:
            conn.rollback()
            abort(400, description="Error de base de datos: " + str(e))
        finally:
            conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al crear piloto: {str(e)}")
        abort(500, description="Error al crear el piloto")

@app.route('/pilotos/<int:pilot_id>', methods=['PUT'])
def update_piloto(pilot_id):
    try:
        data = request.get_json()
        
        if not data:
            abort(400, description="No se proporcionaron datos")
            
        errors = validate_pilot_data(data)
        if errors:
            return jsonify({
                "error": "Error de validación",
                "details": errors
            }), 400
            
        if check_duplicate_number(data['number'], pilot_id):
            return jsonify({
                "error": "Error de validación",
                "details": ["Ya existe otro piloto con este número"]
            }), 400
            
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE pilotos 
                SET name = ?, team = ?, number = ?
                WHERE id = ?
                """,
                (
                    data['name'].strip(),
                    data['team'].strip(),
                    data['number'],
                    pilot_id
                )
            )
            
            if cursor.rowcount == 0:
                abort(404, description="Piloto no encontrado")
                
            conn.commit()
            
            return jsonify({
                "id": pilot_id,
                "name": data['name'].strip(),
                "team": data['team'].strip(),
                "number": data['number']
            })
        except sqlite3.IntegrityError as e:
            conn.rollback()
            abort(400, description="Error de base de datos: " + str(e))
        finally:
            conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al actualizar piloto {pilot_id}: {str(e)}")
        abort(500, description="Error al actualizar el piloto")

@app.route('/pilotos/<int:pilot_id>', methods=['DELETE'])
def delete_piloto(pilot_id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM pilotos WHERE id = ?', (pilot_id,))
        
        if cursor.rowcount == 0:
            abort(404, description="Piloto no encontrado")
            
        conn.commit()
        return '', 204
    except Exception as e:
        conn.rollback()
        logger.error(f"Error al eliminar piloto {pilot_id}: {str(e)}")
        abort(500, description="Error al eliminar el piloto")
    finally:
        conn.close()

def create_table():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pilotos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            team TEXT NOT NULL,
            number INTEGER NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    create_table()
    app.run(debug=True)