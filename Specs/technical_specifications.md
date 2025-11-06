# 教学出题App - 技术选型详细说明

## 1. 前端技术栈详细说明

### 1.1 React 18 + TypeScript
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
```

**选择理由：**
- React 18的并发特性提升用户体验
- TypeScript提供类型安全，减少运行时错误
- 生态系统成熟，社区支持良好

### 1.2 Ant Design 5.x
```javascript
// 主题配置示例
import { theme } from 'antd';

const { token } = theme.useToken();

const customTheme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 6,
    wireframe: false,
  },
  components: {
    Button: {
      borderRadius: 4,
    },
    Input: {
      borderRadius: 4,
    },
  },
};
```

**核心组件使用：**
- `Upload`: 文件上传组件
- `Table`: 题目列表展示
- `Form`: 模板编辑表单
- `Modal`: 弹窗交互
- `Progress`: 上传进度显示
- `Spin`: 加载状态

### 1.3 状态管理 - Zustand + TanStack Query（轻量化方案）

> **改进说明**：从Redux Toolkit → Zustand，更轻量、更简洁
> - Bundle Size: 17KB → 2.7KB
> - 学习曲线：陡峭 → 平缓
> - Boilerplate代码：大量 → 最少
> - 数据同步用TanStack Query，更专业

```javascript
// stores/useQuestionStore.js
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export const useQuestionStore = create(
  devtools(
    persist(
      (set) => ({
        // UI状态（不频繁变化的）
        filters: {
          type: null,
          difficulty: null,
          subject: null,
          searchText: ''
        },
        selectedQuestions: [],

        // 动作
        setFilters: (filters) => set({ filters }),
        toggleQuestionSelect: (questionId) => set((state) => ({
          selectedQuestions: state.selectedQuestions.includes(questionId)
            ? state.selectedQuestions.filter(id => id !== questionId)
            : [...state.selectedQuestions, questionId]
        })),
        clearSelection: () => set({ selectedQuestions: [] }),
        resetFilters: () => set({
          filters: {
            type: null,
            difficulty: null,
            subject: null,
            searchText: ''
          }
        }),
      }),
      { name: 'question-store' }  // 持久化到localStorage
    )
  )
);

// stores/useTemplateStore.js
export const useTemplateStore = create((set) => ({
  selectedTemplate: null,
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  clearTemplate: () => set({ selectedTemplate: null }),
}));
```

```javascript
// hooks/useQuestions.js - 服务端状态用TanStack Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useQuestions(filters) {
  return useQuery({
    queryKey: ['questions', filters],
    queryFn: () => api.get('/api/v1/questions', { params: filters }),
    staleTime: 5 * 60 * 1000,  // 5分钟后重新获取
    gcTime: 10 * 60 * 1000,    // 10分钟后清理缓存
  });
}

