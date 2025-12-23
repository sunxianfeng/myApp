"""
使用阿里通义千问-VL模型进行OCR识别和题目解析
"""
import os
import json
import logging
import re
from typing import List, Dict, Any, Optional
from http import HTTPStatus
import dashscope

from app.config import settings

logger = logging.getLogger(__name__)


class QwenQuestionExtractor:
    """
    使用 通义千问-VL 模型从图片中提取和解析题目。
    """

    def __init__(self, api_key: str = None, model: str = None):
        """
        初始化通义千问题目提取器。

        Args:
            api_key (str, optional): DashScope API 密钥。如果未提供，将从配置中读取。
            model (str, optional): 使用的模型名称，默认从配置读取。
        """
        try:
            self.api_key = api_key or settings.DASHSCOPE_API_KEY
            if not self.api_key:
                raise ValueError(
                    "DashScope API Key not found. Please set the DASHSCOPE_API_KEY in settings."
                )

            dashscope.api_key = self.api_key
            self.model = model or settings.QWEN_MODEL
            logger.info(f"QwenQuestionExtractor initialized successfully with model: {self.model}.")
        except Exception as e:
            logger.error(f"Failed to initialize QwenQuestionExtractor: {e}")
            raise

    def _build_prompt(self) -> str:
        """构建用于指导模型分析试卷的指令 (Prompt)"""
        return """你是一个专业的试卷分析助手。请仔细分析这张试卷图片，并提取出所有的题目。

请遵循以下规则：
1. 识别每个题目的题号、题干内容、所有选项（如果是选择题）以及题目类型。
2. 题目类型应为以下几种之一：'single_choice' (单选题), 'multiple_choice' (多选题), 'fill_blank' (填空题), 'true_false' (判断题), 'essay' (解答题，包括计算、证明等), 'short_answer' (简答题)。
3. 将所有识别出的题目以一个JSON数组的格式返回。不要在JSON代码块前后添加任何额外的解释性文字或注释。
4. 每个JSON对象应包含以下字段：
   - "number": (整数) 题号。
   - "type": (字符串) 题目类型。
   - "content": (字符串) 完整的题干内容，包括所有文字和对图片/图表的描述（例如：'根据右侧电路图回答...'）。
   - "options": (对象数组，仅选择题需要) 如果是选择题，包含所有选项。每个选项对象应有 "label" (如 "A") 和 "content" (选项内容)。如果不是选择题，此字段应为空数组 []。

特别注意：
- 数学符号和公式要保持原样，使用LaTeX格式表示（如 $\\leqslant$, $\\geqslant$, $\\frac{}{}$, $\\infty$ 等）
- 集合符号用 $\\{\\}$ 表示
- 属于符号用 $\\in$ 表示
- 分数用 $\\frac{分子}{分母}$ 表示
- 不等式用 $\\leqslant$ (≤), $\\geqslant$ (≥) 表示
- 分段函数用 $\\begin{cases} ... \\end{cases}$ 表示
- 确保JSON格式正确，可以直接被Python的json.loads解析

示例输出格式：
[
  {
    "number": 1,
    "type": "single_choice",
    "content": "集合$\\{x|-2\\leqslant x\\leqslant 1,x\\in N\\}$表示为（）",
    "options": [
      {"label": "A", "content": "$\\{-2,-1,0,1\\}$"},
      {"label": "B", "content": "$\\{-1,0,1,2\\}$"},
      {"label": "C", "content": "$\\{0,1\\}$"},
      {"label": "D", "content": "$\\{1,2\\}$"}
    ]
  }
]

请确保你的输出是严格的、可以直接被Python的json.loads解析的JSON格式。"""

    def extract_questions(self, image_path: str) -> List[Dict[str, Any]]:
        """
        从单张图片中识别并解析题目。

        Args:
            image_path (str): 图片文件的路径。

        Returns:
            List[Dict]: 解析后的题目列表。每个题目包含：
                - number: 题号
                - type: 题目类型
                - content: 题干内容
                - options: 选项列表（选择题）
                - full_content: 完整内容（与content相同，为了兼容）
                - images: 图片字典（空字典，为了兼容）
        """
        if not os.path.exists(image_path):
            logger.error(f"Image file not found at: {image_path}")
            return []

        # DashScope 需要本地文件路径以 'file://' 开头
        local_file_path = f'file://{os.path.abspath(image_path)}'
        logger.info(f"Processing image: {local_file_path}")

        try:
            prompt = self._build_prompt()
            messages = [{
                'role': 'user',
                'content': [
                    {'image': local_file_path},
                    {'text': prompt}
                ]
            }]

            response = dashscope.MultiModalConversation.call(
                model=self.model,
                messages=messages
            )

            if response.status_code == HTTPStatus.OK:
                # 正确处理content列表
                content_list = response.output.choices[0].message.content

                # 提取所有文本内容并合并
                response_text = ""
                for item in content_list:
                    if isinstance(item, dict) and 'text' in item:
                        response_text += item['text']

                # 清理并解析模型的返回结果
                response_text = response_text.strip()

                # 移除可能的markdown代码块标记
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.startswith("```"):
                    response_text = response_text[3:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]

                response_text = response_text.strip()

                # 尝试解析JSON
                try:
                    questions = json.loads(response_text)
                    
                    # 为每个题目添加兼容字段
                    for question in questions:
                        question.setdefault("full_content", question.get("content", ""))
                        question.setdefault("images", {})
                        question.setdefault("options", [])
                    
                    logger.info(f"Successfully extracted {len(questions)} questions")
                    return questions
                except json.JSONDecodeError as e:
                    logger.error(f"JSON解析失败: {e}")
                    logger.error(f"原始内容: {response_text}")

                    # 尝试修复常见的JSON格式问题
                    fixed_text = re.sub(r'\n\s*', '', response_text)

                    # 修复常见的LaTeX符号转义问题
                    fixed_text = fixed_text.replace('\\\\', '\\')
                    try:
                        questions = json.loads(fixed_text)
                        
                        # 为每个题目添加兼容字段
                        for question in questions:
                            question.setdefault("full_content", question.get("content", ""))
                            question.setdefault("images", {})
                            question.setdefault("options", [])
                        
                        logger.info(f"修复后成功解析 {len(questions)} questions")
                        return questions
                    except json.JSONDecodeError:
                        logger.error(f"修复后仍然无法解析JSON")
                        return []
            else:
                logger.error(
                    f"API call failed for image {image_path}. Status: {response.status_code}, Message: {response.message}"
                )
                return []

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response from Qwen-VL for image {image_path}. Error: {e}")
            # 尝试在日志中记录原始返回，便于调试
            if 'response' in locals() and hasattr(response, 'output'):
                logger.error(f"Raw response was: {response.output.choices[0].message.content}")
            return []
        except Exception as e:
            logger.error(f"An error occurred while processing {image_path}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return []

    def batch_extract_questions(self, image_paths: List[str]) -> List[Dict[str, Any]]:
        """
        批量处理多张图片。

        Args:
            image_paths (List[str]): 图片路径列表。

        Returns:
            List[Dict]: 所有图片识别出的题目列表。
        """
        all_questions: List[Dict[str, Any]] = []
        for index, image_path in enumerate(image_paths):
            try:
                questions = self.extract_questions(image_path)
                for question in questions:
                    question["source_image"] = image_path
                    question["image_index"] = index
                all_questions.extend(questions)
            except Exception as exc:
                logger.error(f"Failed to process image {image_path}: {exc}")
        return all_questions

    def extract_text_from_image(self, image_path: str) -> List[Dict[str, Any]]:
        """
        从图片中提取纯文本内容（为了兼容旧接口）。
        
        Args:
            image_path (str): 图片文件路径。
            
        Returns:
            List[Dict]: 文本区域列表。
        """
        questions = self.extract_questions(image_path)
        
        # 将题目转换为文本区域格式
        text_regions = []
        for question in questions:
            text_regions.append({
                "text": question.get("content", ""),
                "bbox": [],
                "confidence": 0.95,  # Qwen-VL 没有提供置信度，使用默认值
                "position": None
            })
            
            # 如果有选项，也加入文本区域
            for option in question.get("options", []):
                text_regions.append({
                    "text": f"{option.get('label', '')}: {option.get('content', '')}",
                    "bbox": [],
                    "confidence": 0.95,
                    "position": None
                })
        
        return text_regions


# 全局单例
_qwen_ocr_instance: Optional[QwenQuestionExtractor] = None


def get_ocr_service() -> QwenQuestionExtractor:
    """获取 OCR 服务单例"""
    global _qwen_ocr_instance
    if _qwen_ocr_instance is None:
        _qwen_ocr_instance = QwenQuestionExtractor()
    return _qwen_ocr_instance


