"""Check active challenges in database"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'propsense.db')

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check all users
    print("\n=== USERS ===")
    cursor.execute("SELECT id, username, email, role FROM users")
    users = cursor.fetchall()
    for user in users:
        print(f"ID: {user[0]}, Username: {user[1]}, Email: {user[2]}, Role: {user[3]}")
    
    # Check all challenges
    print("\n=== CHALLENGES ===")
    cursor.execute("SELECT id, user_id, type, status, initial_balance, current_balance FROM challenges")
    challenges = cursor.fetchall()
    if challenges:
        for challenge in challenges:
            print(f"ID: {challenge[0]}, User ID: {challenge[1]}, Type: {challenge[2]}, Status: {challenge[3]}, Initial: {challenge[4]}, Current: {challenge[5]}")
    else:
        print("No challenges found!")
    
    # Check trades
    print("\n=== TRADES ===")
    cursor.execute("SELECT COUNT(*) FROM trades")
    trade_count = cursor.fetchone()[0]
    print(f"Total trades: {trade_count}")
    
    if trade_count > 0:
        cursor.execute("SELECT id, challenge_id, symbol, type, pnl, status FROM trades ORDER BY id DESC LIMIT 5")
        trades = cursor.fetchall()
        print("\nLast 5 trades:")
        for trade in trades:
            print(f"  Trade ID: {trade[0]}, Challenge: {trade[1]}, Symbol: {trade[2]}, Type: {trade[3]}, P&L: {trade[4]}, Status: {trade[5]}")
    
    conn.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
