from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
from uuid import UUID

import logging

from app.database import get_db
from app.models import User, Collection, Category, Question, question_collection
from app.schemas.collection import (
    CategoryCreate, CategoryUpdate, CategoryResponse,
    CollectionCreate, CollectionUpdate, CollectionResponse,
    CollectionWithQuestionsResponse,
    AddQuestionsToCollectionRequest,
    QuestionInCollectionUpdate,
    CollectionStatsResponse
)
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


# ==================== 分类管理 ====================

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    category_type: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户的所有分类"""
    query = db.query(Category).filter(
        Category.user_id == current_user.id,
        Category.is_active == True
    )
    
    if category_type:
        query = query.filter(Category.category_type == category_type)
    
    categories = query.order_by(Category.sort_order, Category.created_at).all()
    return categories


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建新分类"""
    # 检查父级分类是否存在
    if category_data.parent_id:
        parent = db.query(Category).filter(
            Category.id == category_data.parent_id,
            Category.user_id == current_user.id
        ).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="父级分类不存在"
            )
    
    category = Category(
        **category_data.model_dump(),
        user_id=current_user.id
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取单个分类详情"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在"
        )
    
    return category


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新分类"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在"
        )
    
    # 更新字段
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除分类（软删除）"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在"
        )
    
    # 软删除
    category.is_active = False
    db.commit()


# ==================== 错题本管理 ====================

@router.get("/collections", response_model=List[CollectionResponse])
async def get_collections(
    category_id: UUID = None,
    is_favorite: bool = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户的所有错题本"""
    query = db.query(Collection).filter(
        Collection.user_id == current_user.id,
        Collection.is_active == True
    )
    
    if category_id:
        query = query.filter(Collection.category_id == category_id)
    
    if is_favorite is not None:
        query = query.filter(Collection.is_favorite == is_favorite)
    
    collections = query.order_by(
        Collection.sort_order,
        desc(Collection.updated_at)
    ).offset(skip).limit(limit).all()
    
    return collections


@router.post("/collections", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    collection_data: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建新错题本"""
    # 检查分类是否存在
    if collection_data.category_id:
        category = db.query(Category).filter(
            Category.id == collection_data.category_id,
            Category.user_id == current_user.id
        ).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="分类不存在"
            )
    
    collection = Collection(
        **collection_data.model_dump(),
        user_id=current_user.id
    )
    db.add(collection)
    db.commit()
    db.refresh(collection)
    return collection


@router.get("/collections/{collection_id}", response_model=CollectionWithQuestionsResponse)
async def get_collection(
    collection_id: UUID,
    include_questions: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取错题本详情"""
    collection = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.user_id == current_user.id
    ).first()
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="错题本不存在"
        )
    
    result = CollectionWithQuestionsResponse(
        **{k: v for k, v in collection.__dict__.items() if not k.startswith('_')},
        questions=[]
    )
    
    if include_questions:
        # 获取题目列表及相关信息
        questions_data = db.query(
            Question,
            question_collection.c.added_at,
            question_collection.c.notes,
            question_collection.c.mastery_level,
            question_collection.c.times_practiced,
            question_collection.c.last_practiced_at
        ).join(
            question_collection,
            Question.id == question_collection.c.question_id
        ).filter(
            question_collection.c.collection_id == collection_id
        ).all()
        
        result.questions = [
            {
                **q.to_dict(),
                'added_at': added_at.isoformat() if added_at else None,
                'notes': notes,
                'mastery_level': mastery_level,
                'times_practiced': times_practiced,
                'last_practiced_at': last_practiced_at.isoformat() if last_practiced_at else None,
            }
            for q, added_at, notes, mastery_level, times_practiced, last_practiced_at in questions_data
        ]
    
    return result


@router.put("/collections/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: UUID,
    collection_data: CollectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新错题本"""
    collection = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.user_id == current_user.id
    ).first()
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="错题本不存在"
        )
    
    # 更新字段
    update_data = collection_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(collection, field, value)
    
    db.commit()
    db.refresh(collection)
    return collection


@router.delete("/collections/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除错题本（软删除）"""
    collection = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.user_id == current_user.id
    ).first()
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="错题本不存在"
        )
    
    # 软删除
    collection.is_active = False
    db.commit()


# ==================== 错题本题目管理 ====================

@router.post("/collections/{collection_id}/questions", status_code=status.HTTP_201_CREATED)
async def add_questions_to_collection(
    collection_id: UUID,
    request: AddQuestionsToCollectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """添加题目到错题本"""
    collection = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.user_id == current_user.id
    ).first()
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="错题本不存在"
        )
    
    # 验证题目是否存在且属于当前用户
    questions = db.query(Question).filter(
        Question.id.in_(request.question_ids),
        Question.created_by == current_user.id
    ).all()
    
    if len(questions) != len(request.question_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="部分题目不存在或无权访问"
        )
    
    # 添加题目到错题本（避免重复）
    added_count = 0
    for question in questions:
        # 检查是否已存在
        exists = db.execute(
            question_collection.select().where(
                question_collection.c.question_id == question.id,
                question_collection.c.collection_id == collection_id
            )
        ).first()
        
        if not exists:
            db.execute(
                question_collection.insert().values(
                    question_id=question.id,
                    collection_id=collection_id
                )
            )
            added_count += 1
    
    # 更新错题本统计
    collection.question_count = db.execute(
        func.count(question_collection.c.question_id).select().where(
            question_collection.c.collection_id == collection_id
        )
    ).scalar()
    
    db.commit()
    
    return {
        "message": f"成功添加 {added_count} 道题目",
        "added_count": added_count,
        "total_count": collection.question_count
    }


