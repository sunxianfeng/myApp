"""
OCR服务模块 - 用于图片文字识别和题目解析
"""
import easyocr
import cv2
import numpy as np
from typing import List, Dict, Optional, Tuple
import re
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class QuestionOCR:
    """题目OCR识别服务"""
    
    def __init__(self, languages: List[str] = None):
        """
        初始化OCR服务
        
        Args:
            languages: 支持的语言列表，默认支持中文和英文
        """
        self.languages = languages or ['ch_sim', 'en']
        self.reader = None
        self._initialize_reader()
    
    def _initialize_reader(self):
        """初始化OCR读取器"""
        try:
            self.reader = easyocr.Reader(self.languages)
            logger.info(f"OCR reader initialized with languages: {self.languages}")
        except Exception as e:
            logger.error(f"Failed to initialize OCR reader: {e}")
            raise
    
    def extract_text_from_image(self, image_path: str) -> List[Dict]:
        """
        从图片中提取文字
        
        Args:
            image_path: 图片路径
            
        Returns:
            识别结果列表，包含文字、位置和置信度
        """
        try:
            # 预处理图片
            processed_image = self._preprocess_image(image_path)
            
            # OCR识别
            results = self.reader.readtext(processed_image)
            
            # 格式化结果
            formatted_results = []
            for (bbox, text, confidence) in results:
                formatted_results.append({
                    'text': text.strip(),
                    'bbox': bbox,
                    'confidence': confidence,
                    'position': self._get_position_info(bbox)
                })
            
            logger.info(f"Extracted {len(formatted_results)} text regions from image")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Failed to extract text from image {image_path}: {e}")
            raise
    
    def extract_questions(self, image_path: str) -> List[Dict]:
        """
        从图片中识别题目
        
        Args:
            image_path: 图片路径
            
        Returns:
            识别的题目列表
        """
        try:
            # 提取所有文字
            text_results = self.extract_text_from_image(image_path)
            
            # 解析题目结构
            questions = self._parse_questions(text_results)
            
            logger.info(f"Identified {len(questions)} questions from image")
            return questions
            
        except Exception as e:
            logger.error(f"Failed to extract questions from image {image_path}: {e}")
            raise
    
    def _preprocess_image(self, image_path: str) -> np.ndarray:
        """
        预处理图片以提高OCR识别率
        
        Args:
            image_path: 图片路径
            
        Returns:
            预处理后的图片数组
        """
        try:
            # 读取图片
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Cannot read image: {image_path}")
            
            # 转换为灰度图
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # 降噪
            denoised = cv2.fastNlMeansDenoising(gray)
            
            # 二值化处理
            _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            return binary
            
        except Exception as e:
            logger.error(f"Failed to preprocess image {image_path}: {e}")
            # 如果预处理失败，返回原始图片
            return cv2.imread(image_path)
    
    def _get_position_info(self, bbox: List[Tuple]) -> Dict:
        """
        获取文字位置信息
        
        Args:
            bbox: 边界框坐标
            
        Returns:
            位置信息字典
        """
        x_coords = [point[0] for point in bbox]
        y_coords = [point[1] for point in bbox]
        
        return {
            'x_min': min(x_coords),
            'x_max': max(x_coords),
            'y_min': min(y_coords),
            'y_max': max(y_coords),
            'center_x': (min(x_coords) + max(x_coords)) / 2,
            'center_y': (min(y_coords) + max(y_coords)) / 2
        }
    
    def _parse_questions(self, text_results: List[Dict]) -> List[Dict]:
        """
        解析文字结果，识别题目结构
        
        Args:
            text_results: OCR识别结果
            
        Returns:
            解析后的题目列表
        """
        questions = []
        
        # 按Y坐标排序，从上到下
        sorted_results = sorted(text_results, key=lambda x: x['position']['y_min'])
        
        current_question = None
        current_options = []
        
        for result in sorted_results:
            text = result['text']
            
            # 识别题目编号
            question_match = re.match(r'^(\d+)[\.、．]\s*(.+)', text)
            if question_match:
                # 保存上一个题目
                if current_question:
                    current_question['options'] = current_options
                    questions.append(current_question)
                
                # 开始新题目
                current_question = {
                    'number': int(question_match.group(1)),
                    'content': question_match.group(2),
                    'options': [],
                    'type': self._detect_question_type(question_match.group(2))
                }
                current_options = []
                continue
            
            # 识别选项
            option_match = re.match(r'^([A-Z])[\.、．]\s*(.+)', text, re.IGNORECASE)
            if option_match and current_question:
                current_options.append({
                    'label': option_match.group(1).upper(),
                    'content': option_match.group(2)
                })
                continue
            
            # 识别其他题型标记
            if current_question:
                # 判断是否为填空题
                if '____' in text or '()' in text :
                    current_question['type'] = 'fill_blank'
                
                # 判断是否为解答题
                elif any(keyword in text for keyword in ['解：', '答：', '证明：', '计算：']):
                    current_question['type'] = 'essay'
                
                # 添加到题目内容
                if not current_question.get('full_content'):
                    current_question['full_content'] = text
                else:
                    current_question['full_content'] += ' ' + text
        
        # 保存最后一个题目
        if current_question:
            current_question['options'] = current_options
            questions.append(current_question)
        
        return questions
    
    def _detect_question_type(self, content: str) -> str:
        """
        检测题目类型
        
        Args:
            content: 题目内容
            
        Returns:
            题目类型
        """
        content_lower = content.lower()
        
        # 选择题关键词
        choice_keywords = ['选择', '单选', '多选', 'a.', 'b.', 'c.', 'd.']
        if any(keyword in content_lower for keyword in choice_keywords):
            return 'multiple_choice'
        
        # 填空题关键词
        blank_keywords = ['填空', '____', '()', '()']
        if any(keyword in content for keyword in blank_keywords):
            return 'fill_blank'
        
        # 判断题关键词
        judge_keywords = ['判断', '对错', '正确', '错误', '√', '×']
        if any(keyword in content for keyword in judge_keywords):
            return 'true_false'
        
        # 解答题关键词
        essay_keywords = ['解答', '计算', '证明', '简答', '论述']
        if any(keyword in content for keyword in essay_keywords):
            return 'essay'
        
        # 默认为其他类型
        return 'other'
    
    def batch_extract_questions(self, image_paths: List[str]) -> List[Dict]:
        """
        批量处理多张图片
        
        Args:
            image_paths: 图片路径列表
            
        Returns:
            所有图片的题目识别结果
        """
        all_questions = []
        
        for i, image_path in enumerate(image_paths):
            try:
                questions = self.extract_questions(image_path)
                for question in questions:
                    question['source_image'] = image_path
                    question['image_index'] = i
                all_questions.extend(questions)
            except Exception as e:
                logger.error(f"Failed to process image {image_path}: {e}")
                continue
        
        return all_questions


# 全局OCR实例
_ocr_instance = None

def get_ocr_service() -> QuestionOCR:
    """获取OCR服务实例(单例模式)"""
    global _ocr_instance
    if _ocr_instance is None:
        _ocr_instance = QuestionOCR()
    return _ocr_instance
