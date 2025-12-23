from pydantic import BaseModel, Field, UUID4
from typing import Optional, List
from datetime import datetime


class CategoryBase(BaseModel):
    """分类基础模型"""
    name: str = Field(..., max_length=100, description="分类名称")
    description: Optional[str] = Field(None, description="分类描述")
    icon: Optional[str] = Field(None, max_length=50, description="图标名称")
    color: Optional[str] = Field(None, max_length=20, description="颜色标记")
    category_type: str = Field(..., description="分类类型: subject, grade, difficulty, custom")
    parent_id: Optional[UUID4] = Field(None, description="父级分类ID")
    sort_order: int = Field(0, description="排序顺序")


class CategoryCreate(CategoryBase):
    """创建分类"""
    pass


class CategoryUpdate(BaseModel):
    """更新分类"""
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=20)
    category_type: Optional[str] = None
    parent_id: Optional[UUID4] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    """分类响应模型"""
    id: UUID4
    user_id: UUID4
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CollectionBase(BaseModel):
    """错题本基础模型"""
    title: str = Field(..., max_length=200, description="错题本标题")
    description: Optional[str] = Field(None, description="错题本描述")
    cover_image: Optional[str] = Field(None, max_length=500, description="封面图片URL")
    category_id: Optional[UUID4] = Field(None, description="所属分类ID")
    is_public: bool = Field(False, description="是否公开")
    is_favorite: bool = Field(False, description="是否收藏")
    sort_order: int = Field(0, description="排序顺序")


class CollectionCreate(CollectionBase):
    """创建错题本"""
    pass


class CollectionUpdate(BaseModel):
    """更新错题本"""
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    cover_image: Optional[str] = Field(None, max_length=500)
    category_id: Optional[UUID4] = None
    is_public: Optional[bool] = None
    is_favorite: Optional[bool] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class CollectionResponse(CollectionBase):
    """错题本响应模型"""
    id: UUID4
    user_id: UUID4
    question_count: int
    total_practiced: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_practiced_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class CollectionWithQuestionsResponse(CollectionResponse):
    """包含题目的错题本响应"""
    questions: List[dict] = []


class AddQuestionsToCollectionRequest(BaseModel):
    """添加题目到错题本请求"""
    question_ids: List[UUID4] = Field(..., description="题目ID列表")


class QuestionInCollectionUpdate(BaseModel):
    """更新错题本中的题目信息"""
    notes: Optional[str] = Field(None, description="笔记")
    mastery_level: Optional[int] = Field(None, ge=0, le=5, description="掌握程度 0-5")


class CollectionStatsResponse(BaseModel):
    """错题本统计响应"""
    total_collections: int = Field(..., description="总错题本数")
    total_questions: int = Field(..., description="总题目数")
    total_practiced: int = Field(..., description="总练习次数")
    by_category: List[dict] = Field(default_factory=list, description="按分类统计")
    recent_collections: List[CollectionResponse] = Field(default_factory=list, description="最近的错题本")