@router.delete("/collections/{collection_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_question_from_collection(
    collection_id: UUID,
    question_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """从错题本中移除题目"""
    collection = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.user_id == current_user.id
    ).first()
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="错题本不存在"
        )
    
    # 删除关联
    result = db.execute(
        question_collection.delete().where(
            question_collection.c.collection_id == collection_id,
            question_collection.c.question_id == question_id
        )
    )
    
    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="题目不在该错题本中"
        )
    
    # 更新错题本统计
    collection.question_count = db.query(func.count(question_collection.c.question_id)).filter(
        question_collection.c.collection_id == collection_id
    ).scalar()
    
    db.commit()


@router.put("/collections/{collection_id}/questions/{question_id}")
async def update_question_in_collection(
    collection_id: UUID,
    question_id: UUID,
    update_data: QuestionInCollectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新错题本中的题目信息（笔记、掌握程度等）"""
    collection = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.user_id == current_user.id
    ).first()
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="错题本不存在"
        )
    
    # 更新关联信息
    update_dict = update_data.model_dump(exclude_unset=True)
    
    if update_dict:
        result = db.execute(
            question_collection.update().where(
                question_collection.c.collection_id == collection_id,
                question_collection.c.question_id == question_id
            ).values(**update_dict)
        )
        
        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="题目不在该错题本中"
            )
        
        db.commit()
    
    return {"message": "更新成功"}


# ==================== 统计信息 ====================

@router.get("/stats", response_model=CollectionStatsResponse)
async def get_collection_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取错题本统计信息"""
    # 总错题本数
    total_collections = db.query(func.count(Collection.id)).filter(
        Collection.user_id == current_user.id,
        Collection.is_active == True
    ).scalar()
    
    # 总题目数
    total_questions = db.query(func.sum(Collection.question_count)).filter(
        Collection.user_id == current_user.id,
        Collection.is_active == True
    ).scalar() or 0
    
    # 总练习次数
    total_practiced = db.query(func.sum(Collection.total_practiced)).filter(
        Collection.user_id == current_user.id,
        Collection.is_active == True
    ).scalar() or 0
    
    # 按分类统计
    by_category = db.query(
        Category.name,
        Category.id,
        func.count(Collection.id).label('collection_count'),
        func.sum(Collection.question_count).label('question_count')
    ).join(
        Collection,
        Collection.category_id == Category.id
    ).filter(
        Category.user_id == current_user.id,
        Category.is_active == True,
        Collection.is_active == True
    ).group_by(Category.id, Category.name).all()
    
    category_stats = [
        {
            'category_id': str(cat_id),
            'category_name': name,
            'collection_count': coll_count,
            'question_count': q_count or 0
        }
        for name, cat_id, coll_count, q_count in by_category
    ]
    
    # 最近的错题本
    recent_collections = db.query(Collection).filter(
        Collection.user_id == current_user.id,
        Collection.is_active == True
    ).order_by(desc(Collection.updated_at)).limit(5).all()
    
    return CollectionStatsResponse(
        total_collections=total_collections,
        total_questions=total_questions,
        total_practiced=total_practiced,
        by_category=category_stats,
        recent_collections=recent_collections
    )


# ==================== 联合视图（题目管理） ====================

@router.get("/collections-with-questions", response_model=List[CollectionWithQuestionsResponse])
async def get_collections_with_questions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return all collections for current user, each including its questions.

    This is optimized for the "Question Management" unified view.
    """
    try:
        collections = db.query(Collection).filter(
            Collection.user_id == current_user.id,
            Collection.is_active == True
        ).order_by(Collection.sort_order, desc(Collection.updated_at)).all()

        results: List[CollectionWithQuestionsResponse] = []
        for collection in collections:
            result = CollectionWithQuestionsResponse(
                **{k: v for k, v in collection.__dict__.items() if not k.startswith('_')},
                questions=[]
            )

            questions_data = db.query(
                Question,
                question_collection.c.added_at,
                question_collection.c.notes,
                question_collection.c.mastery_level,
                question_collection.c.times_practiced,
                question_collection.c.last_practiced_at
            ).join(
                question_collection,
                Question.id == question_collection.c.question_id
            ).filter(
                question_collection.c.collection_id == collection.id
            ).all()

            result.questions = [
                {
                    **q.to_dict(),
                    'added_at': added_at.isoformat() if added_at else None,
                    'notes': notes,
                    'mastery_level': mastery_level,
                    'times_practiced': times_practiced,
                    'last_practiced_at': last_practiced_at.isoformat() if last_practiced_at else None,
                }
                for q, added_at, notes, mastery_level, times_practiced, last_practiced_at in questions_data
            ]

            results.append(result)

        return results

    except Exception as e:
        logger.error(f"Failed to get collections with questions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get collections with questions: {str(e)}"
        )

