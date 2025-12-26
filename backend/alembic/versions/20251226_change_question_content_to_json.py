"""Change question content from Text to JSON

Revision ID: 20251226_change_question_content_to_json
Revises: 20251222_add_collections_and_categories
Create Date: 2025-12-26

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251226_change_question_content_to_json'
down_revision = '20251222_add_collections_and_categories'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Using PostgreSQL JSONB in production; SQLite will treat this as a TEXT-like affinity.
    # Existing content is a string, migrate it to a JSON object: {"text": <old>}
    op.alter_column('questions', 'content', existing_type=sa.Text(), type_=sa.JSON(), existing_nullable=False)

    # Wrap existing string content into JSON object
    # NOTE: This is dialect-dependent; for SQLite the JSON column is stored as text.
    bind = op.get_bind()

    dialect = bind.dialect.name
    if dialect == 'postgresql':
        bind.execute(sa.text("UPDATE questions SET content = jsonb_build_object('text', content::text)"))
    else:
        # SQLite / others: store JSON string
        bind.execute(sa.text("UPDATE questions SET content = json_object('text', content)"))


def downgrade() -> None:
    # Attempt to extract back to text
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == 'postgresql':
        bind.execute(sa.text("UPDATE questions SET content = content->>'text'"))
    else:
        bind.execute(sa.text("UPDATE questions SET content = json_extract(content, '$.text')"))

    op.alter_column('questions', 'content', existing_type=sa.JSON(), type_=sa.Text(), existing_nullable=False)
