from flask import Blueprint, request, jsonify
from database.db import get_db

public_bp = Blueprint('public', __name__)

@public_bp.route('/profile/<string:token>', methods=['GET'])
def get_public_profile(token):
    try:
        db = get_db()
        emp = next((e for e in db['employees'] if e.get('secure_token') == token), None)
        if not emp:
            return jsonify({"success": False, "message": "Profile not found"}), 404
            
        data = {
            "name": emp.get('name'),
            "designation": emp.get('designation'),
            "department": emp.get('department'),
            "dob": emp.get('dob'),
            "gender": emp.get('gender'),
            "phone": emp.get('phone'),
            "emergency_contact": emp.get('emergency_contact'),
        }
        return jsonify({"success": True, "data": data})
    except Exception as e:
        print(e)
        return jsonify({"success": False, "message": "Failed to load profile"}), 500
