"""
OCR相关API端点
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List, Dict, Optional
import os
import uuid
import aiofiles
from pathlib import Path
import logging

from app.services.qwen_ocr import get_ocr_service
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# 支持的图片格式
SUPPORTED_IMAGE_TYPES = {
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/bmp',
    'image/tiff',
    'image/webp'
}

# 最大文件大小 (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024

@router.post("/upload", summary="上传图片进行OCR识别")
async def upload_image_for_ocr(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="上传的图片文件")
):
    """
    上传图片文件,进行OCR文字识别和题目解析
    
    Args:
        file: 上传的图片文件
        
    Returns:
        OCR识别结果,包括识别的题目信息
    """
    try:
        # 验证文件类型
        if file.content_type not in SUPPORTED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件类型: {file.content_type}。支持的格式: {', '.join(SUPPORTED_IMAGE_TYPES)}"
            )
        
        # 验证文件大小
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"文件大小超过限制 ({MAX_FILE_SIZE // (1024*1024)}MB)"
            )
        
        # 生成唯一文件名
        file_id = str(uuid.uuid4())
        file_extension = Path(file.filename).suffix or '.jpg'
        filename = f"{file_id}{file_extension}"
        
        # 确保上传目录存在
        upload_dir = Path("data/uploads/ocr")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # 保存文件
        file_path = upload_dir / filename
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(file_content)
        
        logger.info(f"File saved: {file_path}")
        
        # 添加后台任务：处理完成后清理临时文件
        background_tasks.add_task(cleanup_temp_file, file_path)
        
        # 进行OCR识别
        ocr_service = get_ocr_service()
        questions = ocr_service.extract_questions(str(file_path))
        
        return {
            "success": True,
            "message": "OCR识别完成",
            "data": {
                "file_id": file_id,
                "filename": file.filename,
                "questions": questions,
                "total_questions": len(questions)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"OCR处理失败: {str(e)}"
        )

@router.post("/batch-upload", summary="批量上传图片进行OCR识别")
async def batch_upload_images_for_ocr(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="上传的图片文件列表")
):
    """
    批量上传图片文件,进行OCR文字识别和题目解析
    
    Args:
        files: 上传的图片文件列表
        
    Returns:
        所有图片的OCR识别结果
    """
    try:
        if len(files) > 10:  # 限制最多10个文件
            raise HTTPException(
                status_code=400,
                detail="批量上传最多支持10个文件"
            )
        
        results = []
        file_paths = []
        
        for file in files:
            # 验证文件类型
            if file.content_type not in SUPPORTED_IMAGE_TYPES:
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": f"不支持的文件类型: {file.content_type}"
                })
                continue
            
            # 验证文件大小
            file_content = await file.read()
            if len(file_content) > MAX_FILE_SIZE:
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": f"文件大小超过限制"
                })
                continue
            
            # 保存文件
            file_id = str(uuid.uuid4())
            file_extension = Path(file.filename).suffix or '.jpg'
            filename = f"{file_id}{file_extension}"
            
            upload_dir = Path("data/uploads/ocr")
            upload_dir.mkdir(parents=True, exist_ok=True)
            
            file_path = upload_dir / filename
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(file_content)
            
            file_paths.append(str(file_path))
            
            # 进行OCR识别
            try:
                ocr_service = get_ocr_service()
                questions = ocr_service.extract_questions(str(file_path))
                
                results.append({
                    "filename": file.filename,
                    "file_id": file_id,
                    "success": True,
                    "questions": questions,
                    "total_questions": len(questions)
                })
                
            except Exception as e:
                logger.error(f"OCR failed for {file.filename}: {e}")
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": f"OCR处理失败: {str(e)}"
                })
        
        # 添加清理任务
        for file_path in file_paths:
            background_tasks.add_task(cleanup_temp_file, file_path)
        
        # 统计结果
        successful_files = sum(1 for r in results if r["success"])
        total_questions = sum(r.get("total_questions", 0) for r in results if r["success"])
        
        return {
            "success": True,
            "message": f"批量处理完成,成功处理 {successful_files}/{len(files)} 个文件",
            "data": {
                "total_files": len(files),
                "successful_files": successful_files,
                "total_questions": total_questions,
                "results": results
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch OCR processing failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"批量OCR处理失败: {str(e)}"
        )

@router.get("/text-extract/{file_id}", summary="提取图片文字内容")
async def extract_text_from_image(
    file_id: str,
    background_tasks: BackgroundTasks
):
    """
    从已上传的图片中提取纯文字内容（不进行题目解析）
    
    Args:
        file_id: 文件ID
        
    Returns:
        提取的文字内容
    """
    try:
        # 查找文件
        upload_dir = Path("data/uploads/ocr")
        file_path = None
        
        for file in upload_dir.glob(f"{file_id}.*"):
            file_path = file
            break
        
        if not file_path or not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail="文件不存在"
            )
        
        # 进行文字提取
        ocr_service = get_ocr_service()
        text_results = ocr_service.extract_text_from_image(str(file_path))
        
        # 添加清理任务
        background_tasks.add_task(cleanup_temp_file, str(file_path))
        
        return {
            "success": True,
            "message": "文字提取完成",
            "data": {
                "file_id": file_id,
                "text_regions": text_results,
                "total_regions": len(text_results),
                "full_text": " ".join([r["text"] for r in text_results])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Text extraction failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"文字提取失败: {str(e)}"
        )

@router.get("/supported-formats", summary="获取支持的文件格式")
async def get_supported_formats():
    """
    获取支持的图片格式列表
    
    Returns:
        支持的文件格式和限制信息
    """
    return {
        "success": True,
        "data": {
            "supported_types": list(SUPPORTED_IMAGE_TYPES),
            "max_file_size": MAX_FILE_SIZE,
            "max_file_size_mb": MAX_FILE_SIZE // (1024 * 1024),
            "max_batch_files": 10
        }
    }

async def cleanup_temp_file(file_path: str):
    """
    清理临时文件
    
    Args:
        file_path: 文件路径
    """
    try:
        path = Path(file_path)
        if path.exists():
            path.unlink()
            logger.info(f"Cleaned up temporary file: {file_path}")
    except Exception as e:
        logger.warning(f"Failed to cleanup file {file_path}: {e}")
