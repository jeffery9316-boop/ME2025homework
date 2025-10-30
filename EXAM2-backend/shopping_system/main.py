from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from datetime import datetime
import sqlite3
import logging
import re
import os

app = Flask(__name__)
app.secret_key = "exam2-secret"  # demo 用，正式請改環境變數

# === 路徑修改：以 main.py 位置為基準連線 SQLite ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "shopping_data.db")
print(f"[DB] use => {DB_PATH}")

def get_db_connection():
    if not os.path.exists(DB_PATH):
        logging.error(f"Database file not found at {DB_PATH}")
        return None
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# === 首頁（未登入導回登入頁） ===
@app.route('/')
def home():
    if 'username' not in session:
        return redirect(url_for('page_login'))
    return render_template('index.html', username=session['username'])


# === 目前登入者（前端左上角顯示用） ===
@app.route('/api/session-user')
def api_session_user():
    return jsonify({'username': session.get('username')})


# === 登入頁（依老師檔案：保留 page_login 路徑） ===
@app.route('/page_login', methods=['GET', 'POST'])
def page_login():
    if request.method == 'GET':
        return render_template('page_login_.html')

    # 以下補齊：處理登入 POST
    data = request.get_json(force=True)
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()

    conn = get_db_connection()
    if conn is None:
        return jsonify({"status": "error", "message": "Database connection error"}), 500
    try:
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM users WHERE username=? AND password=?", (username, password))
        ok = cur.fetchone()
    finally:
        conn.close()

    if not ok:
        return jsonify({"status": "error", "message": "帳號或密碼錯誤"})
    session['username'] = username
    return jsonify({"status": "success", "message": "登入成功"})


# === 註冊頁 ===
@app.route('/page_register', methods=['GET', 'POST'])
def page_register():
    if request.method == 'GET':
        return render_template('page_register.html')

    # 依註解補齊：處理註冊 POST
    data = request.get_json(force=True)
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()
    email    = (data.get('email') or '').strip()

    if not username or not password or not email:
        return jsonify({"status": "error", "message": "欄位不可為空"})

    # 規則：至少符合 2 條（長度>=8、含大小寫、含數字）
    rule = 0
    if len(password) >= 8: rule += 1
    if re.search(r'[A-Z]', password) and re.search(r'[a-z]', password): rule += 1
    if re.search(r'\d', password): rule += 1
    if rule < 2:
        return jsonify({"status": "error", "message": "密碼需至少符合 2 項：長度≥8、含大小寫、含數字"})

    # Email 必須 gmail.com
    if not re.match(r'^[^@\s]+@gmail\.com$', email):
        return jsonify({"status": "error", "message": "Email 格式不符（需 @gmail.com）"})

    conn = get_db_connection()
    if conn is None:
        return jsonify({"status": "error", "message": "Database connection error"}), 500
    try:
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM users WHERE username=?", (username,))
        exists = cur.fetchone() is not None
        if exists:
            # 老師註解：名稱已被使用 → 我們按照題目要求改為「更新密碼或信箱」
            cur.execute("UPDATE users SET password=?, email=? WHERE username=?",
                        (password, email, username))
            msg = "帳號已存在，成功修改密碼或信箱"
        else:
            cur.execute("INSERT INTO users(username,password,email) VALUES(?,?,?)",
                        (username, password, email))
            msg = "註冊成功"
        conn.commit()
    finally:
        conn.close()
    return jsonify({"status": "success", "message": msg})


# === 登出 ===
@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('page_login'))


# === 下單：依資料表欄位寫入（兼容 Total Price 欄名） ===
@app.route('/api/order', methods=['POST'])
def api_order():
    if 'username' not in session:
        return jsonify({'status':'error','message':'尚未登入'}), 401

    data  = request.get_json(force=True)
    items = data.get('items') or []
    if not items:
        return jsonify({'status':'error','message':'沒有品項'})

    now = datetime.now()
    date_for_alert = now.strftime('%Y/%m/%d')   # 題目 alert 用
    time_for_alert = now.strftime('%H:%M')
    date_for_db    = now.strftime('%Y-%m-%d')   # DB 常見格式
    time_for_db    = time_for_alert

    conn = get_db_connection()
    if conn is None:
        return jsonify({"status": "error", "message": "Database connection error"}), 500

    try:
        cur = conn.cursor()
        # 自動偵測欄位名稱（Total Price / total / total_price 皆可）
        cur.execute("PRAGMA table_info('shop_list_table')")
        cols = [row['name'] for row in cur.fetchall()]
        lower = {c.lower(): c for c in cols}

        def pick(*cands):
            for k in cands:
                if k in lower: return lower[k]
            return None

        col_user   = pick('username', 'user', 'account')
        col_prod   = pick('product')
        col_price  = pick('price')
        col_num    = pick('number')
        col_total  = pick('total', 'total price', 'total_price')
        col_date   = pick('date')
        col_time   = pick('time')

        required = [col_prod, col_price, col_num, col_total, col_date, col_time]
        if any(v is None for v in required):
            return jsonify({'status':'error','message':'shop_list_table 欄位缺失'}), 500

        insert_cols = [col_prod, col_price, col_num, col_total, col_date, col_time]
        values_tpl  = ['?', '?', '?', '?', '?', '?']
        if col_user:
            insert_cols.insert(0, col_user)
            values_tpl.insert(0, '?')
        
        sql = 'INSERT INTO shop_list_table({}) VALUES({})'.format(
            ','.join(f'"{c}"' for c in insert_cols),
            ','.join(values_tpl)
        )


        for it in items:
            row = [it['name'], int(it['price']), int(it['qty']),
                   int(it['total']), date_for_db, time_for_db]
            if col_user:
                row.insert(0, session['username'])
            cur.execute(sql, tuple(row))
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({'status':'error','message':f'DB 寫入失敗：{e}'}), 500
    finally:
        conn.close()

    return jsonify({'status':'success','date':date_for_alert,'time':time_for_alert})


# === 啟動 ===
if __name__ == '__main__':
    app.run(debug=True)
