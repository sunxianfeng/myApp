"""
OCR服务模块 - 调用 PaddleOCR 布局解析 API 并输出结构化题目信息
"""
import base64
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

from app.config import settings
from app.services.paddle_parser import parse_paddle_layout_result

import logging

logger = logging.getLogger(__name__)


class PaddleOCRClient:
    """负责与远端 PaddleOCR 布局解析 API 交互"""

    def __init__(
        self,
        api_url: Optional[str] = None,
        token: Optional[str] = None,
        file_type: Optional[int] = None,
        timeout: Optional[int] = None,
    ):
        self.api_url = api_url or settings.PADDLE_OCR_API_URL
        self.token = token or settings.PADDLE_OCR_API_TOKEN
        self.file_type = file_type if file_type is not None else settings.PADDLE_OCR_FILE_TYPE
        self.timeout = timeout or settings.PADDLE_OCR_TIMEOUT

        if not self.api_url or not self.token:
            raise ValueError("PaddleOCR API configuration is missing.")

    def analyze_layout(self, image_path: str) -> Dict[str, Any]:
        """上传图片至 PaddleOCR 布局解析接口并返回原始结果"""
        encoded_file = self._encode_file(image_path)
        payload = {
            "file": encoded_file,
            "fileType": self.file_type,
            "useDocOrientationClassify": False,
            "useDocUnwarping": False,
            "useTextlineOrientation": False,
            "useChartRecognition": False,
        }
        headers = {
            "Authorization": f"token {self.token}",
            "Content-Type": "application/json",
        }

        request_started = time.time()
        try:
            response = requests.post(
                self.api_url,
                json=payload,
                headers=headers,
                timeout=self.timeout,
            )
            response.raise_for_status()
            payload = response.json()
        except requests.RequestException as exc:
            logger.error("PaddleOCR request failed: %s", exc)
            raise

        logger.info(
            "PaddleOCR request completed in %.2f seconds", time.time() - request_started
        )

        result = payload.get("result")
        if not result:
            raise ValueError("PaddleOCR response missing 'result' field")

        return result

    def _encode_file(self, image_path: str) -> str:
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Image file not found: {image_path}")
        return base64.b64encode(path.read_bytes()).decode("ascii")


class QuestionOCR:
    """封装 OCR 客户端并输出题目 JSON"""

    def __init__(self, client: Optional[PaddleOCRClient] = None):
        self.client = client or PaddleOCRClient()

    def extract_text_from_image(self, image_path: str) -> List[Dict[str, Any]]:
        """返回 OCR 输出的所有文本块"""
        response = self.client.analyze_layout(image_path)
        return self._format_text_regions(response)

    def extract_questions(self, image_path: str) -> List[Dict[str, Any]]:
        """直接返回结构化题目数组"""
        response = self.client.analyze_layout(image_path)
        parsed = parse_paddle_layout_result(response)
        images = parsed.get("images") or {}
        questions = parsed.get("questions") or []

        for question in questions:
            question["images"] = images
            question.setdefault("full_content", question.get("content", ""))
            question.setdefault("options", [])

        logger.info("Identified %d questions from image", len(questions))
        return questions

    def batch_extract_questions(self, image_paths: List[str]) -> List[Dict[str, Any]]:
        """批量处理多张图片"""
        all_questions: List[Dict[str, Any]] = []
        for index, image_path in enumerate(image_paths):
            try:
                questions = self.extract_questions(image_path)
                for question in questions:
                    question["source_image"] = image_path
                    question["image_index"] = index
                all_questions.extend(questions)
            except Exception as exc:
                logger.error("Failed to process image %s: %s", image_path, exc)
        return all_questions

    def _format_text_regions(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        layout_results = payload.get("layoutParsingResults") or []
        if not layout_results:
            return []

        ocr_data = layout_results[0].get("overall_ocr_res") or {}
        texts = ocr_data.get("rec_texts") or []
        boxes = ocr_data.get("rec_boxes") or []
        scores = ocr_data.get("rec_scores") or []

        formatted = []
        for idx, text in enumerate(texts):
            bbox = boxes[idx] if idx < len(boxes) else []
            formatted.append(
                {
                    "text": text.strip(),
                    "bbox": bbox,
                    "confidence": scores[idx] if idx < len(scores) else None,
                    "position": self._convert_bbox_to_position(bbox),
                }
            )
        return formatted

    @staticmethod
    def _convert_bbox_to_position(bbox: List[List[float]]) -> Optional[Dict[str, float]]:
        if not bbox:
            return None

        try:
            x_coords = [point[0] for point in bbox]
            y_coords = [point[1] for point in bbox]
        except (TypeError, IndexError):
            return None

        x_min, x_max = min(x_coords), max(x_coords)
        y_min, y_max = min(y_coords), max(y_coords)
        return {
            "x_min": x_min,
            "x_max": x_max,
            "y_min": y_min,
            "y_max": y_max,
            "center_x": (x_min + x_max) / 2,
            "center_y": (y_min + y_max) / 2,
        }


_ocr_instance: Optional[QuestionOCR] = None


def get_ocr_service() -> QuestionOCR:
    """获取 OCR 服务单例"""
    global _ocr_instance
    if _ocr_instance is None:
        _ocr_instance = QuestionOCR()
    return _ocr_instance
