from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import sqlite3, os

app = Flask(__name__)
app.secret_key = "5k4g4"
DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")
print(">>> Using DB:", DB_PATH)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route("/")
def home():
    return redirect(url_for("login_page"))

# ---------- Login pages ----------
@app.route("/login")
def login_page():
    return render_template("112303590_login.html")

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM teachers WHERE username = ?", (username,))
    user = cur.fetchone()
    conn.close()

    if user is None:
        return jsonify({"ok": False, "msg": "錯誤的名稱"}), 401
    if password != user["password"]:
        return jsonify({"ok": False, "msg": "錯誤的密碼"}), 401

    session["teacher"] = username
    return jsonify({"ok": True})

@app.route("/grades")
def grades_page():
    if "teacher" not in session:
        return redirect(url_for("login_page"))
    return render_template("112303590_grades.html", teacher=session["teacher"])

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login_page"))

@app.route("/whoami")
def whoami():
    return {"teacher": session.get("teacher")}

# ---------- Auto-detect grades table & columns ----------
def _list_tables(conn):
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    return [r[0] for r in cur.fetchall()]

def _columns_of(conn, table):
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info({table});")
    return {row[1].lower(): row[1] for row in cur.fetchall()}  # lower -> original

def _find_grades_table_and_columns(conn):
    """
    Return (table_name, mapping) with keys:
      mapping = {'name', 'id', 'score', 'creator'(optional)}
    """
    candidates = {
        "name":   ["student_name", "name", "student", "stu_name"],
        "id":     ["student_id", "sid", "id", "studentid", "stu_id", "學號"],
        "score":  ["score", "grade", "grades", "mark", "point", "成績"],
        "creator":["created_by", "teacher", "creator", "createdby"]
    }

    def pick(cols_map, key):
        for c in candidates[key]:
            if c.lower() in cols_map:
                return cols_map[c.lower()]
        return None

    for t in _list_tables(conn):
        cols = _columns_of(conn, t)
        m = {
            "name":   pick(cols, "name"),
            "id":     pick(cols, "id"),
            "score":  pick(cols, "score"),
            "creator":pick(cols, "creator"),
        }
        if m["name"] and m["id"] and m["score"]:
            return t, m

    raise RuntimeError("找不到同時具有『姓名/學號/成績』三種欄位的資料表。請確認 users.db。")

# ---------- Grades API (AJAX) ----------
@app.route("/api/grades", methods=["GET", "POST", "DELETE"])
def api_grades():
    if "teacher" not in session:
        return jsonify({"error": "unauthorized"}), 401

    conn = get_db()
    cur  = conn.cursor()

    try:
        table, m = _find_grades_table_and_columns(conn)
    except RuntimeError as e:
        conn.close()
        return jsonify({"ok": False, "msg": str(e)}), 500

    if request.method == "GET":
        # 排序修正：TRIM 學號後，能轉數字的先以整數排序，再以字串排序
        select_creator = f"COALESCE({m['creator']}, '') AS created_by" if m["creator"] else "'' AS created_by"
        cur.execute(f"""
            SELECT
              {m['name']}  AS student_name,
              {m['id']}    AS student_id,
              {m['score']} AS score,
              {select_creator}
            FROM {table}
            ORDER BY
              CASE
                WHEN TRIM({m['id']}) GLOB '[0-9]*' AND TRIM({m['id']}) <> ''
                  THEN CAST(TRIM({m['id']}) AS INTEGER)
                ELSE NULL
              END ASC,
              TRIM({m['id']}) ASC;
        """)
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify(rows)

    if request.method == "POST":
        data = request.get_json(force=True, silent=True) or {}
        name = (data.get("student_name") or "").strip()
        sid  = (data.get("student_id") or "").strip()   # 先 TRIM
        score = data.get("score")

        if not name or not sid or score is None:
            conn.close()
            return jsonify({"ok": False, "msg": "請完整輸入：姓名、學號、成績"}), 400
        try:
            score_val = float(score)
        except (TypeError, ValueError):
            conn.close()
            return jsonify({"ok": False, "msg": "成績需為數字"}), 400

        if m["creator"]:
            cur.execute(
                f"INSERT OR REPLACE INTO {table}({m['id']}, {m['name']}, {m['score']}, {m['creator']}) VALUES(?, ?, ?, ?)",
                (sid, name, score_val, session["teacher"])
            )
        else:
            cur.execute(
                f"INSERT OR REPLACE INTO {table}({m['id']}, {m['name']}, {m['score']}) VALUES(?, ?, ?)",
                (sid, name, score_val)
            )
        conn.commit()
        conn.close()
        return jsonify({"ok": True})

    if request.method == "DELETE":
        data = request.get_json(force=True, silent=True) or {}
        sid = (data.get("student_id") or "").strip()
        if not sid:
            conn.close()
            return jsonify({"ok": False, "msg": "請提供學號"}), 400
        cur.execute(f"DELETE FROM {table} WHERE {m['id']} = ?", (sid,))
        deleted = cur.rowcount
        conn.commit()
        conn.close()
        return jsonify({"ok": True, "deleted": deleted})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
