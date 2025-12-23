# OCR 服务配置指南

本项目使用阿里云通义千问 (Qwen) 的视觉理解模型进行OCR识别和题目解析。

## 获取 DashScope API Key

### 步骤 1: 注册阿里云账号
访问 [阿里云官网](https://www.aliyun.com/) 注册账号（如果已有账号可跳过）

### 步骤 2: 开通 DashScope 服务
1. 访问 [DashScope 控制台](https://dashscope.console.aliyun.com/)
2. 登录后，点击"开通服务"
3. 同意服务条款并开通（免费额度足够测试使用）

### 步骤 3: 创建 API Key
1. 在控制台页面，点击右上角头像 → API-KEY管理
2. 点击"创建新的API-KEY"
3. 复制生成的 API Key（格式类似：`sk-xxxxxxxxxxxxxxxxxxxxxxxx`）

### 步骤 4: 配置到项目中
编辑 `backend/.env` 文件，设置以下变量：

```bash
# Qwen OCR Configuration
DASHSCOPE_API_KEY=sk-your-actual-api-key-here
QWEN_MODEL=qwen-vl-max
```

## 重启服务

配置完成后，需要重启后端服务使配置生效：

```bash
# 如果使用 Docker
docker-compose restart backend

# 如果直接运行
# 停止当前运行的服务（Ctrl+C）
# 然后重新启动
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 验证配置

1. 重启后端服务
2. 访问 http://localhost:8000/docs
3. 尝试调用 `/api/v1/ocr/upload` 接口上传一张包含文字的图片
4. 如果返回识别结果，说明配置成功

## 费用说明

- 通义千问-VL 提供免费额度（每个账号每月有一定调用次数）
- 超出免费额度后按调用次数计费
- 详细价格请查看：https://help.aliyun.com/zh/dashscope/developer-reference/tongyi-qianwen-vl-plus-api

## 常见问题

### Q: 提示 "API Key not found"
A: 检查 `.env` 文件中是否正确设置了 `DASHSCOPE_API_KEY`，并确保重启了服务

### Q: 提示 "Invalid API Key"
A: API Key 格式错误或已过期，请重新创建

### Q: 识别效果不理想
A: 可以尝试：
- 提高图片清晰度
- 确保文字对比度足够
- 调整拍摄角度，避免倾斜

## 备选方案

如果不想使用通义千问服务，项目也支持 PaddleOCR API，配置方式：

```bash
# 在 .env 中配置
PADDLE_OCR_API_URL=your-paddle-ocr-api-url
PADDLE_OCR_API_TOKEN=your-paddle-ocr-token
```

然后修改代码使用 PaddleOCR 服务即可。

