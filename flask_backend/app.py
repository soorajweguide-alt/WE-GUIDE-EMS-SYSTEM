import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify, send_from_directory, request, send_file
from flask_cors import CORS
from database.db import init_db

from routes.employees import employees_bp
from routes.attendance import attendance_bp
from routes.public import public_bp

app = Flask(__name__)
# Allow CORS from the frontend React app
CORS(app, supports_credentials=True, origins=[
    os.environ.get('FRONTEND_URL', 'http://localhost:3000'),
    'http://localhost:5173',
    'http://localhost:3001'
])

app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024 # 10MB limit

# Initialize DB on startup
with app.app_context():
    init_db()
    print("✅ Database initialised")

# Register API blueprints
app.register_blueprint(employees_bp, url_prefix='/api/employees')
app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
app.register_blueprint(public_bp, url_prefix='/api/public')

# Serve public profile HTML page
@app.route('/profile/<string:token>')
def serve_profile(token):
    public_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'public'))
    return send_from_directory(public_dir, 'profile.html')

# Health Check
@app.route('/api/health')
def health_check():
    import datetime
    return jsonify({
        "success": True, 
        "status": "OK", 
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    })

# 404 handler
@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "message": f"{request.path} not found"}), 404

# 500 handler
@app.errorhandler(500)
def server_error(e):
    return jsonify({"success": False, "message": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"\n🚀 WE GUIDE Flask API  →  http://localhost:{port}")
    print(f"📋 Health check  →  http://localhost:{port}/api/health\n")
    app.run(host='0.0.0.0', port=port, debug=True)