export function useQuestion(questionId) {
  return useQuery({
    queryKey: ['questions', questionId],
    queryFn: () => api.get(`/api/v1/questions/${questionId}`),
    enabled: !!questionId,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newQuestion) => api.post('/api/v1/questions', newQuestion),
    onSuccess: () => {
      // 更新缓存
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
    onError: (error) => {
      console.error('Failed to create question:', error);
    }
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/api/v1/questions/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['questions', id] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    }
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId) => api.delete(`/api/v1/questions/${questionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    }
  });
}
```

### 1.4 路由管理 - React Router v6
```javascript
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Questions from './pages/Questions';
import Templates from './pages/Templates';
import Papers from './pages/Papers';

function App() {
  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
        <Header />
        <Layout>
          <Sidebar />
          <Layout.Content style={{ padding: '24px' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/papers" element={<Papers />} />
            </Routes>
          </Layout.Content>
        </Layout>
      </Layout>
    </BrowserRouter>
  );
}
```

## 2. 后端技术栈详细说明

### 2.1 FastAPI 核心配置
```python
# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1 import questions, templates, papers, upload
from app.config import settings

app = FastAPI(
    title="教学出题系统API",
    description="智能出题平台后端服务",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件服务
app.mount("/static", StaticFiles(directory="static"), name="static")

# 路由注册
app.include_router(questions.router, prefix="/api/v1/questions", tags=["questions"])
app.include_router(templates.router, prefix="/api/v1/templates", tags=["templates"])
app.include_router(papers.router, prefix="/api/v1/papers", tags=["papers"])
app.include_router(upload.router, prefix="/api/v1/upload", tags=["upload"])
```

### 2.2 数据库配置 - PostgreSQL + Json字段


### 2.3 数据模型设计
```python
# models/question.py
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    FILL_BLANK = "fill_blank"
    SHORT_ANSWER = "short_answer"
    TRUE_FALSE = "true_false"

class Question(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    title: str = Field(..., description="题目内容")
    type: QuestionType = Field(..., description="题目类型")
    options: Optional[List[str]] = Field(None, description="选择题选项")
    answer: str = Field(..., description="正确答案")
    difficulty: Optional[str] = Field("medium", description="难度等级")
    subject: Optional[str] = Field(None, description="学科")
    chapter: Optional[str] = Field(None, description="章节")
    tags: List[str] = Field(default_factory=list, description="标签")
    source_file: Optional[str] = Field(None, description="来源文件")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
```

### 2.4 文档解析器实现 - 分层识别 + 置信度评估（改进版）

> **核心改进**：从简单的正则 → 多模式匹配 + 置信度评估 + 人工反馈学习

```python
# services/parser.py - 改进版本（混合人机协作）
from abc import ABC, abstractmethod
from typing import List, Dict, Tuple
from enum import Enum
import docx
import pdfplumber
import re
from app.models.question import Question, QuestionType
from datetime import datetime
from uuid import UUID

class ConfidenceLevel(str, Enum):
    """置信度等级"""
    HIGH = "high"                      # >= 0.9 自动保存
    MEDIUM = "medium"                  # 0.7-0.9 需审核
    LOW = "low"                        # < 0.7 需审核
    UNRECOGNIZED = "unrecognized"      # 识别失败

class ParsedQuestion(BaseModel):
    """解析后的题目结构（含置信度）"""
    raw_text: str
    title: str
    type: Optional[QuestionType]
    options: Optional[List[str]]
    answer: Optional[str]
    confidence: ConfidenceLevel
    requires_review: bool = False
    parse_notes: List[str] = []

class QuestionMatcher:
    """智能题目类型匹配器 - 多模式规则库"""

    PATTERNS = {
        "multiple_choice": [
            r'^\s*[A-D]\.\s*[^\n]+\n\s*[A-D]\.\s*',  # 标准格式 "A. B. C. D."
            r'([A|B|C|D|a|b|c|d]\s*[\.\）\)]\s*[^\n]+)',  # 竖排格式
            r'(A|B|C|D|a|b|c|d)\s*[\.\）\)].*?(答案|答案:|Answer)',  # 有答案标记
        ],
        "fill_blank": [
            r'_{3,}',  # 下划线
            r'空\s*(1|2|3)',  # 空格标记
            r'\(\s*\)',  # 空括号
            r'\[\s*\]',  # 空方括号
        ],
        "true_false": [
            r'(判断|对错|是非)',
            r'[T|F]\s*[\.\）\)]',
            r'(正确|错误)',
        ],
        "short_answer": [
            r'(简答|简述|说明|分析)',
            r'(\d+)\s*(字|个字|words)',
        ]
    }

    def match_question_type(self, text: str) -> Tuple[str, float]:
        """返回(类型, 置信度) - 更健壮的匹配"""
        scores = {}

        for qtype, patterns in self.PATTERNS.items():
            score = 0
            match_count = 0

            for pattern in patterns:
                if re.search(pattern, text, re.MULTILINE | re.IGNORECASE):
                    score += 1
                    match_count += 1

            if match_count > 0:
                scores[qtype] = score / len(patterns)

        if not scores:
            return None, 0

        best_type = max(scores, key=scores.get)
        return best_type, scores[best_type]

class DocumentParser(ABC):
    """文档解析器基类 - 实现三层识别"""

    def __init__(self):
        self.matcher = QuestionMatcher()

    @abstractmethod
    async def extract_text(self, file_path: str) -> List[str]:
        """第1层：提取原始文本"""
        pass

    async def parse(self, file_path: str) -> Dict[str, List[ParsedQuestion]]:
        """
        完整的三层识别流程
        返回格式：
        {
            "auto_confirmed": [...],  # 置信度高，自动保存
            "needs_review": [...],    # 需要人工审核
            "failed": [...]           # 完全识别失败
        }
        """
        # 第1层：文本提取
        raw_texts = await self.extract_text(file_path)

        # 第2层：初步分类
        classified = await self._classify_questions(raw_texts)

        # 第3层：置信度评估
        evaluated = await self._evaluate_confidence(classified)

        return self._group_by_confidence(evaluated)

    async def _classify_questions(self, texts: List[str]) -> List[ParsedQuestion]:
        """第2层：初步分类题目类型"""
        results = []

        for text in texts:
            parsed = ParsedQuestion(raw_text=text)
            qtype, match_score = self.matcher.match_question_type(text)

            if qtype == "multiple_choice":
                parsed = await self._parse_multiple_choice(text)
            elif qtype == "fill_blank":
                parsed = await self._parse_fill_blank(text)
            elif qtype == "true_false":
                parsed = await self._parse_true_false(text)
            elif qtype == "short_answer":
                parsed = await self._parse_short_answer(text)
            else:
                parsed.type = None
                parsed.requires_review = True
                parsed.parse_notes.append("Unable to match question type")

            results.append(parsed)

        return results

    async def _evaluate_confidence(self, questions: List[ParsedQuestion]) -> List[ParsedQuestion]:
        """第3层：评估置信度并标记是否需要人工审核"""
        for q in questions:
            if q.type is None:
                q.confidence = ConfidenceLevel.UNRECOGNIZED
            else:
                # 综合多个信号计算置信度分数 (0-1)
                score = self._calculate_confidence_score(q)

                if score >= 0.9:
                    q.confidence = ConfidenceLevel.HIGH
                elif score >= 0.7:
                    q.confidence = ConfidenceLevel.MEDIUM
                else:
                    q.confidence = ConfidenceLevel.LOW

                # 中等和低置信度需要人工审核
                if score < 0.9:
                    q.requires_review = True

        return questions

    def _calculate_confidence_score(self, q: ParsedQuestion) -> float:
        """综合计算置信度分数 (0-1)"""
        score = 0.5  # 基础分数

        # 规则库匹配程度 (权重 0.1)
        if self._has_clear_format(q.raw_text):
            score += 0.1

        # 内容完整性 (权重 0.2)
        if q.type == QuestionType.MULTIPLE_CHOICE:
            if q.options and len(q.options) == 4 and q.answer:
                score += 0.2
            elif q.options and q.answer:
                score += 0.1
        elif q.title and q.answer:
            score += 0.2

        # 答案格式规范性 (权重 0.1)
        if self._is_valid_answer(q.answer, q.type):
            score += 0.1

        # 选项数量合理性 (权重 0.1) - 仅选择题
        if q.type == QuestionType.MULTIPLE_CHOICE:
            if 3 <= len(q.options or []) <= 6:
                score += 0.1

        return min(score, 1.0)

    def _group_by_confidence(self, questions: List[ParsedQuestion]) -> Dict:
        """按置信度分组"""
        return {
            "auto_confirmed": [q for q in questions if q.confidence == ConfidenceLevel.HIGH],
            "needs_review": [q for q in questions if q.confidence in [ConfidenceLevel.MEDIUM, ConfidenceLevel.LOW]],
            "failed": [q for q in questions if q.confidence == ConfidenceLevel.UNRECOGNIZED]
        }

    async def _parse_multiple_choice(self, text: str) -> ParsedQuestion:
        """解析选择题"""
        result = ParsedQuestion(
            raw_text=text,
            type=QuestionType.MULTIPLE_CHOICE,
            options=[],
            parse_notes=[]
        )

        lines = [l.strip() for l in text.split('\n') if l.strip()]
        title_lines = []
        options = []

        for i, line in enumerate(lines):
            option_match = re.match(r'^[A-D|a-d]\s*[\.\）\)]\s*(.*)', line)
            if option_match:
                options.append(option_match.group(1))
            elif line.startswith(('答案', '答案:', 'Answer')):
                answer_match = re.search(r'[A-D|a-d]', line)
                if answer_match:
                    result.answer = answer_match.group(0).upper()
            else:
                if not options:  # 还没找到选项时的行是题目
                    title_lines.append(line)

        result.title = " ".join(title_lines) if title_lines else "题目"
        result.options = options

        if len(options) != 4:
            result.parse_notes.append(f"选项数量异常: {len(options)} (期望4个)")

        return result

    async def _parse_fill_blank(self, text: str) -> ParsedQuestion:
        """解析填空题"""
        result = ParsedQuestion(
            raw_text=text,
            type=QuestionType.FILL_BLANK,
            title=text.strip(),
            parse_notes=[]
        )

        # 尝试从答案标记中提取
        answer_match = re.search(r'(?:答案|答|解|Solution)[:\s]*(.+)', text)
        if answer_match:
            result.answer = answer_match.group(1).strip()

        return result

    async def _parse_true_false(self, text: str) -> ParsedQuestion:
        """解析判断题"""
        result = ParsedQuestion(
            raw_text=text,
            type=QuestionType.TRUE_FALSE,
            title=text.strip(),
            parse_notes=[]
        )

        # 提取答案
        answer_match = re.search(r'(正确|错误|对|错|T|F)', text)
        if answer_match:
            answer = answer_match.group(1)
            result.answer = "correct" if answer in ['正确', '对', 'T'] else "incorrect"

        return result

    async def _parse_short_answer(self, text: str) -> ParsedQuestion:
        """解析简答题"""
        result = ParsedQuestion(
            raw_text=text,
            type=QuestionType.SHORT_ANSWER,
            title=text.strip(),
            parse_notes=[]
        )

        # 提取字数要求
        word_match = re.search(r'(\d+)\s*(字|个字|words)', text)
        if word_match:
            result.parse_notes.append(f"字数要求: {word_match.group(1)}")

        return result

    def _has_clear_format(self, text: str) -> bool:
        """检查文本格式是否清晰"""
        return len(text.split('\n')) > 2

    def _is_valid_answer(self, answer: str, qtype: QuestionType) -> bool:
        """检查答案格式是否合规"""
        if not answer:
            return False
        if qtype == QuestionType.MULTIPLE_CHOICE:
            return answer.upper() in ['A', 'B', 'C', 'D']
        if qtype == QuestionType.TRUE_FALSE:
            return answer.lower() in ['correct', 'incorrect', 't', 'f', '对', '错']
        return len(answer) > 0

class WordParser(DocumentParser):
    async def extract_text(self, file_path: str) -> List[str]:
        """Word文档文本提取"""
        doc = docx.Document(file_path)
        texts = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        return texts

class PDFParser(DocumentParser):
    async def extract_text(self, file_path: str) -> List[str]:
        """PDF文档文本提取"""
        texts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    texts.extend([t.strip() for t in text.split('\n') if t.strip()])
        return texts

class TextParser(DocumentParser):
    async def extract_text(self, file_path: str) -> List[str]:
        """纯文本文档提取"""
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        return [t.strip() for t in content.split('\n') if t.strip()]

# 解析器工厂
class ParserFactory:
    @staticmethod
    def get_parser(file_extension: str) -> DocumentParser:
        parsers = {
            '.docx': WordParser(),
            '.pdf': PDFParser(),
            '.txt': TextParser(),
        }
        return parsers.get(file_extension)

# 反馈收集和学习
class ParserFeedbackService:
    """收集用户修正反馈，用来改进算法"""

    async def save_correction(self, original: Question, corrected: Question, user_id: UUID):
        """保存用户的修正"""
        await db.parser_corrections.insert_one({
            "original": original.dict(),
            "corrected": corrected.dict(),
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "is_used_for_training": False
        })

    async def analyze_error_patterns(self, org_id: UUID):
        """分析常见的识别错误模式"""
        errors = await db.parser_corrections.aggregate([
            {"$match": {"org_id": org_id}},
            {"$group": {
                "_id": {
                    "original_type": "$original.type",
                    "corrected_type": "$corrected.type"
                },
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}}
        ]).to_list(None)

        return errors
```

### 2.5 API路由实现
```python
# api/v1/upload.py
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from app.services.parser import ParserFactory
from app.services.question_service import QuestionService
from app.utils.file_handler import save_upload_file

router = APIRouter()

@router.post("/parse")
async def parse_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    # 文件验证
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in ['docx', 'pdf', 'txt']:
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    # 保存文件
    file_path = await save_upload_file(file)
    
    # 异步解析
    parser = ParserFactory.get_parser(f".{file_extension}")
    if not parser:
        raise HTTPException(status_code=400, detail="No parser available")
    
    try:
        questions = await parser.parse(file_path)
        
        # 保存到数据库
        question_service = QuestionService()
        saved_questions = await question_service.create_questions(questions)
        
        return JSONResponse({
            "message": "File parsed successfully",
            "questions_count": len(saved_questions),
            "questions": saved_questions
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parse error: {str(e)}")
```

## 3. 部署配置详细说明

### 3.1 Docker配置
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建非root用户
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 3.2 Docker Compose配置
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://localhost:8000

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - mongodb
      - redis
    environment:
      - DATABASE_URL=mongodb://mongodb:27017
      - DATABASE_NAME=question_bank
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./data/uploads:/app/uploads
      - ./data/generated:/app/generated

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  mongodb_data:
  redis_data:
```

### 3.3 Nginx配置
```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:80;
    }

    # 文件上传大小限制
    client_max_body_size 100M;

    server {
        listen 80;
        server_name localhost;

        # 前端路由
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API路由
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # 超时设置
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # 静态文件
        location /static/ {
            alias /app/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # HTTPS配置 (生产环境)
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # 其他配置同上...
    }
}
```

## 4. 性能优化策略

### 4.1 前端性能优化
```javascript
// 代码分割示例
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Upload = lazy(() => import('./pages/Upload'));

function App() {
  return (
    <Suspense fallback={<Spin size="large" />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </Suspense>
  );
}

// 虚拟滚动组件
import { FixedSizeList as List } from 'react-window';

const QuestionList = ({ questions }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <QuestionCard question={questions[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={questions.length}
      itemSize={120}
    >
      {Row}
    </List>
  );
};
```

### 4.2 后端性能优化
```python
# 缓存装饰器
from functools import wraps
import redis
import json

redis_client = redis.Redis(host='redis', port=6379, db=0)

def cache_result(expire_time=300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # 尝试从缓存获取
            cached_result = redis_client.get(cache_key)
            if cached_result:
                return json.loads(cached_result)
            
            # 执行函数并缓存结果
            result = await func(*args, **kwargs)
            redis_client.setex(
                cache_key, 
                expire_time, 
                json.dumps(result, default=str)
            )
            return result
        return wrapper
    return decorator

# 使用示例
@cache_result(expire_time=600)
async def get_questions_by_type(question_type: str):
    # 数据库查询逻辑
    pass
```

### 4.3 数据库优化
```python
# 索引创建
async def create_indexes():
    db = db.get_database()
    
    # 题目集合索引
    await db.questions.create_index([("type", 1), ("difficulty", 1)])
    await db.questions.create_index([("subject", 1), ("chapter", 1)])
    await db.questions.create_index([("tags", 1)])
    await db.questions.create_index([("created_at", -1)])
    
    # 模板集合索引
    await db.templates.create_index([("created_by", 1)])
    await db.templates.create_index([("created_at", -1)])
    
    # 试卷集合索引
    await db.papers.create_index([("template_id", 1)])
    await db.papers.create_index([("generated_at", -1)])

# 分页查询优化
async def get_questions_paginated(
    page: int = 1, 
    size: int = 20,
    filters: dict = None
):
    skip = (page - 1) * size
    query = filters or {}
    
    db = db.get_database()
    
    # 使用聚合管道优化查询
    pipeline = [
        {"$match": query},
        {"$sort": {"created_at": -1}},
        {"$facet": {
            "data": [{"$skip": skip}, {"$limit": size}],
            "total": [{"$count": "count"}]
        }}
    ]
    
    result = await db.questions.aggregate(pipeline).to_list(length=1)
    
    return {
        "data": result[0]["data"],
        "total": result[0]["total"][0]["count"] if result[0]["total"] else 0,
        "page": page,
        "size": size
    }
```

## 5. 安全措施

### 5.1 文件上传安全
```python
# utils/file_handler.py
import os
import uuid
from fastapi import UploadFile, HTTPException
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'docx', 'pdf', 'txt'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def validate_file(file: UploadFile):
    # 检查文件扩展名
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    extension = file.filename.split('.')[-1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type {extension} not allowed"
        )
    
    # 检查文件大小
    if file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail="File too large"
        )

async def save_upload_file(file: UploadFile) -> str:
    validate_file(file)
    
    # 生成安全的文件名
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4()}_{filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    # 保存文件
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    return file_path
```

### 5.2 API安全
```python
# middleware/security.py
from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = security):
    try:
        payload = jwt.decode(
            credentials.credentials, 
            settings.SECRET_KEY, 
            algorithms=["HS256"]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# 限流中间件
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/v1/questions")
@limiter.limit("100/minute")
async def get_questions(request: Request):
    pass
```

这个技术选型文档为您提供了详细的技术实现指导，包含了具体的代码示例和配置文件，可以直接用于项目开发。
