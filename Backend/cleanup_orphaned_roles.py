#!/usr/bin/env python3
"""
Database cleanup script: removes orphaned user_roles entries (those with no matching role).
This fixes the Pydantic validation error: "roles.0.role: Input should be a valid dictionary or object..."
"""

import os
import sys
from sqlalchemy import create_engine, text

def cleanup_orphaned_roles():
    """Find and remove orphaned user_roles rows."""
    
    # Get database URL from environment (set by docker-compose)
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("❌ DATABASE_URL environment variable not set")
        sys.exit(1)
    
    try:
        engine = create_engine(db_url)
        
        with engine.connect() as conn:
            print("🔍 Checking for orphaned user_roles...")
            
            # Find orphaned rows (role_id IS NULL or role_id not in roles.id)
            check_query = text("""
                SELECT id, user_id, role_id FROM user_roles 
                WHERE role_id IS NULL OR role_id NOT IN (SELECT id FROM roles)
            """)
            
            result = conn.execute(check_query)
            orphaned = result.fetchall()
            
            if not orphaned:
                print("✅ No orphaned user_roles found!")
                conn.commit()
                return True
            
            print(f"⚠️  Found {len(orphaned)} orphaned user_roles:")
            for row in orphaned:
                print(f"   - ID: {row[0]}, user_id: {row[1]}, role_id: {row[2]}")
            
            # Delete orphaned rows
            print("\n🗑️  Deleting orphaned rows...")
            
            delete_query = text("""
                DELETE FROM user_roles 
                WHERE role_id IS NULL OR role_id NOT IN (SELECT id FROM roles)
            """)
            
            result = conn.execute(delete_query)
            conn.commit()
            
            print(f"✅ Deleted {result.rowcount} orphaned user_roles rows")
            return True
            
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    cleanup_orphaned_roles()
    print("\n🎉 Database cleanup complete!")
