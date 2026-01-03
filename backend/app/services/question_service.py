"""
题目服务模块 - 处理题目的数据库操作
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import logging
from datetime import datetime
import uuid
import hashlib
import asyncio
from concurrent.futures import ThreadPoolExecutor

from app.models.question import Question, Document
from app.database import get_db
from app.config import settings

logger = logging.getLogger(__name__)

# Conditional import for vector store (requires chromadb which needs Python <=3.12)
try:
    from app.services.vector_store import get_vector_store
    VECTOR_STORE_AVAILABLE = True
except ImportError:
    VECTOR_STORE_AVAILABLE = False
    logger.warning("ChromaDB not available - vector search will be disabled")

logger = logging.getLogger(__name__)

# 全局线程池用于向量存储操作
_vector_store_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="vector_store")

class QuestionService:
    """题目数据库服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def _build_question_text(self, question: Question) -> str:
        """
        构建用于向量搜索的题目文本
        
        Args:
            question: 题目对象
            
        Returns:
            拼接后的题目文本
        """
        text_parts = []
        
        # 添加题干
        if question.content:
            text_parts.append(question.content)
        
        # 如果是选择题，添加选项
        if question.question_type in ['single_choice', 'multiple_choice', 'choice'] and question.options:
            for i, option in enumerate(question.options):
                text_parts.append(f"{chr(65+i)}. {option}")  # A. B. C. D.
        
        return " ".join(text_parts)
    
    def _generate_embedding(self, text: str) -> List[float]:
        """
        使用简单的文本哈希生成伪向量（临时方案）
        
        TODO: 升级为真实的 embedding 模型，如 sentence-transformers
        
        Args:
            text: 输入文本
            
        Returns:
            向量表示（384维）
        """
        # 简单的哈希方案：将文本的多个哈希值组合成向量
        # 这只是一个占位实现，实际应该使用 embedding 模型
        hash_obj = hashlib.sha256(text.encode('utf-8'))
        hash_bytes = hash_obj.digest()
        
        # 生成384维向量（ChromaDB默认维度）
        vector = []
        for i in range(384):
            # 使用不同的种子生成不同的哈希
            seed_text = f"{text}_{i}"
            seed_hash = hashlib.md5(seed_text.encode('utf-8')).digest()
            # 归一化到 [-1, 1]
            value = (int.from_bytes(seed_hash[:4], 'big') % 1000) / 500.0 - 1.0
            vector.append(value)
        
        return vector
    
    def _add_question_to_vector_store(self, question: Question, vector_store) -> bool:
        """
        将题目添加到向量存储
        
        Args:
            question: 题目对象
            vector_store: 向量存储实例
            
        Returns:
            是否添加成功
        """
        try:
            # 构建题目文本
            question_text = self._build_question_text(question)
            
            if not question_text.strip():
                logger.warning(f"Question {question.id} has no content, skipping vector store")
                return False
            
            # 生成向量
            vector = self._generate_embedding(question_text)
            
            # 准备元数据
            metadata = {
                "question_id": str(question.id),
                "question_type": question.question_type or "unknown",
                "created_by": str(question.created_by),
                "created_at": question.created_at.isoformat() if question.created_at else "",
                "source_document_id": str(question.source_document_id) if question.source_document_id else "",
                "has_images": question.has_images or False,
            }
            
            # 添加到向量存储
            success = vector_store.add_vector(
                id=str(question.id),
                vector=vector,
                metadata=metadata,
                document=question_text
            )
            
            if success:
                logger.debug(f"Added question {question.id} to vector store")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to add question {question.id} to vector store: {e}")
            return False
    
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
            # Convert string to UUID if needed
            document_id_uuid = document_id if isinstance(document_id, uuid.UUID) else uuid.UUID(str(document_id))
            document = self.db.query(Document).filter(Document.id == document_id_uuid).first()
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
            
            # 将题目内容存入 ChromaDB（异步执行，避免阻塞）
            # 注意：向量存储失败不影响主流程
            if created_questions and settings.VECTOR_STORE_ENABLED and VECTOR_STORE_AVAILABLE:
                # 在后台线程中执行向量存储操作
                import threading
                def add_to_vector_store():
                    try:
                        vector_store = get_vector_store(
                            persist_dir=settings.VECTOR_STORE_DIR,
                            collection_name="questions"
                        )
                        success_count = 0
                        for question in created_questions:
                            if self._add_question_to_vector_store(question, vector_store):
                                success_count += 1
                        logger.info(f"Added {success_count}/{len(created_questions)} questions to vector store")
                    except Exception as e:
                        logger.warning(f"Background vector store operation failed: {e}")
                
                # 启动后台线程（daemon=True 确保主程序退出时线程也退出）
                thread = threading.Thread(target=add_to_vector_store, daemon=True)
                thread.start()
                logger.debug("Started background thread for vector store operation")
            elif created_questions and settings.VECTOR_STORE_ENABLED and not VECTOR_STORE_AVAILABLE:
                logger.warning("Vector store is enabled but ChromaDB is not available - skipping vector storage")
            
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
            # Convert string to UUID if needed
            document_id_uuid = document_id if isinstance(document_id, uuid.UUID) else uuid.UUID(str(document_id))
            query = self.db.query(Question).filter(Question.source_document_id == document_id_uuid)
            
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
            # Convert string to UUID if needed
            question_id_uuid = question_id if isinstance(question_id, uuid.UUID) else uuid.UUID(str(question_id))
            question = self.db.query(Question).filter(Question.id == question_id_uuid).first()
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
            # Convert string to UUID if needed
            question_id_uuid = question_id if isinstance(question_id, uuid.UUID) else uuid.UUID(str(question_id))
            question = self.db.query(Question).filter(Question.id == question_id_uuid).first()
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
            # Convert string to UUID if needed
            question_id_uuid = question_id if isinstance(question_id, uuid.UUID) else uuid.UUID(str(question_id))
            question = self.db.query(Question).filter(Question.id == question_id_uuid).first()
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
    
    def semantic_search_questions(self, query_text: str, limit: int = 20, 
                                 created_by: str = None) -> List[Question]:
        """
        使用向量相似度进行语义搜索（同步版本，不推荐在 API 中直接使用）
        
        Args:
            query_text: 搜索文本
            limit: 返回结果数量
            created_by: 可选，仅搜索特定用户创建的题目
            
        Returns:
            相关题目列表
        """
        if not VECTOR_STORE_AVAILABLE:
            logger.warning("Vector search not available - falling back to keyword search")
            return self.search_questions(keyword=query_text, limit=limit)
        
        try:
            # 生成查询向量
            query_vector = self._generate_embedding(query_text)
            
            # 从向量存储中搜索
            vector_store = get_vector_store(collection_name="questions")
            results = vector_store.search_vector(query_vector, limit=limit * 2)  # 多获取一些，便于过滤
            
            if not results or not results.get('ids') or not results['ids'][0]:
                logger.info("No results from vector search")
                return []
            
            # 提取题目ID
            question_ids = results['ids'][0]  # ChromaDB返回的是嵌套列表
            
            # 从数据库中获取完整题目信息
            question_id_uuids = []
            for qid in question_ids:
                try:
                    question_id_uuids.append(uuid.UUID(qid))
                except (ValueError, AttributeError):
                    logger.warning(f"Invalid question ID in vector store: {qid}")
                    continue
            
            query = self.db.query(Question).filter(
                Question.id.in_(question_id_uuids),
                Question.is_active == True
            )
            
            # 如果指定了创建者，添加过滤
            if created_by:
                created_by_uuid = created_by if isinstance(created_by, uuid.UUID) else uuid.UUID(str(created_by))
                query = query.filter(Question.created_by == created_by_uuid)
            
            questions = query.limit(limit).all()
            
            # 按照向量搜索的顺序排序
            question_order = {str(qid): i for i, qid in enumerate(question_ids)}
            questions.sort(key=lambda q: question_order.get(str(q.id), 999))
            
            logger.info(f"Semantic search returned {len(questions)} questions")
            return questions
            
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            # 降级到普通搜索
            return self.search_questions(keyword=query_text, limit=limit)
    
    async def semantic_search_questions_async(self, query_text: str, limit: int = 20, 
                                             created_by: str = None) -> List[Question]:
        """
        使用向量相似度进行语义搜索（异步版本，推荐在 API 中使用）
        
        Args:
            query_text: 搜索文本
            limit: 返回结果数量
            created_by: 可选，仅搜索特定用户创建的题目
            
        Returns:
            相关题目列表
        """
        if not VECTOR_STORE_AVAILABLE:
            logger.warning("Vector search not available - falling back to keyword search")
            return self.search_questions(keyword=query_text, limit=limit)
        
        try:
            # 在线程池中执行向量搜索（避免阻塞事件循环）
            loop = asyncio.get_event_loop()
            
            def vector_search_task():
                query_vector = self._generate_embedding(query_text)
                vector_store = get_vector_store(collection_name="questions")
                return vector_store.search_vector(query_vector, limit=limit * 2)
            
            results = await loop.run_in_executor(_vector_store_executor, vector_search_task)
            
            if not results or not results.get('ids') or not results['ids'][0]:
                logger.info("No results from vector search")
                return []
            
            # 提取题目ID
            question_ids = results['ids'][0]
            
            # 从数据库中获取完整题目信息
            question_id_uuids = []
            for qid in question_ids:
                try:
                    question_id_uuids.append(uuid.UUID(qid))
                except (ValueError, AttributeError):
                    logger.warning(f"Invalid question ID in vector store: {qid}")
                    continue
            
            query = self.db.query(Question).filter(
                Question.id.in_(question_id_uuids),
                Question.is_active == True
            )
            
            # 如果指定了创建者，添加过滤
            if created_by:
                created_by_uuid = created_by if isinstance(created_by, uuid.UUID) else uuid.UUID(str(created_by))
                query = query.filter(Question.created_by == created_by_uuid)
            
            questions = query.limit(limit).all()
            
            # 按照向量搜索的顺序排序
            question_order = {str(qid): i for i, qid in enumerate(question_ids)}
            questions.sort(key=lambda q: question_order.get(str(q.id), 999))
            
            logger.info(f"Async semantic search returned {len(questions)} questions")
            return questions
            
        except Exception as e:
            logger.error(f"Async semantic search failed: {e}")
            # 降级到普通搜索
            return self.search_questions(keyword=query_text, limit=limit)

    def get_all_questions(
        self,
        created_by: str,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Question]:
        """Return latest active questions created by the given user."""
        try:
            # More robust UUID conversion with better error handling
            if isinstance(created_by, uuid.UUID):
                created_by_uuid = created_by
            else:
                # Clean the string - remove any whitespace or special characters
                created_by_str = str(created_by).strip()
                try:
                    created_by_uuid = uuid.UUID(created_by_str)
                except (ValueError, AttributeError) as e:
                    logger.error(f"Invalid UUID format for created_by: {created_by_str}, error: {e}")
                    # Return empty list instead of raising error
                    return []

            query = (
                self.db.query(Question)
                .filter(
                    Question.created_by == created_by_uuid,
                    Question.is_active == True,
                )
                .order_by(Question.created_at.desc())
            )

            return query.offset(skip).limit(limit).all()

        except Exception as e:
            logger.error(f"Failed to get all questions: {e}")
            raise


def get_question_service(db: Session) -> QuestionService:
    """获取题目服务实例"""
    return QuestionService(db)
