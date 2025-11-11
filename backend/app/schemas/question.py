"""
题目相关的Pydantic模型 - 用于API请求和响应的数据验证
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator


class QuestionOption(BaseModel):
    """题目选项模型"""
    label: str = Field(..., description="选项标签，如A、B、C、D")
    content: str = Field(..., description="选项内容")

    class Config:
        from_attributes = True


class QuestionBase(BaseModel):
    """题目基础模型"""
    number: int = Field(..., description="题目编号")
    content: str = Field(..., description="题目主要内容")
    full_content: Optional[str] = Field(None, description="题目完整内容")
    question_type: str = Field(..., description="题目类型")
    difficulty_level: Optional[str] = Field("medium", description="难度级别")
    subject: Optional[str] = Field(None, description="学科分类")
    topic_tags: Optional[List[str]] = Field(None, description="知识点标签")
    options: Optional[List[QuestionOption]] = Field(None, description="选择题选项")
    correct_answer: Optional[str] = Field(None, description="正确答案")
    explanation: Optional[str] = Field(None, description="题目解析")
    answer_key: Optional[str] = Field(None, description="答案详解")

    @validator('question_type')
    def validate_question_type(cls, v):
        allowed_types = ['multiple_choice', 'fill_blank', 'true_false', 'essay', 'other']
        if v not in allowed_types:
            raise ValueError(f'Question type must be one of: {allowed_types}')
        return v

    @validator('difficulty_level')
    def validate_difficulty_level(cls, v):
        allowed_levels = ['easy', 'medium', 'hard']
        if v and v not in allowed_levels:
            raise ValueError(f'Difficulty level must be one of: {allowed_levels}')
        return v

    class Config:
        from_attributes = True


class QuestionCreate(QuestionBase):
    """创建题目请求模型"""
    source_document_id: Optional[str] = Field(None, description="来源文档ID")
    source_image_path: Optional[str] = Field(None, description="来源图片路径")
    source_image_url: Optional[str] = Field(None, description="来源图片URL")
    ocr_confidence: Optional[str] = Field(None, description="OCR识别置信度")
    # TODO: 图片相关字段待实现
    # question_images: Optional[List[Dict[str, Any]]] = Field(None, description="题目中的图片信息")
    # has_images: Optional[bool] = Field(False, description="是否包含图片")


class QuestionUpdate(BaseModel):
    """更新题目请求模型"""
    content: Optional[str] = Field(None, description="题目主要内容")
    full_content: Optional[str] = Field(None, description="题目完整内容")
    question_type: Optional[str] = Field(None, description="题目类型")
    difficulty_level: Optional[str] = Field(None, description="难度级别")
    subject: Optional[str] = Field(None, description="学科分类")
    topic_tags: Optional[List[str]] = Field(None, description="知识点标签")
    options: Optional[List[QuestionOption]] = Field(None, description="选择题选项")
    correct_answer: Optional[str] = Field(None, description="正确答案")
    explanation: Optional[str] = Field(None, description="题目解析")
    answer_key: Optional[str] = Field(None, description="答案详解")
    is_verified: Optional[bool] = Field(None, description="是否已人工验证")
    is_active: Optional[bool] = Field(None, description="是否启用")


class QuestionResponse(QuestionBase):
    """题目响应模型"""
    id: str = Field(..., description="题目ID")
    source_image_path: Optional[str] = Field(None, description="来源图片路径")
    source_image_url: Optional[str] = Field(None, description="来源图片URL")
    source_document_id: Optional[str] = Field(None, description="来源文档ID")
    ocr_confidence: Optional[str] = Field(None, description="OCR识别置信度")
    is_verified: bool = Field(False, description="是否已人工验证")
    is_active: bool = Field(True, description="是否启用")
    processing_status: str = Field(..., description="处理状态")
    created_by: str = Field(..., description="创建用户ID")
    verified_by: Optional[str] = Field(None, description="验证用户ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    verified_at: Optional[datetime] = Field(None, description="验证时间")
    # TODO: 图片相关字段待实现
    # question_images: Optional[List[Dict[str, Any]]] = Field(None, description="题目中的图片信息")
    # has_images: Optional[bool] = Field(False, description="是否包含图片")

    class Config:
        from_attributes = True


class DocumentBase(BaseModel):
    """文档基础模型"""
    title: str = Field(..., description="文档标题")
    filename: str = Field(..., description="原始文件名")
    file_path: Optional[str] = Field(None, description="文件存储路径")
    file_url: Optional[str] = Field(None, description="文件访问URL")
    file_size: Optional[int] = Field(None, description="文件大小（字节）")
    file_type: Optional[str] = Field(None, description="文件类型")

    class Config:
        from_attributes = True


class DocumentCreate(DocumentBase):
    """创建文档请求模型"""
    uploaded_by: str = Field(..., description="上传用户ID")


class DocumentResponse(DocumentBase):
    """文档响应模型"""
    id: str = Field(..., description="文档ID")
    processing_status: str = Field(..., description="处理状态")
    total_questions: int = Field(0, description="提取的题目总数")
    processed_questions: int = Field(0, description="已处理的题目数")
    ocr_confidence_avg: Optional[str] = Field(None, description="平均OCR置信度")
    extraction_errors: Optional[List[Dict[str, Any]]] = Field(None, description="提取错误信息")
    uploaded_by: str = Field(..., description="上传用户ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    processed_at: Optional[datetime] = Field(None, description="处理完成时间")

    class Config:
        from_attributes = True


class OCRProcessRequest(BaseModel):
    """OCR处理请求模型"""
    document_title: str = Field(..., description="文档标题")
    filename: str = Field(..., description="原始文件名")
    file_path: Optional[str] = Field(None, description="文件存储路径")
    file_url: Optional[str] = Field(None, description="文件访问URL")
    file_size: Optional[int] = Field(None, description="文件大小")
    file_type: Optional[str] = Field(None, description="文件类型")
    image_paths: List[str] = Field(..., description="图片路径列表")


class OCRProcessResponse(BaseModel):
    """OCR处理响应模型"""
    success: bool = Field(..., description="处理是否成功")
    document_id: Optional[str] = Field(None, description="文档ID")
    questions_created: int = Field(0, description="创建的题目数量")
    total_questions: int = Field(0, description="识别的题目总数")
    extraction_errors: int = Field(0, description="提取错误数量")
    avg_confidence: Optional[float] = Field(None, description="平均置信度")
    questions: Optional[List[QuestionResponse]] = Field(None, description="创建的题目列表")
    message: Optional[str] = Field(None, description="处理消息")
    error: Optional[str] = Field(None, description="错误信息")


class QuestionSearchRequest(BaseModel):
    """题目搜索请求模型"""
    keyword: Optional[str] = Field(None, description="搜索关键词")
    question_type: Optional[str] = Field(None, description="题目类型过滤")
    subject: Optional[str] = Field(None, description="学科过滤")
    skip: int = Field(0, ge=0, description="跳过的记录数")
    limit: int = Field(50, ge=1, le=100, description="返回记录数限制")


class QuestionListResponse(BaseModel):
    """题目列表响应模型"""
    questions: List[QuestionResponse] = Field(..., description="题目列表")
    total: int = Field(..., description="总记录数")
    skip: int = Field(..., description="跳过的记录数")
    limit: int = Field(..., description="返回记录数限制")


class ProcessingStatistics(BaseModel):
    """处理统计响应模型"""
    document_id: str = Field(..., description="文档ID")
    document_title: str = Field(..., description="文档标题")
    processing_status: str = Field(..., description="处理状态")
    total_questions: int = Field(..., description="题目总数")
    processed_questions: int = Field(..., description="已处理题目数")
    ocr_confidence_avg: Optional[str] = Field(None, description="平均OCR置信度")
    question_type_distribution: Dict[str, int] = Field(..., description="题目类型分布")
    created_at: Optional[datetime] = Field(None, description="创建时间")
    processed_at: Optional[datetime] = Field(None, description="处理完成时间")
    error: Optional[str] = Field(None, description="错误信息")


class QuestionVerificationRequest(BaseModel):
    """题目验证请求模型"""
    question_id: str = Field(..., description="题目ID")
    is_verified: bool = Field(..., description="验证状态")
    correct_answer: Optional[str] = Field(None, description="正确答案")
    explanation: Optional[str] = Field(None, description="题目解析")
    answer_key: Optional[str] = Field(None, description="答案详解")


class QuestionBatchUpdate(BaseModel):
    """批量更新题目请求模型"""
    question_ids: List[str] = Field(..., description="题目ID列表")
    updates: QuestionUpdate = Field(..., description="更新数据")


# 响应包装器
class APIResponse(BaseModel):
    """通用API响应模型"""
    success: bool = Field(..., description="请求是否成功")
    message: str = Field(..., description="响应消息")
    data: Optional[Any] = Field(None, description="响应数据")
    error: Optional[str] = Field(None, description="错误信息")


class PaginatedResponse(BaseModel):
    """分页响应模型"""
    success: bool = Field(True, description="请求是否成功")
    message: str = Field("操作成功", description="响应消息")
    data: Dict[str, Any] = Field(..., description="分页数据")
    total: int = Field(..., description="总记录数")
    page: int = Field(..., description="当前页码")
    per_page: int = Field(..., description="每页记录数")
