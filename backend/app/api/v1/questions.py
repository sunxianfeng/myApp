"""
题目相关的API路由
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import os
import uuid
from datetime import datetime

from app.database import get_db
from app.services.ocr_integration import get_ocr_integration_service
from app.services.question_service import get_question_service
from app.schemas.question import (
    QuestionResponse, QuestionUpdate, QuestionSearchRequest, QuestionListResponse,
    DocumentResponse, OCRProcessRequest, OCRProcessResponse,
        ProcessingStatistics, QuestionVerificationRequest, APIResponse,
        QuestionBulkCreateRequest, QuestionBulkCreateResponse, QuestionCreate
)
from app.utils.auth import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/questions", tags=["questions"])


@router.post("/process-ocr", response_model=OCRProcessResponse)
async def process_ocr_document(
    request: OCRProcessRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    处理OCR文档 - 识别图片中的题目并保存到数据库
    """
    try:
        ocr_service = get_ocr_integration_service(db)
        
        # 验证图片文件是否存在
        existing_image_paths = []
        for img_path in request.image_paths:
            if os.path.exists(img_path):
                existing_image_paths.append(img_path)
            else:
                logger.warning(f"Image file not found: {img_path}")
        
        if not existing_image_paths:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid image files found"
            )
        
        # 处理文档
        result = ocr_service.process_document_images(
            image_paths=existing_image_paths,
            document_title=request.document_title,
            filename=request.filename,
            uploaded_by=str(current_user.id),
            file_path=request.file_path,
            file_url=request.file_url,
            file_size=request.file_size,
            file_type=request.file_type
        )
        
        return OCRProcessResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR processing failed: {str(e)}"
        )


@router.post("/upload-and-process", response_model=OCRProcessResponse)
async def upload_and_process(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    上传文件并处理OCR - 一体化的文件上传和OCR处理接口
    """
    try:
        # 创建上传目录
        upload_dir = "data/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        # 生成唯一文件名
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # 保存文件
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # TODO: 根据文件类型处理（PDF转图片等）
        # 目前假设上传的是图片文件
        image_paths = [file_path]
        
        # 处理OCR
        ocr_service = get_ocr_integration_service(db)
        result = ocr_service.process_document_images(
            image_paths=image_paths,
            document_title=title,
            filename=file.filename,
            uploaded_by=str(current_user.id),
            file_path=file_path,
            file_size=len(content),
            file_type=file.content_type
        )
        
        return OCRProcessResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload and process failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload and process failed: {str(e)}"
        )


@router.get("/document/{document_id}/questions", response_model=QuestionListResponse)
async def get_questions_by_document(
    document_id: str,
    skip: int = 0,
    limit: int = 50,
    question_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    根据文档ID获取题目列表
    """
    try:
        question_service = get_question_service(db)
        questions = question_service.get_questions_by_document(
            document_id=document_id,
            skip=skip,
            limit=limit,
            question_type=question_type
        )
        
        # 获取总数
        total_questions = len(questions)
        
        return QuestionListResponse(
            questions=[QuestionResponse.from_orm(q) for q in questions],
            total=total_questions,
            skip=skip,
            limit=limit
        )
        
    except Exception as e:
        logger.error(f"Failed to get questions by document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get questions: {str(e)}"
        )


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    根据ID获取题目详情
    """
    try:
        question_service = get_question_service(db)
        question = question_service.get_question_by_id(question_id)
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        return QuestionResponse.from_orm(question)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get question: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get question: {str(e)}"
        )


@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: str,
    question_update: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新题目信息
    """
    try:
        question_service = get_question_service(db)
        updated_question = question_service.update_question(
            question_id=question_id,
            update_data=question_update.dict(exclude_unset=True)
        )
        
        if not updated_question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        return QuestionResponse.from_orm(updated_question)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update question: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update question: {str(e)}"
        )


