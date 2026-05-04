from flask import Blueprint, request, jsonify, Response
from datetime import datetime
import os

from database.db import get_db, write_db
from utils.crypto import generate_secure_token, build_qr_payload
from utils.qr_generator import generate_qrcode_base64, generate_qrcode_svg

employees_bp = Blueprint('employees', __name__)
BASE_URL = os.environ.get('QR_BASE_URL', 'http://localhost:5000')

def sanitize(emp):
    if not emp: return None
    return {k: v for k, v in emp.items() if k != 'secure_token'}

def next_id(arr):
    return max([e.get('id', 0) for e in arr], default=0) + 1

@employees_bp.route('/', methods=['GET'])
def get_employees():
    try:
        db = get_db()
        search = request.args.get('search', '').lower()
        department = request.args.get('department')
        
        emp_list = list(db['employees'])
        
        if search:
            emp_list = [e for e in emp_list if 
                        search in e.get('name', '').lower() or
                        search in e.get('employee_id', '').lower() or
                        search in e.get('designation', '').lower() or
                        search in e.get('department', '').lower()]
                        
        if department:
            emp_list = [e for e in emp_list if e.get('department') == department]
            
        today = datetime.now().strftime('%Y-%m-%d')
        attendance_today = [a for a in db['attendance'] if a['date'] == today]
        
        result = []
        for e in emp_list:
            sanitized = sanitize(e)
            record = next((a for a in attendance_today if a['employee_id'] == e['employee_id']), None)
            sanitized['present_today'] = bool(record)
            if record:
                is_check_in = (len(record.get('scans', [])) % 2 != 0) if 'scans' in record else not record.get('time_out')
                sanitized['attendance_status'] = 'Checked In' if is_check_in else 'Checked Out'
            else:
                sanitized['attendance_status'] = 'Pending'
            result.append(sanitized)
            
        return jsonify({"success": True, "data": result, "count": len(result)})
    except Exception as e:
        print(e)
        return jsonify({"success": False, "message": "Failed to fetch employees"}), 500

@employees_bp.route('/departments', methods=['GET'])
def get_departments():
    db = get_db()
    depts = sorted(list(set(e.get('department') for e in db['employees'] if e.get('department'))))
    return jsonify({"success": True, "data": depts})

@employees_bp.route('/<string:emp_id>', methods=['GET'])
def get_employee(emp_id):
    db = get_db()
    emp = next((e for e in db['employees'] if e.get('employee_id') == emp_id), None)
    if not emp:
        return jsonify({"success": False, "message": "Employee not found"}), 404
    return jsonify({"success": True, "data": sanitize(emp)})

@employees_bp.route('/', methods=['POST'])
def create_employee():
    try:
        db = get_db()
        data = request.json
        required = ['employee_id', 'name', 'designation', 'department', 'dob', 'age', 'gender', 'blood_group', 'address', 'phone', 'emergency_contact']
        
        missing = [k for k in required if data.get(k) in (None, '')]
        if missing:
            return jsonify({"success": False, "message": f"Missing: {', '.join(missing)}"}), 400
            
        if any(e.get('employee_id') == data['employee_id'] for e in db['employees']):
            return jsonify({"success": False, "message": "Employee ID already exists"}), 409
            
        secure_token = generate_secure_token()
        
        github_url = os.environ.get('GITHUB_PAGES_URL', 'https://weguideai.github.io/employee-profiles')
        profile_url = f"{github_url.rstrip('/')}/{data['name'].strip()}.html"
            
        qr_payload = build_qr_payload(secure_token, profile_url)
        qr_data = generate_qrcode_base64(qr_payload)
        
        now = datetime.utcnow().isoformat() + 'Z'
        
        new_emp = {
            "id": next_id(db['employees']),
            "employee_id": data['employee_id'],
            "name": data['name'],
            "designation": data['designation'],
            "department": data['department'],
            "dob": data['dob'],
            "age": int(data['age']),
            "gender": data['gender'],
            "blood_group": data['blood_group'],
            "address": data['address'],
            "phone": data['phone'],
            "emergency_contact": data['emergency_contact'],
            "secure_token": secure_token,
            "profile_url": profile_url,
            "qr_data": qr_data,
            "created_at": now,
            "updated_at": now,
        }
        
        db['employees'].append(new_emp)
        write_db()
        
        return jsonify({"success": True, "data": sanitize(new_emp), "message": "Employee created successfully"}), 201
    except Exception as e:
        print(e)
        return jsonify({"success": False, "message": "Failed to create employee"}), 500

