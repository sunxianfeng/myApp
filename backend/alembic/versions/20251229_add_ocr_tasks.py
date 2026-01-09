"""Add OCR tasks table

Revision ID: 20251229_add_ocr_tasks
Revises: 20251226_change_question_content_to_json
Create Date: 2025-12-29

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20251229_add_ocr_tasks'
down_revision = '20251226_change_question_content_to_json'
branch_labels = None
depends_on = None


def upgrade():
    # This migration was created as a placeholder
    # Add any OCR task table or field migrations here if needed
    pass


def downgrade():
    # Corresponding downgrade logic
    pass
