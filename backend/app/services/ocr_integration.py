"""
OCR集成服务 - 整合OCR识别和数据库存储
"""
from typing import Dict, List
import logging
from datetime import datetime

from sqlalchemy.orm import Session

from app.services.qwen_ocr import get_ocr_service
from app.services.question_service import get_question_service

logger = logging.getLogger(__name__)


class OCRIntegrationService:
    """OCR集成服务 - 处理从OCR识别到数据库存储的完整流程"""

    def __init__(self, db: Session):
        self.db = db
        self.ocr_service = get_ocr_service()
        self.question_service = get_question_service(db)

    def process_document_images(
        self,
        image_paths: List[str],
        document_title: str,
        filename: str,
        uploaded_by: str,
        file_path: str = None,
        file_url: str = None,
        file_size: int = None,
        file_type: str = None,
    ) -> Dict:
        """
        处理文档图片的完整流程: OCR识别 -> 数据库存储
        """
        try:
            document = self.question_service.create_document(
                title=document_title,
                filename=filename,
                file_path=file_path,
                file_url=file_url,
                file_size=file_size,
                file_type=file_type,
                uploaded_by=uploaded_by,
            )

            logger.info("Starting OCR processing for document %s", document.id)
            ocr_questions: List[Dict] = []
            extraction_errors: List[Dict] = []

            for index, image_path in enumerate(image_paths):
                try:
                    questions = self.ocr_service.extract_questions(image_path)
                    if questions:
                        for question in questions:
                            question["source_image"] = image_path
                            question["image_index"] = index
                        ocr_questions.extend(questions)
                    else:
                        extraction_errors.append(
                            {
                                "image_index": index,
                                "error": "No questions detected",
                                "timestamp": datetime.utcnow().isoformat(),
                            }
                        )
                except Exception as exc:
                    logger.error(
                        "OCR failed for %s: %s", image_path, exc, exc_info=True
                    )
                    extraction_errors.append(
                        {
                            "image_index": index,
                            "error": str(exc),
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    )

            self.question_service.update_document_status(
                document_id=str(document.id),
                status="processing",
                total_questions=len(ocr_questions),
                processed_questions=0,
                extraction_errors=extraction_errors or None,
            )

            if not ocr_questions:
                self.question_service.update_document_status(
                    document_id=str(document.id),
                    status="completed",
                    total_questions=0,
                    processed_questions=0,
                    extraction_errors=extraction_errors or None,
                )
                logger.warning("No questions detected in document %s", document.id)
                return {
                    "success": False,
                    "document_id": str(document.id),
                    "questions_created": 0,
                    "total_questions": 0,
                    "extraction_errors": len(extraction_errors),
                    "message": "No questions detected in the provided images",
                }

            created_questions = self.question_service.create_questions_from_ocr(
                ocr_questions=ocr_questions,
                document_id=str(document.id),
                created_by=uploaded_by,
            )

            self.question_service.update_document_status(
                document_id=str(document.id),
                status="completed",
                total_questions=len(ocr_questions),
                processed_questions=len(created_questions),
                extraction_errors=extraction_errors or None,
            )

            logger.info(
                "Successfully processed document %s: %d questions created",
                document.id,
                len(created_questions),
            )

            return {
                "success": True,
                "document_id": str(document.id),
                "questions_created": len(created_questions),
                "total_questions": len(ocr_questions),
                "extraction_errors": len(extraction_errors),
                "questions": [q.to_dict() for q in created_questions],
            }

        except Exception as exc:
            logger.error("Failed to process document images: %s", exc, exc_info=True)
            try:
                if "document" in locals():
                    self.question_service.update_document_status(
                        document_id=str(document.id),
                        status="failed",
                        extraction_errors=[
                            {"error": str(exc), "timestamp": datetime.utcnow().isoformat()}
                        ],
                    )
            except Exception:
                pass

            return {
                "success": False,
                "error": str(exc),
                "message": "Failed to process document",
            }

    def process_single_image(self, image_path: str, document_id: str, uploaded_by: str) -> Dict:
        """
        处理单张图片的OCR识别和存储
        """
        try:
            questions = self.ocr_service.extract_questions(image_path)
            if not questions:
                return {
                    "success": False,
                    "message": "No questions detected in image",
                    "questions_created": 0,
                }

            for question in questions:
                question["source_image"] = image_path

            created_questions = self.question_service.create_questions_from_ocr(
                ocr_questions=questions,
                document_id=document_id,
                created_by=uploaded_by,
            )

            logger.info(
                "Processed single image: %d questions created", len(created_questions)
            )

            return {
                "success": True,
                "questions_created": len(created_questions),
                "questions": [q.to_dict() for q in created_questions],
            }

        except Exception as exc:
            logger.error("Failed to process single image: %s", exc, exc_info=True)
            return {
                "success": False,
                "error": str(exc),
                "message": "Failed to process image",
            }

    def get_processing_statistics(self, document_id: str) -> Dict:
        """
        获取文档处理统计信息
        """
        try:
            document = self.question_service.get_document_by_id(document_id)
            if not document:
                return {"error": "Document not found"}

            questions = self.question_service.get_questions_by_document(document_id)
            type_stats: Dict[str, int] = {}
            for question in questions:
                q_type = question.question_type
                type_stats[q_type] = type_stats.get(q_type, 0) + 1

            return {
                "document_id": document_id,
                "document_title": document.title,
                "processing_status": document.processing_status,
                "total_questions": document.total_questions,
                "processed_questions": document.processed_questions,
                "ocr_confidence_avg": document.ocr_confidence_avg,
                "question_type_distribution": type_stats,
                "created_at": document.created_at.isoformat()
                if document.created_at
                else None,
                "processed_at": document.processed_at.isoformat()
                if document.processed_at
                else None,
            }

        except Exception as exc:
            logger.error("Failed to get processing statistics: %s", exc, exc_info=True)
            return {"error": str(exc)}


def get_ocr_integration_service(db: Session) -> OCRIntegrationService:
    """获取OCR集成服务实例"""
    return OCRIntegrationService(db)