@employees_bp.route('/<string:emp_id>', methods=['PUT'])
def update_employee(emp_id):
    try:
        db = get_db()
        idx = next((i for i, e in enumerate(db['employees']) if e.get('employee_id') == emp_id), -1)
        if idx == -1:
            return jsonify({"success": False, "message": "Employee not found"}), 404
            
        emp = db['employees'][idx]
        data = request.json
        fields = ['name','designation','department','dob','age','gender','blood_group','address','phone','emergency_contact']
        for f in fields:
            if f in data:
                emp[f] = int(data[f]) if f == 'age' else data[f]
                
        if 'profile_url' in data and data['profile_url'] != emp.get('profile_url'):
            emp['profile_url'] = data['profile_url']
            qr_payload = build_qr_payload(emp['secure_token'], emp['profile_url'])
            emp['qr_data'] = generate_qrcode_base64(qr_payload)
                
        emp['updated_at'] = datetime.utcnow().isoformat() + 'Z'
        write_db()
        return jsonify({"success": True, "data": sanitize(emp), "message": "Employee updated successfully"})
    except Exception as e:
        print(e)
        return jsonify({"success": False, "message": "Failed to update employee"}), 500

@employees_bp.route('/<string:emp_id>', methods=['DELETE'])
def delete_employee(emp_id):
    try:
        db = get_db()
        before = len(db['employees'])
        db['employees'] = [e for e in db['employees'] if e.get('employee_id') != emp_id]
        db['attendance'] = [a for a in db['attendance'] if a.get('employee_id') != emp_id]
        
        if len(db['employees']) == before:
            return jsonify({"success": False, "message": "Employee not found"}), 404
            
        write_db()
        return jsonify({"success": True, "message": "Employee deleted successfully"})
    except Exception as e:
        print(e)
        return jsonify({"success": False, "message": "Failed to delete employee"}), 500

@employees_bp.route('/<string:emp_id>/qr', methods=['GET'])
def get_qr(emp_id):
    try:
        db = get_db()
        emp = next((e for e in db['employees'] if e.get('employee_id') == emp_id), None)
        if not emp:
            return jsonify({"success": False, "message": "Employee not found"}), 404
            
        if request.args.get('format') == 'svg':
            svg = generate_qrcode_svg(build_qr_payload(emp['secure_token'], emp['profile_url']))
            return Response(svg, mimetype='image/svg+xml', headers={'Content-Disposition': f'attachment; filename="qr_{emp_id}.svg"'})
            
        return jsonify({"success": True, "data": {"qr_base64": emp['qr_data'], "employee_id": emp_id, "name": emp['name']}})
    except Exception as e:
        print(e)
        return jsonify({"success": False, "message": "Failed to get QR"}), 500

@employees_bp.route('/<string:emp_id>/attendance', methods=['GET'])
def get_employee_attendance(emp_id):
    try:
        db = get_db()
        month = request.args.get('month')
        year = request.args.get('year')
        logs = [a for a in db['attendance'] if a.get('employee_id') == emp_id]
        
        if month and year:
            logs = [a for a in logs if a['date'].startswith(f"{year}-{int(month):02d}")]
            
        logs.sort(key=lambda x: x['date'], reverse=True)
        return jsonify({"success": True, "data": logs, "count": len(logs)})
    except Exception as e:
        print(e)
        return jsonify({"success": False, "message": "Failed to fetch attendance"}), 500
