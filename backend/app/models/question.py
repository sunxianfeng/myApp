from sqlalchemy import Column, String, DateTime, Boolean, Text, Integer, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base


class Question(Base):
    """题目模型 - 存储OCR识别的题目"""
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # 题目基本信息
    number = Column(Integer, nullable=False, comment="题目编号")
    content = Column(Text, nullable=False, comment="题目主要内容")
    full_content = Column(Text, comment="题目完整内容(包括多行文本)")
    
    # 题目类型和分类
    question_type = Column(String(50), nullable=False, default='other', comment="题目类型:multiple_choice, fill_blank, true_false, essay, other")
    difficulty_level = Column(String(20), default='medium', comment="难度级别:easy, medium, hard")
    subject = Column(String(100), comment="学科分类:数学、语文、英语等")
    topic_tags = Column(JSON, comment="知识点标签,存储为JSON数组")
    
<<<<<<< Updated upstream
    # 选择题选项与图片（JSON格式存储）
    options = Column(JSON, comment="选择题选项, JSON格式: [{label: 'A', content: '选项内容'}]")
    question_images = Column(JSON, comment="题目相关的图片/附件信息")
=======
    # 选择题选项(JSON格式存储)
    options = Column(JSON, comment="选择题选项,JSON格式:[{label: 'A', content: '选项内容'}]")
>>>>>>> Stashed changes
    correct_answer = Column(Text, comment="正确答案")
    
    # 解析和答案
    explanation = Column(Text, comment="题目解析")
    answer_key = Column(Text, comment="答案详解")
    
    # 来源信息
    source_image_path = Column(String(500), comment="来源图片路径")
    source_image_url = Column(String(500), comment="来源图片URL(如果存储在云存储)")
    source_document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id'), comment="来源文档ID")
    ocr_confidence = Column(String(10), comment="OCR识别置信度")
    
<<<<<<< Updated upstream
    has_images = Column(Boolean, default=False, comment="是否包含图片/附件")
=======
    # 图片相关字段(TODO: 后续实现)
    # TODO: 实现图片存储和管理功能
    # question_images = Column(JSON, comment="题目中的图片信息,JSON格式存储图片URL和描述")
    # has_images = Column(Boolean, default=False, comment="是否包含图片")
    
>>>>>>> Stashed changes
    # 状态和元数据
    is_verified = Column(Boolean, default=False, comment="是否已人工验证")
    is_active = Column(Boolean, default=True, comment="是否启用")
    processing_status = Column(String(20), default='pending', comment="处理状态:pending, processing, completed, failed")
    
    # 用户关联
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, comment="创建用户ID")
    verified_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), comment="验证用户ID")
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    verified_at = Column(DateTime, comment="验证时间")
    
    # 关系
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_questions")
    verifier = relationship("User", foreign_keys=[verified_by], back_populates="verified_questions")
    source_document = relationship("Document", back_populates="questions")
    
    def __repr__(self):
        return f"<Question(id={self.id}, number={self.number}, type={self.question_type})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': str(self.id),
            'number': self.number,
            'content': self.content,
            'full_content': self.full_content,
            'question_type': self.question_type,
            'difficulty_level': self.difficulty_level,
            'subject': self.subject,
            'topic_tags': self.topic_tags,
            'options': self.options,
            'question_images': self.question_images,
            'has_images': self.has_images,
            'correct_answer': self.correct_answer,
            'explanation': self.explanation,
            'answer_key': self.answer_key,
            'source_image_path': self.source_image_path,
            'source_image_url': self.source_image_url,
            'source_document_id': str(self.source_document_id) if self.source_document_id else None,
            'ocr_confidence': self.ocr_confidence,
            # TODO: 添加图片相关字段
            # 'question_images': self.question_images,
            # 'has_images': self.has_images,
            'is_verified': self.is_verified,
            'is_active': self.is_active,
            'processing_status': self.processing_status,
            'created_by': str(self.created_by),
            'verified_by': str(self.verified_by) if self.verified_by else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
        }


class Document(Base):
    """文档模型 - 存储上传的文档信息"""
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # 文档基本信息
    title = Column(String(200), nullable=False, comment="文档标题")
    filename = Column(String(200), nullable=False, comment="原始文件名")
    file_path = Column(String(500), comment="文件存储路径")
    file_url = Column(String(500), comment="文件访问URL")
    file_size = Column(Integer, comment="文件大小(字节)")
    file_type = Column(String(50), comment="文件类型:pdf, docx, image等")
    
    # 处理状态
    processing_status = Column(String(20), default='pending', comment="处理状态:pending, processing, completed, failed")
    total_questions = Column(Integer, default=0, comment="提取的题目总数")
    processed_questions = Column(Integer, default=0, comment="已处理的题目数")
    
    # OCR相关
    ocr_confidence_avg = Column(String(10), comment="平均OCR置信度")
    extraction_errors = Column(JSON, comment="提取错误信息")
    
    # 用户关联
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, comment="上传用户ID")
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    processed_at = Column(DateTime, comment="处理完成时间")
    
    # 关系
    uploader = relationship("User", back_populates="uploaded_documents")
    questions = relationship("Question", back_populates="source_document", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Document(id={self.id}, title={self.title}, status={self.processing_status})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': str(self.id),
            'title': self.title,
            'filename': self.filename,
            'file_path': self.file_path,
            'file_url': self.file_url,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'processing_status': self.processing_status,
            'total_questions': self.total_questions,
            'processed_questions': self.processed_questions,
            'ocr_confidence_avg': self.ocr_confidence_avg,
            'extraction_errors': self.extraction_errors,
            'uploaded_by': str(self.uploaded_by),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
        }


# 为User模型添加反向关系
from app.models.user import User

# 扩展User模型的关系
User.created_questions = relationship("Question", foreign_keys=[Question.created_by], back_populates="creator")
User.verified_questions = relationship("Question", foreign_keys=[Question.verified_by], back_populates="verifier")
User.uploaded_documents = relationship("Document", back_populates="uploader")
