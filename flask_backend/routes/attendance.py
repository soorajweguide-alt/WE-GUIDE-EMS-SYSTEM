from flask import Blueprint, request, jsonify
from datetime import datetime
from database.db import get_db, write_db

attendance_bp = Blueprint('attendance', __name__)

def next_id(arr):
    return max([e.get('id', 0) for e in arr], default=0) + 1

@attendance_bp.route('/', methods=['GET'])
def get_attendance():
    try:
        db = get_db()
        date = request.args.get('date')
        department = request.args.get('department')
        employee_id = request.args.get('employee_id')
        
        logs = list(db['attendance'])
        
        if date:
            logs = [a for a in logs if a['date'] == date]
        if employee_id:
            logs = [a for a in logs if a['employee_id'] == employee_id]
        if department:
            dept_emp_ids = {e['employee_id'] for e in db['employees'] if e.get('department') == department}
            logs = [a for a in logs if a['employee_id'] in dept_emp_ids]
            
        def sort_key(a):
            # Sort by date desc, then by id desc for consistent ordering
            return (a['date'], a.get('id', 0))
            
        logs.sort(key=sort_key, reverse=True)
        return jsonify({"success": True, "data": logs, "count": len(logs)})
    except Exception as e:
        print(e)
        return jsonify({"success": False, "message": "Failed to fetch attendance"}), 500

@attendance_bp.route('/scan', methods=['POST'])
def mark_attendance():
    try:
        data = request.json
        if not data or not data.get('token'):
            return jsonify({"success": False, "message": "Invalid QR code"}), 400
            
        db = get_db()
        token = data['token']
        import urllib.parse
        clean_token = urllib.parse.unquote(token).strip()
        if clean_token.lower().endswith('.html'):
            clean_token = clean_token[:-5]
            
        def match_emp(e):
            if e.get('secure_token') == token: return True
            if e.get('employee_id', '').lower() == clean_token.lower(): return True
            # Match name ignoring case and spacing
            e_name = e.get('name', '').lower()
            c_name = clean_token.lower()
            if e_name == c_name: return True
            if e_name.replace(' ', '_') == c_name: return True
            if e_name.replace(' ', '') == c_name: return True
            return False
            
        emp = next((e for e in db['employees'] if match_emp(e)), None)
        if not emp:
            return jsonify({"success": False, "message": "Unauthorised or Invalid QR"}), 401
            
        now = datetime.now()
        today = now.strftime('%Y-%m-%d')
        time_in = now.strftime('%I:%M %p')
        
        existing = next((a for a in db['attendance'] if a['employee_id'] == emp['employee_id'] and a['date'] == today), None)
        if existing:
            if 'scans' not in existing:
                existing['scans'] = [existing['time_in']]
            existing['scans'].append(time_in)
            is_check_in = len(existing['scans']) % 2 != 0
            if not is_check_in:
                existing['time_out'] = time_in
            write_db()
            
            return jsonify({
                "success": True,
                "action": 'check_in' if is_check_in else 'check_out',
                "message": f"{'Check-in' if is_check_in else 'Check-out'} recorded for {emp['name']}",
                "data": {
                    "name": emp['name'],
                    "employee_id": emp['employee_id'],
                    "designation": emp.get('designation'),
                    "department": emp.get('department'),
                    "time_in": existing['time_in'],
                    "time_out": existing['time_out'],
                    "date": today
                }
            }), 200

        record = {
            "id": next_id(db['attendance']),
            "employee_id": emp['employee_id'],
            "name": emp['name'],
            "date": today,
            "time_in": time_in,
            "time_out": None,
            "scans": [time_in],
            "marked_by": "QR_SCANNER"
        }
        
        db['attendance'].append(record)
        write_db()
        
        return jsonify({
            "success": True,
            "action": "check_in",
            "message": f"Check-in recorded for {emp['name']}",
            "data": record
        }), 201
    except Exception as e:
        print(e)
        return jsonify({"success": False, "message": "Server error during scan"}), 500
