from flask import Blueprint, request, jsonify
from nosql_db import nosql_db

material_bp = Blueprint('material_bp', __name__)

@material_bp.route('/<ccode>', methods=['POST'])
def save_material(ccode):
    try:
        data = request.json
        data['CCode'] = ccode
        
        # Upsert the document (if it exists, replace, else create)
        nosql_db.materials.update_one(
            {'CCode': ccode}, 
            {'$set': data}, 
            upsert=True
        )
        return jsonify({"message": f"Material for course {ccode} saved successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@material_bp.route('/<ccode>', methods=['GET'])
def get_material(ccode):
    try:
        material = nosql_db.materials.find_one({'CCode': ccode}, {'_id': 0})
        if material:
            return jsonify(material), 200
        else:
            return jsonify({"error": "Course materials not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
