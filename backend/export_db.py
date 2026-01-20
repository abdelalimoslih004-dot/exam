"""
Export database to SQL file
"""
import sqlite3

def export_database():
    conn = sqlite3.connect('propsense.db')
    
    with open('database.sql', 'w', encoding='utf-8') as f:
        # Header
        f.write('-- PropSense Trading Platform Database Export\n')
        f.write('-- Generated for Exam Submission\n')
        f.write('-- Date: 2026-01-20\n\n')
        
        # Dump all
        for line in conn.iterdump():
            f.write(f'{line}\n')
    
    conn.close()
    print("✅ Database exported to database.sql")

if __name__ == '__main__':
    export_database()
