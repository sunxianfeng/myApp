"""
题目服务模块 - 处理题目的数据库操作
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import logging
from datetime import datetime
import uuid

from app.models.question import Question, Document
from app.database import get_db

logger = logging.getLogger(__name__)

class QuestionService:
    """题目数据库服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_document(self, title: str, filename: str, file_path: str = None, 
                     file_url: str = None, file_size: int = None, 
                     file_type: str = None, uploaded_by: str = None) -> Document:
        """
        创建文档记录
        
        Args:
            title: 文档标题
            filename: 原始文件名
            file_path: 文件存储路径
            file_url: 文件访问URL
            file_size: 文件大小
            file_type: 文件类型
            uploaded_by: 上传用户ID
            
        Returns:
            创建的文档对象
        """
        try:
            # uploaded_by 在模型中是 UUID(as_uuid=True)。
            # 这里允许上层传入 str/UUID，并在服务层统一转换，避免 SQLite/Postgres 方言
            # 在 bind 时对 str 调用 .hex 导致: 'str' object has no attribute 'hex'
            uploaded_by_uuid = None
            if uploaded_by:
                uploaded_by_uuid = uploaded_by if isinstance(uploaded_by, uuid.UUID) else uuid.UUID(str(uploaded_by))

            document = Document(
                title=title,
                filename=filename,
                file_path=file_path,
                file_url=file_url,
                file_size=file_size,
                file_type=file_type,
                uploaded_by=uploaded_by_uuid,
                processing_status='pending'
            )
            
            self.db.add(document)
            self.db.commit()
            self.db.refresh(document)
            
            logger.info(f"Created document: {document.id}")
            return document
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create document: {e}")
            raise
    
    def update_document_status(self, document_id: str, status: str, 
                           total_questions: int = None, processed_questions: int = None,
                           ocr_confidence_avg: str = None, 
                           extraction_errors: List[Dict] = None) -> Optional[Document]:
        """
        更新文档处理状态
        
        Args:
            document_id: 文档ID
            status: 处理状态
            total_questions: 题目总数
            processed_questions: 已处理题目数
            ocr_confidence_avg: 平均OCR置信度
            extraction_errors: 提取错误信息
            
        Returns:
            更新后的文档对象
        """
        try:
            document = self.db.query(Document).filter(Document.id == document_id).first()
            if not document:
                logger.warning(f"Document not found: {document_id}")
                return None
            
            document.processing_status = status
            if total_questions is not None:
                document.total_questions = total_questions
            if processed_questions is not None:
                document.processed_questions = processed_questions
            if ocr_confidence_avg is not None:
                document.ocr_confidence_avg = ocr_confidence_avg
            if extraction_errors is not None:
                document.extraction_errors = extraction_errors
            
            if status == 'completed':
                document.processed_at = datetime.utcnow()
            
            document.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(document)
            
            logger.info(f"Updated document status: {document_id} -> {status}")
            return document
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update document status: {e}")
            raise
    
    def create_questions_from_ocr(self, ocr_questions: List[Dict], document_id: str, 
                               created_by: str) -> List[Question]:
        """
        从OCR结果创建题目记录

        Args:
            ocr_questions: OCR识别的题目列表
            document_id: 文档ID
            created_by: 创建用户ID

        Returns:
            创建的题目列表
        """
        try:
            created_questions = []

            created_by_uuid = created_by if isinstance(created_by, uuid.UUID) else uuid.UUID(str(created_by))
            document_id_uuid = None
            if document_id:
                document_id_uuid = document_id if isinstance(document_id, uuid.UUID) else uuid.UUID(str(document_id))

            for ocr_q in ocr_questions:
                options = ocr_q.get('options') or []
                images = ocr_q.get('images') or {}
                source_image_url = images.get('input') if isinstance(images, dict) else None
                has_images = bool(images)

                question = Question(
                    number=ocr_q.get('number', 0),
                    content=ocr_q.get('content', ''),
                    full_content=ocr_q.get('full_content') or ocr_q.get('content', ''),
                    question_type=ocr_q.get('type', 'essay'),
                    options=options,
                    source_image_path=ocr_q.get('source_image', ''),
                    source_image_url=source_image_url,
                    question_images=images,
                    has_images=has_images,
                    source_document_id=document_id_uuid,
                    ocr_confidence=str(ocr_q.get('confidence', 0)),
                    processing_status='completed',
                    created_by=created_by_uuid,
                    # TODO: 图片相关字段待实现
                    # question_images=ocr_q.get('images', []),
                    # has_images=bool(ocr_q.get('images', []))
                )

                self.db.add(question)
                created_questions.append(question)

            self.db.commit()

            # 刷新所有题目以获取ID
            for question in created_questions:
                self.db.refresh(question)

            logger.info(f"Created {len(created_questions)} questions for document {document_id}")
            return created_questions

        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create questions from OCR: {e}")
            raise
    
    def get_questions_by_document(self, document_id: str, skip: int = 0, 
                              limit: int = 50, question_type: str = None) -> List[Question]:
        """
        根据文档ID获取题目列表
        
        Args:
            document_id: 文档ID
            skip: 跳过的记录数
            limit: 返回记录数限制
            question_type: 题目类型过滤
            
        Returns:
            题目列表
        """
        try:
            query = self.db.query(Question).filter(Question.source_document_id == document_id)
            
            if question_type:
                query = query.filter(Question.question_type == question_type)
            
            questions = query.offset(skip).limit(limit).all()
            return questions
            
        except Exception as e:
            logger.error(f"Failed to get questions by document: {e}")
            raise
    
    def get_question_by_id(self, question_id: str) -> Optional[Question]:
        """
        根据ID获取题目
        
        Args:
            question_id: 题目ID
            
        Returns:
            题目对象
        """
        try:
            question = self.db.query(Question).filter(Question.id == question_id).first()
            return question
            
        except Exception as e:
            logger.error(f"Failed to get question by ID: {e}")
            raise
    
    def update_question(self, question_id: str, update_data: Dict[str, Any]) -> Optional[Question]:
        """
        更新题目信息
        
        Args:
            question_id: 题目ID
            update_data: 更新数据
            
        Returns:
            更新后的题目对象
        """
        try:
            question = self.db.query(Question).filter(Question.id == question_id).first()
            if not question:
                logger.warning(f"Question not found: {question_id}")
                return None
            
            # 更新允许的字段
            allowed_fields = [
                'content', 'full_content', 'question_type', 'difficulty_level',
                'subject', 'topic_tags', 'options', 'correct_answer',
                'explanation', 'answer_key', 'is_verified', 'is_active'
            ]
            
            for field, value in update_data.items():
                if field in allowed_fields and hasattr(question, field):
                    setattr(question, field, value)
            
            question.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(question)
            
            logger.info(f"Updated question: {question_id}")
            return question
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update question: {e}")
            raise
    
    def delete_question(self, question_id: str) -> bool:
        """
        删除题目
        
        Args:
            question_id: 题目ID
            
        Returns:
            是否删除成功
        """
        try:
            question = self.db.query(Question).filter(Question.id == question_id).first()
            if not question:
                logger.warning(f"Question not found: {question_id}")
                return False
            
            self.db.delete(question)
            self.db.commit()
            
            logger.info(f"Deleted question: {question_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to delete question: {e}")
            raise
    
    def search_questions(self, keyword: str, skip: int = 0, limit: int = 50,
                      question_type: str = None, subject: str = None) -> List[Question]:
        """
        搜索题目
        
        Args:
            keyword: 搜索关键词
            skip: 跳过的记录数
            limit: 返回记录数限制
            question_type: 题目类型过滤
            subject: 学科过滤
            
        Returns:
            题目列表
        """
        try:
            query = self.db.query(Question).filter(Question.is_active == True)
            
            # 关键词搜索
            if keyword:
                search_filter = or_(
                    Question.content.ilike(f'%{keyword}%'),
                    Question.full_content.ilike(f'%{keyword}%')
                )
                query = query.filter(search_filter)
            
            # 类型过滤
            if question_type:
                query = query.filter(Question.question_type == question_type)
            
            # 学科过滤
            if subject:
                query = query.filter(Question.subject == subject)
            
            questions = query.offset(skip).limit(limit).all()
            return questions
            
        except Exception as e:
            logger.error(f"Failed to search questions: {e}")
            raise


def get_question_service(db: Session) -> QuestionService:
    """获取题目服务实例"""
    return QuestionService(db)
