# -*- coding: utf-8 -*-
"""
Homework 1 (Final Version)
功能：
1️⃣ 自動補上驗證碼
2️⃣ 刪除假身分證（含第二碼規則）
3️⃣ 回填 country / gender / citizenship
4️⃣ 互動查詢：輸入身分證號 → 判斷真假並顯示含義
"""

import re
import sqlite3

# === 你的資料庫結構 ===
DB_PATH = "ID_data.db"     # 檔名
TABLE_NAME = "ID_table"    # 表名
COL_ID = "ID"              # ID 欄位
COL_COUNTRY = "country"
COL_GENDER = "gender"
COL_CITIZENSHIP = "citizenship"

# === 英文字母轉數值表 ===
LETTER_CODE = {
    'A':10,'B':11,'C':12,'D':13,'E':14,'F':15,'G':16,'H':17,'I':34,'J':18,
    'K':19,'L':20,'M':21,'N':22,'O':35,'P':23,'Q':24,'R':25,'S':26,'T':27,
    'U':28,'V':29,'W':32,'X':30,'Y':31,'Z':33
}

# === 縣市代碼表（首碼） ===
LETTER_TO_CITY = {
    'A':'臺北市','B':'臺中市','C':'基隆市','D':'臺南市','E':'高雄市','F':'新北市',
    'G':'宜蘭縣','H':'桃園市','I':'嘉義市','J':'新竹縣','K':'苗栗縣','L':'臺中市(原臺中縣)',
    'M':'南投縣','N':'彰化縣','O':'新竹市','P':'雲林縣','Q':'嘉義縣','R':'臺南市(原臺南縣)',
    'S':'高雄市(原高雄縣)','T':'屏東縣','U':'花蓮縣','V':'臺東縣','W':'金門縣','X':'澎湖縣',
    'Y':'陽明山(舊制)','Z':'連江縣'
}

# === 第二碼 → 性別 ===
SECOND_DIGIT_GENDER = {"1":"男性", "2":"女性", "8":"男性", "9":"女性"}

# === 第三碼 → 身份類別 ===
THIRD_DIGIT_RULE = {
    "0-5": "在臺灣出生之本籍國民",
    6: "入籍國民（原為外國人）",
    7: "入籍國民（原為無戶籍國民）",
    8: "入籍國民（原為香港居民或澳門居民）",
    9: "入籍國民（原為大陸地區居民）"
}

# ==============================
#       工具函式區
# ==============================
def normalize(s: str) -> str:
    return (s or "").strip().upper()

def compute_check_digit(pid9: str):
    """計算檢查碼"""
    pid9 = normalize(pid9)
    if not re.fullmatch(r"^[A-Z][0-9]{8,9}$", pid9): return None
    base = pid9[:9]
    lv = LETTER_CODE.get(base[0])
    if lv is None: return None
    n1, n2 = divmod(lv, 10)
    digits = [n1, n2] + [int(x) for x in base[1:]]
    weights = [1,9,8,7,6,5,4,3,2,1]
    total = sum(a*b for a,b in zip(digits, weights))
    return (10 - (total % 10)) % 10

def is_valid_id(pid: str) -> bool:
    """驗證真偽（含第二碼規則）"""
    pid = normalize(pid)
    if not re.fullmatch(r"^[A-Z][0-9]{9}$", pid):
        return False
    if pid[1] not in SECOND_DIGIT_GENDER:
        return False
    cd = compute_check_digit(pid[:9])
    return cd is not None and cd == int(pid[-1])

def third_digit_meaning(d: int) -> str:
    if 0 <= d <= 5: return THIRD_DIGIT_RULE["0-5"]
    return THIRD_DIGIT_RULE.get(d, "未定義")

# ==============================
#       主流程函式區
# ==============================
def fill_check_digits(conn):
    """補齊檢查碼"""
    cur = conn.cursor()
    rows = cur.execute(f"SELECT {COL_ID} FROM {TABLE_NAME}").fetchall()
    patched = 0
    for (pid,) in rows:
        pid = normalize(pid)
        if re.fullmatch(r"^[A-Z][0-9]{8}$", pid):
            cd = compute_check_digit(pid)
            if cd is not None:
                cur.execute(f"UPDATE {TABLE_NAME} SET {COL_ID}=? WHERE {COL_ID}=?", (pid+str(cd), pid))
                patched += 1
    conn.commit()
    return patched

def remove_invalid(conn):
    """刪除假身分證"""
    cur = conn.cursor()
    rows = cur.execute(f"SELECT {COL_ID} FROM {TABLE_NAME}").fetchall()
    removed = 0
    for (pid,) in rows:
        pid = normalize(pid)
        if not is_valid_id(pid):
            cur.execute(f"DELETE FROM {TABLE_NAME} WHERE {COL_ID}=?", (pid,))
            removed += 1
    conn.commit()
    return removed

def fill_meaning_fields(conn):
    """根據規則寫入 country / gender / citizenship"""
    cur = conn.cursor()
    rows = cur.execute(f"SELECT rowid, {COL_ID} FROM {TABLE_NAME}").fetchall()
    updated = 0
    for rid, pid in rows:
        pid = normalize(pid)
        if not is_valid_id(pid): continue
        country = LETTER_TO_CITY.get(pid[0], "未知地區")
        gender  = SECOND_DIGIT_GENDER.get(pid[1], "未知")
        citiz   = third_digit_meaning(int(pid[2]))
        cur.execute(
            f"UPDATE {TABLE_NAME} SET {COL_COUNTRY}=?, {COL_GENDER}=?, {COL_CITIZENSHIP}=? WHERE rowid=?",
            (country, gender, citiz, rid)
        )
        updated += 1
    conn.commit()
    return updated

# ==============================
#       互動查詢功能
# ==============================
def interactive_query():
    """使用者輸入身分證 → 判斷真/假，顯示含義"""
    print("\n=== 互動查詢模式 ===")
    print("輸入身分證字號（按 Enter 離開）：")
    while True:
        s = input("> ").strip().upper()
        if not s:
            print("結束查詢。")
            break

        if not re.fullmatch(r"^[A-Z][0-9]{9}$", s):
            print("假：格式錯誤（需1字母+9數字）")
            continue

        if s[1] not in SECOND_DIGIT_GENDER:
            print("假：第二碼僅允許 1/2/8/9")
            continue

        cd = compute_check_digit(s[:9])
        if cd != int(s[-1]):
            print("假：檢查碼錯誤")
            continue

        city = LETTER_TO_CITY.get(s[0], "未知地區")
        gender = SECOND_DIGIT_GENDER[s[1]]
        c3 = int(s[2])
        citizen = third_digit_meaning(c3)
        print(f"真：{s} {city} {gender} {citizen}")

# ==============================
#       主程式
# ==============================
def main():
    print("📘 Homework 1 - 身分證資料處理程式")
    conn = sqlite3.connect(DB_PATH)

    n1 = fill_check_digits(conn)
    print(f"🧩 已補齊驗證碼：{n1} 筆")

    n2 = remove_invalid(conn)
    print(f"🗑️ 已刪除假身分證：{n2} 筆")

    n3 = fill_meaning_fields(conn)
    print(f"📋 已更新三欄位 country / gender / citizenship：{n3} 筆")

    total = conn.execute(f"SELECT COUNT(*) FROM {TABLE_NAME}").fetchone()[0]
    print(f"📦 最終剩餘：{total} 筆有效資料")

    # 呼叫互動查詢功能
    interactive_query()

    conn.close()
    print("✅ 程式結束")

# ==============================
if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("⚠️ 發生錯誤：", e)
