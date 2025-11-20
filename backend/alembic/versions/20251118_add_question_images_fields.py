"""Add question_images and has_images to questions

Revision ID: 20251118_add_question_images_fields
Revises: 31071ba7d1d9
Create Date: 2025-11-18 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20251118_add_question_images_fields"
down_revision = "31071ba7d1d9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 新增字段
    op.add_column(
        "questions",
        sa.Column("question_images", sa.JSON(), nullable=True, comment="题目相关的图片/附件信息"),
    )
    op.add_column(
        "questions",
        sa.Column(
            "has_images",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
            comment="是否包含图片/附件",
        ),
    )
    # 回填旧数据
    op.execute("UPDATE questions SET has_images = false WHERE has_images IS NULL")


def downgrade() -> None:
    op.drop_column("questions", "has_images")
    op.drop_column("questions", "question_images")
