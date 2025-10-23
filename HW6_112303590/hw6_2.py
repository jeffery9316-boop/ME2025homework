# -*- coding: utf-8 -*-
"""
Homework 2 (Final Version)
功能：
(a) sign up 註冊
(b) sign in 登入
符合講義全部規則。
"""

import re
import sqlite3
import os
from datetime import datetime

# ================================
# 資料庫設定
# ================================
DB_CANDIDATES = ["users.db", "user.db"]

def detect_db_path() -> str:
    for p in DB_CANDIDATES:
        if os.path.exists(p):
            return p
    return DB_CANDIDATES[0]

DB_PATH = detect_db_path()

def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    return conn

# ================================
# Email / Password 驗證規則
# ================================
EMAIL_PATTERN = re.compile(r"^[A-Za-z0-9._%+-]+@gmail\.com$")

SPECIAL_CHARS = "!@#$%^&*()_+-=[]{}|;:',.<>?/`~"

def is_sequential(s: str) -> bool:
    """檢查是否連號（abc、123等）"""
    s = s.lower()
    for i in range(len(s)-2):
        if s[i].isalpha() and ord(s[i+1]) == ord(s[i])+1 and ord(s[i+2]) == ord(s[i])+2:
            return True
        if s[i].isdigit() and s[i+1].isdigit() and s[i+2].isdigit():
            if int(s[i+1]) == int(s[i])+1 and int(s[i+2]) == int(s[i+1])+1:
                return True
    return False

def check_password(pw: str):
    """回傳違規訊息列表"""
    errors = []
    if len(pw) < 8:
        errors.append("密碼必須超過8個字元")
    if not re.search(r"[A-Z]", pw) or not re.search(r"[a-z]", pw):
        errors.append("密碼必須包含英文大小寫")
    if not any(ch in SPECIAL_CHARS for ch in pw):
        errors.append("密碼必須包含特殊字元")
    if is_sequential(pw):
        errors.append("密碼不可為連號（abc、123…）")
    return errors

# ================================
# 共用輸入函式
# ================================
def input_nonempty(prompt):
    while True:
        s = input(prompt).strip()
        if s:
            return s
        print("不得為空，請重新輸入。")

def input_email():
    while True:
        email = input("Email（需為 XXX@gmail.com）：").strip()
        if EMAIL_PATTERN.fullmatch(email):
            return email
        print("Email 格式不符，請重新輸入。")

def input_password():
    while True:
        pw = input("Password：").strip()
        errors = check_password(pw)
        if not errors:
            return pw
        print("密碼不符合規則：")
        for e in errors:
            print(" -", e)
        print("請重新輸入。")

# ================================
# Sign Up / Sign In 流程
# ================================
def sign_up(conn):
    print("\n=== Sign Up 註冊 ===")
    name = input_nonempty("Name：")
    email = input_email()
    password = input_password()

    print(f"\n顯示註冊資訊：save {name} | {email} | {password} | Y / N ?")
    if input("> ").strip().lower() != "y":
        print("返回主畫面。")
        return

    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    existing = cur.fetchone()

    if existing:
        ans = input("此 Email 已存在，是否更新此 Email 資訊？(Y/N) ").strip().lower()
        if ans == "y":
            cur.execute(
                "UPDATE users SET name=?, password=?, updated_at=? WHERE email=?",
                (name, password, datetime.now().isoformat(timespec='seconds'), email)
            )
            conn.commit()
            print("✅ 已更新資料。")
        else:
            print("未更新，返回主畫面。")
    else:
        cur.execute(
            "INSERT INTO users(name, email, password, created_at, updated_at) VALUES (?,?,?,?,?)",
            (name, email, password, datetime.now().isoformat(timespec='seconds'),
             datetime.now().isoformat(timespec='seconds'))
        )
        conn.commit()
        print("✅ 已新增一筆資料。")

def sign_in(conn):
    print("\n=== Sign In 登入 ===")
    name = input_nonempty("Name：")
    email = input_email()

    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE name=? AND email=?", (name, email))
    user = cur.fetchone()

    if not user:
        print("名字或 Email 錯誤。請重新選擇 (a) sign up / (b) sign in")
        return

    while True:
        pw = input("Password：").strip()
        if pw == user["password"]:
            print("✅ 登入成功！")
            break
        else:
            ans = input("密碼錯誤，忘記密碼 Y / N ? ").strip().lower()
            if ans == "y":
                print("導向註冊模式以更新密碼。")
                sign_up(conn)
                break
            else:
                print("請重新輸入密碼。")

# ================================
# 主程式
# ================================
def main():
    print("📘 Homework 2 - Sign Up / Sign In")
    print(f"使用資料庫：{DB_PATH}")
    conn = connect_db()

    while True:
        print("\n=== 模式選擇 ===")
        print("(a) sign up")
        print("(b) sign in")
        mode = input("> ").strip().lower()

        if mode == "a":
            sign_up(conn)
        elif mode == "b":
            sign_in(conn)
        else:
            print("❌ 無效輸入，請輸入 a 或 b。")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("⚠️ 錯誤：", e)
