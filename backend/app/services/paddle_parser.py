import re
from typing import Any, Dict, List

QUESTION_RE = re.compile(r"^\s*(\d+)[\.．、]\s*(.*)")
OPTION_RE = re.compile(r"([A-H])[\.．、]\s*(.*?)(?=(?:[A-H][\.．、])|$)", re.IGNORECASE)


def parse_paddle_layout_result(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    将 PaddleOCR 布局分析结果解析为结构化题目 JSON。
    """
    layout_results = (payload or {}).get("layoutParsingResults") or []
    if not layout_results:
        return {"title": None, "questions": [], "images": {}}

    layout = layout_results[0]
    blocks = sorted(
        layout.get("prunedResult", {}).get("parsing_res_list") or [],
        key=lambda block: block.get("block_order", 0),
    )

    title = None
    questions: List[Dict[str, Any]] = []
    current_question: Dict[str, Any] | None = None
    current_parts: List[str] = []

    def flush_question():
        nonlocal current_question, current_parts
        if not current_question:
            return
        content = " ".join(part for part in current_parts if part).strip()
        current_question["content"] = content
        current_question["type"] = _infer_type(content, current_question["options"])
        if current_question["type"] != "multiple_choice":
            current_question["options"] = []
        questions.append(current_question)
        current_question = None
        current_parts = []

    for block in blocks:
        text = block.get("block_content") or ""
        if not text:
            continue

        if block.get("block_label") == "doc_title" and not title:
            title = text.strip()

        for line in _split_lines(text):
            match = QUESTION_RE.match(line)
            if match:
                flush_question()
                current_question = {
                    "number": int(match.group(1)),
                    "type": "essay",
                    "content": "",
                    "options": [],
                }
                if match.group(2):
                    current_parts = [match.group(2).strip()]
                else:
                    current_parts = []
                continue

            if not current_question:
                continue

            inline_options = _extract_options(line)
            if inline_options:
                current_question["options"].extend(inline_options)
                continue

            current_parts.append(line)

    flush_question()

    images = {}
    input_image = layout.get("inputImage")
    if input_image:
        images["input"] = input_image
    for key, url in (layout.get("outputImages") or {}).items():
        if url:
            images[key] = url

    return {"title": title, "questions": questions, "images": images}


def _split_lines(text: str) -> List[str]:
    normalized = text.replace("\u3000", " ").replace("\r", "\n")
    return [line.strip() for line in normalized.split("\n") if line.strip()]


def _extract_options(line: str) -> List[Dict[str, str]]:
    return [
        {"label": match.group(1).upper(), "content": match.group(2).strip()}
        for match in OPTION_RE.finditer(line)
        if match.group(2).strip()
    ]


def _infer_type(content: str, options: List[Dict[str, str]]) -> str:
    if options:
        return "multiple_choice"

    lowered = (content or "").lower()
    if any(token in lowered for token in ["填空", "____", "()", "（ ）"]):
        return "fill_blank"
    if any(token in lowered for token in ["判断", "对错", "正确", "错误", "√", "×"]):
        return "true_false"
    return "essay"
