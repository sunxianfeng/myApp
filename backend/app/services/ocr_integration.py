"""
OCR集成服务 - 整合OCR识别和数据库存储
"""
from typing import List, Dict, Optional, Tuple
import logging
from sqlalchemy.orm import Session
import os
from datetime import datetime

from app.services.ocr import get_ocr_service, QuestionOCR
from app.services.question_service import get_question_service
from app.models.question import Question, Document

logger = logging.getLogger(__name__)

class OCRIntegrationService:
    """OCR集成服务 - 处理从OCR识别到数据库存储的完整流程"""
    
    def __init__(self, db: Session):
        self.db = db
        self.ocr_service = get_ocr_service()
        self.question_service = get_question_service(db)
    
    def process_document_images(self, image_paths: List[str], document_title: str, 
                           filename: str, uploaded_by: str, file_path: str = None,
                           file_url: str = None, file_size: int = None,
                           file_type: str = None) -> Dict:
        """
        处理文档图片的完整流程:OCR识别 -> 数据库存储
        
        Args:
            image_paths: 图片路径列表
            document_title: 文档标题
            filename: 原始文件名
            uploaded_by: 上传用户ID
            file_path: 文件存储路径
            file_url: 文件访问URL
            file_size: 文件大小
            file_type: 文件类型
            
        Returns:
            处理结果字典
        """
        try:
            # 1. 创建文档记录
            document = self.question_service.create_document(
                title=document_title,
                filename=filename,
                file_path=file_path,
                file_url=file_url,
                file_size=file_size,
                file_type=file_type,
                uploaded_by=uploaded_by
            )
            
            # 2. OCR识别题目
            logger.info(f"Starting OCR processing for document {document.id}")
            ocr_questions = self.ocr_service.batch_extract_questions(image_paths)
            
            # 3. 计算OCR置信度统计
            confidence_scores = []
            extraction_errors = []
            
            for i, questions in enumerate([self.ocr_service.extract_questions(img_path) for img_path in image_paths]):
                if questions:
                    # 从OCR结果中提取置信度信息
                    for q in questions:
                        # 这里需要从OCR的原始结果中获取置信度
                        # 暂时使用默认值，后续可以优化
                        confidence_scores.append(0.85)  # 默认置信度
                else:
                    extraction_errors.append({
                        'image_index': i,
                        'error': 'No questions detected',
                        'timestamp': datetime.utcnow().isoformat()
                    })
            
            # 4. 更新文档状态为处理中
            self.question_service.update_document_status(
                document_id=str(document.id),
                status='processing',
                total_questions=len(ocr_questions),
                processed_questions=0
            )
            
            # 5. 保存题目到数据库
            if ocr_questions:
                created_questions = self.question_service.create_questions_from_ocr(
                    ocr_questions=ocr_questions,
                    document_id=str(document.id),
                    created_by=uploaded_by
                )
                
                # 6. 更新文档状态为完成
                avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
                self.question_service.update_document_status(
                    document_id=str(document.id),
                    status='completed',
                    total_questions=len(ocr_questions),
                    processed_questions=len(created_questions),
                    ocr_confidence_avg=f"{avg_confidence:.2f}",
                    extraction_errors=extraction_errors if extraction_errors else None
                )
                
                logger.info(f"Successfully processed document {document.id}: {len(created_questions)} questions created")
                
                return {
                    'success': True,
                    'document_id': str(document.id),
                    'questions_created': len(created_questions),
                    'total_questions': len(ocr_questions),
                    'extraction_errors': len(extraction_errors),
                    'avg_confidence': avg_confidence,
                    'questions': [q.to_dict() for q in created_questions]
                }
            else:
                # 没有识别到题目
                self.question_service.update_document_status(
                    document_id=str(document.id),
                    status='completed',
                    total_questions=0,
                    processed_questions=0,
                    extraction_errors=extraction_errors
                )
                
                logger.warning(f"No questions detected in document {document.id}")
                
                return {
                    'success': False,
                    'document_id': str(document.id),
                    'questions_created': 0,
                    'total_questions': 0,
                    'extraction_errors': len(extraction_errors),
                    'message': 'No questions detected in the provided images'
                }
                
        except Exception as e:
            logger.error(f"Failed to process document images: {e}")
            
            # 尝试更新文档状态为失败
            try:
                if 'document' in locals():
                    self.question_service.update_document_status(
                        document_id=str(document.id),
                        status='failed',
                        extraction_errors=[{
                            'error': str(e),
                            'timestamp': datetime.utcnow().isoformat()
                        }]
                    )
            except:
                pass
            
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to process document'
            }
    
    def process_single_image(self, image_path: str, document_id: str, 
                          uploaded_by: str) -> Dict:
        """
        处理单张图片的OCR识别和存储
        
        Args:
            image_path: 图片路径
            document_id: 文档ID
            uploaded_by: 上传用户ID
            
        Returns:
            处理结果字典
        """
        try:
            # OCR识别
            questions = self.ocr_service.extract_questions(image_path)
            
            if not questions:
                return {
                    'success': False,
                    'message': 'No questions detected in image',
                    'questions_created': 0
                }
            
            # 保存到数据库
            created_questions = self.question_service.create_questions_from_ocr(
                ocr_questions=questions,
                document_id=document_id,
                created_by=uploaded_by
            )
            
            logger.info(f"Processed single image: {len(created_questions)} questions created")
            
            return {
                'success': True,
                'questions_created': len(created_questions),
                'questions': [q.to_dict() for q in created_questions]
            }
            
        except Exception as e:
            logger.error(f"Failed to process single image: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to process image'
            }
    
    def get_processing_statistics(self, document_id: str) -> Dict:
        """
        获取文档处理统计信息
        
        Args:
            document_id: 文档ID
            
        Returns:
            统计信息字典
        """
        try:
            document = self.question_service.get_document_by_id(document_id)
            if not document:
                return {'error': 'Document not found'}
            
            questions = self.question_service.get_questions_by_document(document_id)
            
            # 统计题目类型分布
            type_stats = {}
            for question in questions:
                q_type = question.question_type
                type_stats[q_type] = type_stats.get(q_type, 0) + 1
            
            return {
                'document_id': document_id,
                'document_title': document.title,
                'processing_status': document.processing_status,
                'total_questions': document.total_questions,
                'processed_questions': document.processed_questions,
                'ocr_confidence_avg': document.ocr_confidence_avg,
                'question_type_distribution': type_stats,
                'created_at': document.created_at.isoformat() if document.created_at else None,
                'processed_at': document.processed_at.isoformat() if document.processed_at else None
            }
            
        except Exception as e:
            logger.error(f"Failed to get processing statistics: {e}")
            return {'error': str(e)}


def get_ocr_integration_service(db: Session) -> OCRIntegrationService:
    """获取OCR集成服务实例"""
    return OCRIntegrationService(db)
