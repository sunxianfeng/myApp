"""add user_notes to questions

Revision ID: 20260109_add_user_notes
Revises: 20251229_add_ocr_tasks
Create Date: 2026-01-09

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260109_add_user_notes'
down_revision = '20251229_add_ocr_tasks'
branch_labels = None
depends_on = None


def upgrade():
    # Add user_notes column to questions table
    op.add_column('questions', sa.Column('user_notes', sa.Text(), nullable=True, comment='用户笔记'))


def downgrade():
    # Remove user_notes column from questions table
    op.drop_column('questions', 'user_notes')
