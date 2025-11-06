# API 文档

## 概述

Question Generator API 是一个RESTful API，用于管理题目、模板和试卷生成。

## 基础信息

- **基础URL**: `http://localhost:8000/api/v1`
- **认证**: JWT Bearer Token
- **内容类型**: `application/json`

## 端点列表

### 题目管理

#### 获取题目列表
```
GET /questions
```

参数:
- `skip` (int): 跳过的记录数，默认为0
- `limit` (int): 返回的记录数，默认为10
- `category` (str): 题目分类（可选）
- `search` (str): 搜索关键词（可选）

响应:
```json
{
  "total": 100,
  "items": [
    {
      "id": "question_id",
      "content": "题目内容",
      "category": "数学",
      "type": "单选",
      "options": ["A", "B", "C", "D"],
      "answer": "A",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 创建题目
```
POST /questions
```

请求体:
```json
{
  "content": "题目内容",
  "category": "数学",
  "type": "单选",
  "options": ["A", "B", "C", "D"],
  "answer": "A"
}
```

响应: `201 Created`

#### 获取单个题目
```
GET /questions/{question_id}
```

#### 更新题目
```
PUT /questions/{question_id}
```

#### 删除题目
```
DELETE /questions/{question_id}
```

### 模板管理

#### 获取模板列表
```
GET /templates
```

#### 创建模板
```
POST /templates
```

请求体:
```json
{
  "name": "高考数学模板",
  "description": "用于生成高考数学试卷的模板",
  "config": {
    "total_questions": 20,
    "question_types": [
      {"type": "单选", "count": 10},
      {"type": "多选", "count": 5},
      {"type": "填空", "count": 5}
    ]
  }
}
```

### 试卷生成

#### 生成试卷
```
POST /papers/generate
```

请求体:
```json
{
  "template_id": "template_id",
  "title": "2024年高考模拟题",
  "description": "第一次模拟考试"
}
```

响应:
```json
{
  "id": "paper_id",
  "title": "2024年高考模拟题",
  "questions": [...],
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 文件上传

#### 上传文件
```
POST /upload
```

Content-Type: `multipart/form-data`

参数:
- `file` (binary): 上传的文件

响应:
```json
{
  "filename": "document.docx",
  "questions": [
    {
      "content": "提取的题目",
      "type": "单选",
      "options": ["A", "B", "C", "D"]
    }
  ]
}
```

## 错误响应

所有错误响应使用相应的HTTP状态码，并返回以下格式：

```json
{
  "detail": "错误描述信息"
}
```

常见状态码:
- `400` Bad Request: 请求参数错误
- `401` Unauthorized: 未授权
- `403` Forbidden: 禁止访问
- `404` Not Found: 资源不存在
- `500` Internal Server Error: 服务器错误

## 认证

在请求头中包含JWT Token:

```
Authorization: Bearer <token>
```

## 速率限制

API实施速率限制，防止滥用。限制为：
- 每分钟最多60个请求（未认证）
- 每分钟最多200个请求（已认证）

## 示例

### 使用cURL获取题目列表

```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/v1/questions
```

### 使用Python requests上传文件

```python
import requests

headers = {"Authorization": f"Bearer {token}"}
files = {"file": open("questions.docx", "rb")}

response = requests.post(
    "http://localhost:8000/api/v1/upload",
    headers=headers,
    files=files
)

print(response.json())
```

## 更多信息

详细的API文档可以通过 Swagger UI 访问：
http://localhost:8000/docs

或通过 ReDoc 访问：
http://localhost:8000/redoc
