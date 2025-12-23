"""add collections and categories

Revision ID: 20251222_collections
Revises: 31071ba7d1d9
Create Date: 2025-12-22 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20251222_collections'
down_revision = '20251118_add_question_images_fields'
branch_label = None
depends_on = None


def upgrade() -> None:
    # 创建 categories 表
    op.create_table(
        'categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, comment='分类名称'),
        sa.Column('description', sa.Text(), comment='分类描述'),
        sa.Column('icon', sa.String(50), comment='图标名称'),
        sa.Column('color', sa.String(20), comment='颜色标记'),
        sa.Column('category_type', sa.String(50), nullable=False, comment='分类类型: subject(科目), grade(年级), difficulty(难度), custom(自定义)'),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id'), comment='父级分类ID'),
        sa.Column('sort_order', sa.Integer(), default=0, comment='排序顺序'),
        sa.Column('is_active', sa.Boolean(), default=True, comment='是否启用'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, comment='所属用户ID'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), onupdate=sa.text('now()'), comment='更新时间'),
    )
    
    # 创建 collections 表
    op.create_table(
        'collections',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(200), nullable=False, comment='错题本标题'),
        sa.Column('description', sa.Text(), comment='错题本描述'),
        sa.Column('cover_image', sa.String(500), comment='封面图片URL'),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id'), comment='所属分类ID'),
        sa.Column('question_count', sa.Integer(), default=0, comment='题目数量'),
        sa.Column('total_practiced', sa.Integer(), default=0, comment='总练习次数'),
        sa.Column('is_public', sa.Boolean(), default=False, comment='是否公开'),
        sa.Column('is_favorite', sa.Boolean(), default=False, comment='是否收藏'),
        sa.Column('is_active', sa.Boolean(), default=True, comment='是否启用'),
        sa.Column('sort_order', sa.Integer(), default=0, comment='排序顺序'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, comment='所属用户ID'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), onupdate=sa.text('now()'), comment='更新时间'),
        sa.Column('last_practiced_at', sa.DateTime(), comment='最后练习时间'),
    )
    
    # 创建 question_collection 关联表
    op.create_table(
        'question_collection',
        sa.Column('question_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('questions.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('collection_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('collections.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('added_at', sa.DateTime(), server_default=sa.text('now()'), comment='添加时间'),
        sa.Column('notes', sa.Text(), comment='用户对该题目的笔记'),
        sa.Column('mastery_level', sa.Integer(), default=0, comment='掌握程度 0-5'),
        sa.Column('times_practiced', sa.Integer(), default=0, comment='练习次数'),
        sa.Column('last_practiced_at', sa.DateTime(), comment='最后练习时间'),
    )
    
    # 创建索引
    op.create_index('idx_categories_user_id', 'categories', ['user_id'])
    op.create_index('idx_categories_type', 'categories', ['category_type'])
    op.create_index('idx_collections_user_id', 'collections', ['user_id'])
    op.create_index('idx_collections_category_id', 'collections', ['category_id'])
    op.create_index('idx_question_collection_question_id', 'question_collection', ['question_id'])
    op.create_index('idx_question_collection_collection_id', 'question_collection', ['collection_id'])


def downgrade() -> None:
    # 删除索引
    op.drop_index('idx_question_collection_collection_id')
    op.drop_index('idx_question_collection_question_id')
    op.drop_index('idx_collections_category_id')
    op.drop_index('idx_collections_user_id')
    op.drop_index('idx_categories_type')
    op.drop_index('idx_categories_user_id')
    
    # 删除表
    op.drop_table('question_collection')
    op.drop_table('collections')
    op.drop_table('categories')

