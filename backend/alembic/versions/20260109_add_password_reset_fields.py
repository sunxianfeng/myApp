"""add password reset fields

Revision ID: 20260109_add_reset
Revises: 20260109_add_user_notes
Create Date: 2026-01-09

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260109_add_reset'
down_revision = '20260109_add_user_notes'
branch_labels = None
depends_on = None


def upgrade():
    # Add reset_token and reset_token_expires columns to users table
    op.add_column('users', sa.Column('reset_token', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('reset_token_expires', sa.DateTime(), nullable=True))


def downgrade():
    # Remove the columns
    op.drop_column('users', 'reset_token_expires')
    op.drop_column('users', 'reset_token')
