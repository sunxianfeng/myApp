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

### 1.3 状态管理 - Redux Toolkit
```javascript
// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import questionsSlice from './slices/questionsSlice';
import templatesSlice from './slices/templatesSlice';
import papersSlice from './slices/papersSlice';

export const store = configureStore({
  reducer: {
    questions: questionsSlice,
    templates: templatesSlice,
    papers: papersSlice,
  },
});

// slices/questionsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchQuestions = createAsyncThunk(
  'questions/fetchQuestions',
  async (params) => {
    const response = await api.get('/api/v1/questions', { params });
    return response.data;
  }
);

const questionsSlice = createSlice({
  name: 'questions',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    // 同步reducers
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      });
  },
});
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

### 2.2 数据库配置 - MongoDB + Motor
```python
# database.py
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

class Database:
    client: AsyncIOMotorClient = None
    database = None

    async def connect_to_database(self):
        self.client = AsyncIOMotorClient(settings.DATABASE_URL)
        self.database = self.client[settings.DATABASE_NAME]
        print("Connected to MongoDB")

    async def close_database_connection(self):
        self.client.close()
        print("Disconnected from MongoDB")

    def get_database(self):
        return self.database

db = Database()

# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "question_bank"
    SECRET_KEY: str = "your-secret-key"
    ALLOWED_HOSTS: list = ["http://localhost:3000"]
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB

    class Config:
        env_file = ".env"

settings = Settings()
```

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

### 2.4 文档解析器实现
```python
# services/parser.py
from abc import ABC, abstractmethod
from typing import List
import docx
import pdfplumber
from app.models.question import Question, QuestionType

class DocumentParser(ABC):
    @abstractmethod
    async def parse(self, file_path: str) -> List[Question]:
        pass

class WordParser(DocumentParser):
    async def parse(self, file_path: str) -> List[Question]:
        questions = []
        doc = docx.Document(file_path)
        
        current_question = {}
        for paragraph in doc.paragraphs:
            text = paragraph.text.strip()
            if not text:
                continue
                
            # 识别题目类型
            if self._is_multiple_choice(text):
                question = self._parse_multiple_choice(text)
                questions.append(question)
            elif self._is_fill_blank(text):
                question = self._parse_fill_blank(text)
                questions.append(question)
            # 其他题型识别...
        
        return questions
    
    def _is_multiple_choice(self, text: str) -> bool:
        return any(option in text for option in ['A.', 'B.', 'C.', 'D.'])
    
    def _parse_multiple_choice(self, text: str) -> Question:
        # 解析选择题逻辑
        lines = text.split('\n')
        question_text = lines[0]
        options = []
        answer = ""
        
        for line in lines[1:]:
            if line.startswith(('A.', 'B.', 'C.', 'D.')):
                options.append(line[2:].strip())
            elif line.startswith('答案:'):
                answer = line[3:].strip()
        
        return Question(
            title=question_text,
            type=QuestionType.MULTIPLE_CHOICE,
            options=options,
            answer=answer
        )

class PDFParser(DocumentParser):
    async def parse(self, file_path: str) -> List[Question]:
        questions = []
        
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    # 解析逻辑类似Word解析
                    page_questions = await self._parse_text(text)
                    questions.extend(page_questions)
        
        return questions
    
    async def _parse_text(self, text: str) -> List[Question]:
        # 文本解析逻辑
        pass

class TextParser(DocumentParser):
    async def parse(self, file_path: str) -> List[Question]:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # 解析纯文本格式
        return await self._parse_text(content)

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
