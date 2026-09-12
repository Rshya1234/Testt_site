import os, secrets, sqlite3
from functools import wraps
from flask import Flask, request, jsonify, g
from flask_cors import CORS

BASE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE, 'chat.db')
ADMIN_USER = os.getenv('ADMIN_USER', 'admin')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'change-me-now')
ADMIN_TOKEN = os.getenv('ADMIN_TOKEN') or secrets.token_urlsafe(32)
app = Flask(__name__)
CORS(app, resources={r'/api/*': {'origins': '*'}})

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(_):
    db = g.pop('db', None)
    if db: db.close()

def init_db():
    db = sqlite3.connect(DB)
    db.executescript('''
    CREATE TABLE IF NOT EXISTS users(username TEXT PRIMARY KEY, verified INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, text TEXT NOT NULL, ip TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS banned_ips(ip TEXT PRIMARY KEY, reason TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    ''')
    db.commit(); db.close()

def client_ip():
    # In production, only trust X-Forwarded-For when it comes from your own reverse proxy.
    return request.headers.get('X-Forwarded-For', request.remote_addr or '').split(',')[0].strip()

def is_banned(ip):
    return get_db().execute('SELECT 1 FROM banned_ips WHERE ip=?', (ip,)).fetchone() is not None

def admin_required(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        if request.headers.get('Authorization') != f'Bearer {ADMIN_TOKEN}':
            return jsonify(error='Unauthorized'), 401
        return fn(*args, **kwargs)
    return wrapped

@app.get('/api/health')
def health(): return jsonify(ok=True)

@app.get('/api/messages')
def messages():
    rows = get_db().execute('''SELECT m.id,m.username,m.text,m.created_at,u.verified
                               FROM messages m LEFT JOIN users u ON u.username=m.username
                               ORDER BY m.id DESC LIMIT 100''').fetchall()
    return jsonify(messages=[dict(r) for r in reversed(rows)])

@app.post('/api/messages')
def send_message():
    ip = client_ip()
    if is_banned(ip): return jsonify(error='You are banned'), 403
    data = request.get_json(silent=True) or {}
    username = str(data.get('username','')).strip()[:24]
    text = str(data.get('text','')).strip()[:500]
    if not username or not text: return jsonify(error='Username and message are required'), 400
    db = get_db()
    db.execute('INSERT OR IGNORE INTO users(username) VALUES(?)', (username,))
    db.execute('INSERT INTO messages(username,text,ip) VALUES(?,?,?)', (username,text,ip))
    db.commit()
    row = db.execute('SELECT verified FROM users WHERE username=?', (username,)).fetchone()
    return jsonify(ok=True, verified=bool(row['verified']))

@app.post('/api/admin/login')
def admin_login():
    data = request.get_json(silent=True) or {}
    if data.get('username') == ADMIN_USER and data.get('password') == ADMIN_PASSWORD:
        return jsonify(token=ADMIN_TOKEN)
    return jsonify(error='Invalid credentials'), 401

@app.get('/api/admin/bans')
@admin_required
def list_bans():
    rows = get_db().execute('SELECT ip,reason,created_at FROM banned_ips ORDER BY created_at DESC').fetchall()
    return jsonify(bans=[dict(r) for r in rows])

@app.post('/api/admin/ban')
@admin_required
def ban():
    data = request.get_json(silent=True) or {}
    ip = str(data.get('ip','')).strip()
    reason = str(data.get('reason','')).strip()[:200]
    if not ip: return jsonify(error='IP required'), 400
    db=get_db(); db.execute('INSERT OR REPLACE INTO banned_ips(ip,reason) VALUES(?,?)',(ip,reason)); db.commit()
    return jsonify(ok=True)

@app.post('/api/admin/unban')
@admin_required
def unban():
    data=request.get_json(silent=True) or {}; ip=str(data.get('ip','')).strip()
    db=get_db(); db.execute('DELETE FROM banned_ips WHERE ip=?',(ip,)); db.commit()
    return jsonify(ok=True)

@app.post('/api/admin/verify')
@admin_required
def verify():
    data=request.get_json(silent=True) or {}; username=str(data.get('username','')).strip()[:24]
    value=1 if data.get('verified', True) else 0
    if not username: return jsonify(error='Username required'),400
    db=get_db(); db.execute('INSERT OR IGNORE INTO users(username) VALUES(?)',(username,)); db.execute('UPDATE users SET verified=? WHERE username=?',(value,username)); db.commit()
    return jsonify(ok=True,verified=bool(value))

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=int(os.getenv('PORT','5000')), debug=False)
