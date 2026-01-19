"""
Database migration script to add entry_price and exit_price columns to trades table
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'propsense.db')

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if columns exist
    cursor.execute("PRAGMA table_info(trades)")
    columns = [column[1] for column in cursor.fetchall()]
    
    print(f"[INFO] Current trades table columns: {columns}")
    
    # Add entry_price column if it doesn't exist
    if 'entry_price' not in columns:
        print("[INFO] Adding entry_price column...")
        cursor.execute("ALTER TABLE trades ADD COLUMN entry_price REAL")
        print("[OK] entry_price column added")
    else:
        print("[INFO] entry_price column already exists")
    
    # Add exit_price column if it doesn't exist
    if 'exit_price' not in columns:
        print("[INFO] Adding exit_price column...")
        cursor.execute("ALTER TABLE trades ADD COLUMN exit_price REAL")
        print("[OK] exit_price column added")
    else:
        print("[INFO] exit_price column already exists")
    
    # Update existing trades to copy price to entry_price and exit_price
    cursor.execute("UPDATE trades SET entry_price = price WHERE entry_price IS NULL")
    cursor.execute("UPDATE trades SET exit_price = price WHERE exit_price IS NULL")
    
    conn.commit()
    print("[OK] Database migration completed successfully!")
    
    # Verify columns were added
    cursor.execute("PRAGMA table_info(trades)")
    columns = [column[1] for column in cursor.fetchall()]
    print(f"[OK] Updated trades table columns: {columns}")
    
    conn.close()
    
except Exception as e:
    print(f"[ERROR] Migration failed: {e}")
    if conn:
        conn.rollback()
        conn.close()
