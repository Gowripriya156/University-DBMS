from flask import Blueprint, request, jsonify
from db import get_db

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    conn = get_db()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.callproc('sp_AuthenticateUser', (username, password))
        result = None
        for r in cursor.stored_results():
            result = r.fetchone()

        if result:
            return jsonify({
                'success': True,
                'user': {
                    'username': result['Username'],
                    'role': result['Role'],
                    'college': result['CollegeName']
                }
            })
        else:
            return jsonify({'error': 'Invalid username or password'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
