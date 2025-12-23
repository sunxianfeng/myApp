from sqlalchemy import Column, String, DateTime, Boolean, Text, Integer, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base


# 关联表：题目和错题本的多对多关系
question_collection = Table(
    'question_collection',
    Base.metadata,
    Column('question_id', UUID(as_uuid=True), ForeignKey('questions.id', ondelete='CASCADE'), primary_key=True),
    Column('collection_id', UUID(as_uuid=True), ForeignKey('collections.id', ondelete='CASCADE'), primary_key=True),
    Column('added_at', DateTime, default=datetime.utcnow, comment="添加时间"),
    Column('notes', Text, comment="用户对该题目的笔记"),
    Column('mastery_level', Integer, default=0, comment="掌握程度 0-5"),
    Column('times_practiced', Integer, default=0, comment="练习次数"),
    Column('last_practiced_at', DateTime, comment="最后练习时间"),
)


class Category(Base):
    """分类目录模型"""
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # 分类信息
    name = Column(String(100), nullable=False, comment="分类名称")
    description = Column(Text, comment="分类描述")
    icon = Column(String(50), comment="图标名称")
    color = Column(String(20), comment="颜色标记")
    
    # 分类类型
    category_type = Column(String(50), nullable=False, comment="分类类型: subject(科目), grade(年级), difficulty(难度), custom(自定义)")
    
    # 父级分类（支持层级结构）
    parent_id = Column(UUID(as_uuid=True), ForeignKey('categories.id'), comment="父级分类ID")
    
    # 排序和状态
    sort_order = Column(Integer, default=0, comment="排序顺序")
    is_active = Column(Boolean, default=True, comment="是否启用")
    
    # 用户关联
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, comment="所属用户ID")
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    # 关系
    user = relationship("User", back_populates="categories")
    collections = relationship("Collection", back_populates="category", cascade="all, delete-orphan")
    parent = relationship("Category", remote_side=[id], backref="children")
    
    def __repr__(self):
        return f"<Category(id={self.id}, name={self.name}, type={self.category_type})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'color': self.color,
            'category_type': self.category_type,
            'parent_id': str(self.parent_id) if self.parent_id else None,
            'sort_order': self.sort_order,
            'is_active': self.is_active,
            'user_id': str(self.user_id),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Collection(Base):
    """错题本模型"""
    __tablename__ = "collections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # 错题本基本信息
    title = Column(String(200), nullable=False, comment="错题本标题")
    description = Column(Text, comment="错题本描述")
    cover_image = Column(String(500), comment="封面图片URL")
    
    # 分类
    category_id = Column(UUID(as_uuid=True), ForeignKey('categories.id'), comment="所属分类ID")
    
    # 统计信息
    question_count = Column(Integer, default=0, comment="题目数量")
    total_practiced = Column(Integer, default=0, comment="总练习次数")
    
    # 状态和设置
    is_public = Column(Boolean, default=False, comment="是否公开")
    is_favorite = Column(Boolean, default=False, comment="是否收藏")
    is_active = Column(Boolean, default=True, comment="是否启用")
    
    # 排序
    sort_order = Column(Integer, default=0, comment="排序顺序")
    
    # 用户关联
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, comment="所属用户ID")
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    last_practiced_at = Column(DateTime, comment="最后练习时间")
    
    # 关系
    user = relationship("User", back_populates="collections")
    category = relationship("Category", back_populates="collections")
    questions = relationship(
        "Question",
        secondary=question_collection,
        backref="collections"
    )
    
    def __repr__(self):
        return f"<Collection(id={self.id}, title={self.title}, questions={self.question_count})>"
    
    def to_dict(self, include_questions=False):
        """转换为字典格式"""
        result = {
            'id': str(self.id),
            'title': self.title,
            'description': self.description,
            'cover_image': self.cover_image,
            'category_id': str(self.category_id) if self.category_id else None,
            'question_count': self.question_count,
            'total_practiced': self.total_practiced,
            'is_public': self.is_public,
            'is_favorite': self.is_favorite,
            'is_active': self.is_active,
            'sort_order': self.sort_order,
            'user_id': str(self.user_id),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_practiced_at': self.last_practiced_at.isoformat() if self.last_practiced_at else None,
        }
        
        if include_questions:
            result['questions'] = [q.to_dict() for q in self.questions]
        
        return result


# 为User模型添加反向关系
from app.models.user import User

User.categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
User.collections = relationship("Collection", back_populates="user", cascade="all, delete-orphan")

