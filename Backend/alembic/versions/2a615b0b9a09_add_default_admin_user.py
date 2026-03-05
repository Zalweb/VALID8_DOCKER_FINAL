"""add_default_admin_user

Revision ID: 2a615b0b9a09
Revises: ba7bc10b7baf
Create Date: 2025-05-25 06:35:11.791965

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2a615b0b9a09'
down_revision: Union[str, None] = 'ba7bc10b7baf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# In your migration file (xxxx_add_default_admin_user.py)
def upgrade():
    # Skip if admin already exists
    op.execute("""
        INSERT INTO users (email, password_hash, first_name, last_name, is_active, created_at)
        SELECT 
            'admin@yourdomain.com',
            '$2b$12$Xu7JQ7HIZL99J.9X7JQ7HOz8J8ZJ8ZJ8ZJ8ZJ8ZJ8ZJ8ZJ8ZJ8ZJ8',
            'System',
            'Admin',
            true,
            NOW()
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@yourdomain.com')
    """)
    
    # Skip if role already assigned
    op.execute("""
        INSERT INTO user_roles (user_id, role_id)
        SELECT 
            (SELECT id FROM users WHERE email = 'admin@yourdomain.com'),
            (SELECT id FROM roles WHERE name = 'admin')
        WHERE NOT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = (SELECT id FROM users WHERE email = 'admin@yourdomain.com')
        )
    """)

def downgrade():
    op.execute("DELETE FROM user_roles WHERE user_id = (SELECT id FROM users WHERE email = 'admin@yourdomain.com')")
    op.execute("DELETE FROM users WHERE email = 'admin@yourdomain.com'")