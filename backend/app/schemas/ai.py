"""AI/LLM related Pydantic models."""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field

from app.schemas.question import QuestionOption


class AIQuestionContext(BaseModel):
    """Minimal question context sent to LLM."""

    id: Optional[str] = Field(None, description="Question id (optional)")
    number: Optional[int] = Field(None, description="Question number (optional)")
    question_type: Optional[str] = Field(None, description="Question type")
    content: Union[str, Dict[str, Any]] = Field(..., description="Question content")
    full_content: Optional[str] = Field(None, description="Full content")
    options: List[QuestionOption] = Field(default_factory=list, description="Options for choice questions")


class ReferenceAnswerRequest(BaseModel):
    question: AIQuestionContext
    language: str = Field("zh", description="Output language: zh/en")


class ReferenceAnswerResponse(BaseModel):
    answer: str = Field(..., description="Reference answer")
    explanation: str = Field("", description="Explanation / solution")
    steps: List[str] = Field(default_factory=list, description="Step-by-step solution")
    key_points: List[str] = Field(default_factory=list, description="Key points")


class SimilarQuestionsRequest(BaseModel):
    question: AIQuestionContext
    count: int = Field(2, ge=1, le=5, description="How many similar questions to generate")
    language: str = Field("zh", description="Output language: zh/en")


class SimilarQuestion(BaseModel):
    question_type: str = Field(..., description="Question type")
    content: str = Field(..., description="Question content")
    options: List[QuestionOption] = Field(default_factory=list, description="Options (if any)")
    answer: Optional[str] = Field(None, description="Suggested answer")
    explanation: Optional[str] = Field(None, description="Short explanation")


class SimilarQuestionsResponse(BaseModel):
    questions: List[SimilarQuestion] = Field(default_factory=list, description="Generated similar questions")


class HintRequest(BaseModel):
    """思路提示请求"""
    question: AIQuestionContext
    language: str = Field("zh", description="Output language: zh/en")


class HintResponse(BaseModel):
    """分层思路提示响应"""
    level1_knowledge: List[str] = Field(default_factory=list, description="第1层：考查的知识点")
    level2_approach: List[str] = Field(default_factory=list, description="第2层：解题思路/方向")
    level3_steps: List[str] = Field(default_factory=list, description="第3层：关键步骤提示")
