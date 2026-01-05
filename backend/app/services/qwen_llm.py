"""Qwen (DashScope) text generation service.

Implements:
- Reference answer generation
- Similar questions generation

Designed to be called from FastAPI endpoints; call sites can offload to a thread.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from http import HTTPStatus
from typing import Any, Dict, List, Optional, Tuple

import dashscope

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class ReferenceAnswerResult:
    answer: str
    explanation: str = ""
    steps: List[str] = None
    key_points: List[str] = None


@dataclass
class SimilarQuestionResult:
    question_type: str
    content: str
    options: List[Dict[str, str]]
    answer: Optional[str] = None
    explanation: Optional[str] = None


class QwenTextService:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "DASHSCOPE_API_KEY", None)
        if not self.api_key:
            raise ValueError("DashScope API key missing: set DASHSCOPE_API_KEY")

        dashscope.api_key = self.api_key
        # Prefer explicit parameter, then QWEN_TEXT_MODEL, then QWEN_MODEL (VL),
        # finally fall back to a safe default 'qwen-vl-max'.
        self.model = (
            model
            or getattr(settings, "QWEN_TEXT_MODEL", None)
            or getattr(settings, "QWEN_MODEL", None)
            or "qwen-vl-max"
        )

        logger.info("QwenTextService initialized with model=%s", self.model)

    def _strip_code_fences(self, text: str) -> str:
        t = text.strip()
        if t.startswith("```"):
            # remove first line fence
            t = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", t)
        if t.endswith("```"):
            t = t[: -3]
        return t.strip()

    def _try_parse_json(self, text: str) -> Any:
        """Best-effort JSON extraction from LLM output."""
        raw = self._strip_code_fences(text)

        # Direct parse
        try:
            return json.loads(raw)
        except Exception:
            pass

        # Try extract first JSON object/array substring
        candidates: List[str] = []
        first_obj = raw.find("{")
        last_obj = raw.rfind("}")
        if first_obj != -1 and last_obj != -1 and last_obj > first_obj:
            candidates.append(raw[first_obj : last_obj + 1])

        first_arr = raw.find("[")
        last_arr = raw.rfind("]")
        if first_arr != -1 and last_arr != -1 and last_arr > first_arr:
            candidates.append(raw[first_arr : last_arr + 1])

        # Common escaping issues (LaTeX backslashes)
        candidates.append(raw.replace("\\\\", "\\"))

        for c in candidates:
            try:
                return json.loads(c)
            except Exception:
                continue

        raise json.JSONDecodeError("Unable to parse JSON from model output", raw, 0)

    def _extract_text_from_response(self, response: Any) -> str:
        """Support multiple dashscope SDK response shapes."""
        # qwen_ocr uses: response.output.choices[0].message.content -> list[dict]
        try:
            choices = response.output.choices
            msg = choices[0].message
            content = msg.content
            # Some APIs return string; some return list of segments
            if isinstance(content, str):
                return content
            if isinstance(content, list):
                parts = []
                for item in content:
                    if isinstance(item, dict) and "text" in item:
                        parts.append(item["text"])
                    elif isinstance(item, str):
                        parts.append(item)
                return "".join(parts)
        except Exception:
            pass

        # Generation API may return: response.output.text
        try:
            return str(response.output.text)
        except Exception:
            pass

        # Fallback
        return str(response)

    def _call_llm(self, prompt: str) -> str:
        """Call DashScope text model and return raw text output."""
        # Prefer chat-style messages if supported
        response = None
        try:
            response = dashscope.Generation.call(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                result_format="message",
            )
        except TypeError:
            # Older SDK signature
            response = dashscope.Generation.call(model=self.model, prompt=prompt)

        if getattr(response, "status_code", None) != HTTPStatus.OK:
            status_code = getattr(response, "status_code", None)
            message = getattr(response, "message", "")
            raise RuntimeError(f"DashScope call failed: status={status_code}, message={message}")

        return self._extract_text_from_response(response).strip()

    def _format_question_payload(self, question: Dict[str, Any]) -> str:
        """Normalize question payload for prompt."""
        q = dict(question)

        # Ensure content is text
        content = q.get("content")
        if isinstance(content, dict):
            # common shapes: {text: ...}
            q["content"] = content.get("text") or json.dumps(content, ensure_ascii=False)

        # options: [{label, content}] or other
        options = q.get("options") or []
        norm_options: List[Dict[str, str]] = []
        if isinstance(options, list):
            for item in options:
                if isinstance(item, dict):
                    label = str(item.get("label") or item.get("key") or "").strip()
                    text = str(item.get("content") or item.get("text") or "").strip()
                    if label or text:
                        norm_options.append({"label": label, "content": text})
                else:
                    norm_options.append({"label": "", "content": str(item)})
        q["options"] = norm_options

        return json.dumps(q, ensure_ascii=False)

    def _build_reference_answer_prompt(self, question: Dict[str, Any], language: str) -> str:
        q_json = self._format_question_payload(question)
        return (
            "你是一名严谨的解题老师。现在给你一条题目 JSON，请生成‘参考答案’。\n"
            "要求：\n"
            "1) 只输出严格 JSON（不要 Markdown，不要代码块，不要额外解释）。\n"
            "2) 用" + ("中文" if language == "zh" else "英文") + "作答。\n"
            "3) 保持数学公式为 LaTeX（例如 $\\frac{a}{b}$），不要把反斜杠转义坏。\n"
            "4) 若是选择题：answer 输出选项字母（单选如 \"A\"，多选如 \"AC\"），explanation 给出理由。\n"
            "5) 若题干信息不足，说明缺失信息并给出可能的解法思路。\n\n"
            "输入题目 JSON：\n"
            f"{q_json}\n\n"
            "输出 JSON schema：\n"
            "{\n"
            "  \"answer\": string,\n"
            "  \"explanation\": string,\n"
            "  \"steps\": string[],\n"
            "  \"key_points\": string[]\n"
            "}"
        )

    def _build_similar_questions_prompt(self, question: Dict[str, Any], count: int, language: str) -> str:
        q_json = self._format_question_payload(question)
        return (
            "你是一名出题老师。现在给你一条题目 JSON，请生成 "
            f"{count} 道‘举一反三’相似题。\n"
            "相似要求：考查同一知识点/同类方法，但题目数字/情境要变化，不能照抄原题。\n"
            "输出要求：\n"
            "1) 只输出严格 JSON 数组（不要 Markdown，不要代码块，不要额外解释）。\n"
            "2) 用" + ("中文" if language == "zh" else "英文") + "输出。\n"
            "3) 每道题输出字段：question_type, content, options(若是选择题), answer, explanation。\n"
            "4) options 必须是对象数组：[{label: \"A\", content: \"...\"}, ...]；非选择题输出 []。\n"
            "5) answer 给出参考答案，explanation 给 1-3 句简要解析。\n\n"
            "输入题目 JSON：\n"
            f"{q_json}\n\n"
            "输出 JSON schema：\n"
            "[\n"
            "  {\n"
            "    \"question_type\": string,\n"
            "    \"content\": string,\n"
            "    \"options\": {\"label\": string, \"content\": string}[],\n"
            "    \"answer\": string,\n"
            "    \"explanation\": string\n"
            "  }\n"
            "]"
        )

    def generate_reference_answer(self, question: Dict[str, Any], language: str = "zh") -> ReferenceAnswerResult:
        prompt = self._build_reference_answer_prompt(question=question, language=language)
        text = self._call_llm(prompt)
        data = self._try_parse_json(text)

        if not isinstance(data, dict):
            raise ValueError("Model output is not a JSON object")

        answer = str(data.get("answer") or "").strip()
        if not answer:
            raise ValueError("Missing answer in model output")

        explanation = str(data.get("explanation") or "").strip()
        steps = data.get("steps")
        if not isinstance(steps, list):
            steps = []
        steps = [str(s) for s in steps]

        key_points = data.get("key_points")
        if not isinstance(key_points, list):
            key_points = []
        key_points = [str(s) for s in key_points]

        return ReferenceAnswerResult(answer=answer, explanation=explanation, steps=steps, key_points=key_points)

    def generate_similar_questions(
        self,
        question: Dict[str, Any],
        count: int = 2,
        language: str = "zh",
    ) -> List[SimilarQuestionResult]:
        prompt = self._build_similar_questions_prompt(question=question, count=count, language=language)
        text = self._call_llm(prompt)
        data = self._try_parse_json(text)

        if not isinstance(data, list):
            raise ValueError("Model output is not a JSON array")

        results: List[SimilarQuestionResult] = []
        for item in data:
            if not isinstance(item, dict):
                continue

            qtype = str(item.get("question_type") or item.get("type") or "other").strip() or "other"
            content = str(item.get("content") or "").strip()
            if not content:
                continue

            options = item.get("options") or []
            norm_options: List[Dict[str, str]] = []
            if isinstance(options, list):
                for opt in options:
                    if isinstance(opt, dict):
                        label = str(opt.get("label") or "").strip()
                        opt_content = str(opt.get("content") or opt.get("text") or "").strip()
                        if label or opt_content:
                            norm_options.append({"label": label, "content": opt_content})
                    else:
                        norm_options.append({"label": "", "content": str(opt)})

            results.append(
                SimilarQuestionResult(
                    question_type=qtype,
                    content=content,
                    options=norm_options,
                    answer=str(item.get("answer") or "").strip() or None,
                    explanation=str(item.get("explanation") or "").strip() or None,
                )
            )

        return results


_qwen_text_service: Optional[QwenTextService] = None


def get_qwen_text_service() -> QwenTextService:
    global _qwen_text_service
    if _qwen_text_service is None:
        _qwen_text_service = QwenTextService()
    return _qwen_text_service