@router.delete("/{question_id}", response_model=APIResponse)
async def delete_question(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    删除题目
    """
    try:
        question_service = get_question_service(db)
        success = question_service.delete_question(question_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        return APIResponse(
            success=True,
            message="Question deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete question: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete question: {str(e)}"
        )


@router.post("/search", response_model=QuestionListResponse)
async def search_questions(
    search_request: QuestionSearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    搜索题目
    """
    try:
        question_service = get_question_service(db)
        questions = question_service.search_questions(
            keyword=search_request.keyword,
            skip=search_request.skip,
            limit=search_request.limit,
            question_type=search_request.question_type,
            subject=search_request.subject
        )
        
        # 获取总数（简化版本，实际应该用COUNT查询）
        total_questions = len(questions)
        
        return QuestionListResponse(
            questions=[QuestionResponse.from_orm(q) for q in questions],
            total=total_questions,
            skip=search_request.skip,
            limit=search_request.limit
        )
        
    except Exception as e:
        logger.error(f"Failed to search questions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search questions: {str(e)}"
        )


@router.post("/verify", response_model=APIResponse)
async def verify_question(
    verification_request: QuestionVerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    验证题目答案
    """
    try:
        question_service = get_question_service(db)
        
        # 更新验证信息
        update_data = {
            "is_verified": verification_request.is_verified,
            "verified_by": str(current_user.id),
            "verified_at": datetime.utcnow()
        }
        
        if verification_request.correct_answer:
            update_data["correct_answer"] = verification_request.correct_answer
        if verification_request.explanation:
            update_data["explanation"] = verification_request.explanation
        if verification_request.answer_key:
            update_data["answer_key"] = verification_request.answer_key
        
        updated_question = question_service.update_question(
            question_id=verification_request.question_id,
            update_data=update_data
        )
        
        if not updated_question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        return APIResponse(
            success=True,
            message="Question verified successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to verify question: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify question: {str(e)}"
        )


@router.get("/document/{document_id}/statistics", response_model=ProcessingStatistics)
async def get_document_statistics(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取文档处理统计信息
    """
    try:
        ocr_service = get_ocr_integration_service(db)
        stats = ocr_service.get_processing_statistics(document_id)
        
        if "error" in stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=stats["error"]
            )
        
        return ProcessingStatistics(**stats)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get statistics: {str(e)}"
        )

@router.post("/bulk-create", response_model=QuestionBulkCreateResponse)
async def bulk_create_questions(
    request: QuestionBulkCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    批量创建题目（用户在前端选择并纠正后提交）
    注意：与 OCR 自动写入不同，此接口只写入用户确认的题目。
    """
    try:
        question_service = get_question_service(db)

        # 创建文档记录（标记为 completed 以表示用户已确认）
        document = question_service.create_document(
            title=request.document_title,
            filename=request.filename,
            file_type=request.file_type,
            file_size=request.file_size,
            uploaded_by=str(current_user.id)
        )

        # 将前端题目转换成 OCR 结构字典以复用 create_questions_from_ocr
        ocr_style_questions = []
        for q in request.questions:
            ocr_style_questions.append({
                'number': q.number,
                'content': q.content,
                'full_content': q.full_content or q.content,
                'type': q.question_type,
                'options': [{'label': opt.label, 'content': opt.content} for opt in (q.options or [])],
                'confidence': q.ocr_confidence if hasattr(q, 'ocr_confidence') else 1.0,
            })

        created_questions = question_service.create_questions_from_ocr(
            ocr_questions=ocr_style_questions,
            document_id=str(document.id),
            created_by=str(current_user.id)
        )

        # 更新文档状态
        question_service.update_document_status(
            document_id=str(document.id),
            status='completed',
            total_questions=len(created_questions),
            processed_questions=len(created_questions)
        )

        return QuestionBulkCreateResponse(
            success=True,
            document_id=str(document.id),
            created_count=len(created_questions),
            questions=[QuestionResponse.from_orm(q) for q in created_questions],
            message='批量创建题目成功'
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to bulk create questions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to bulk create questions: {str(e)}"
        )
