import json
from typing import Any, TypedDict

from app.ai.kaoyan_rules import KAOYAN_RULES


class ChatMessage(TypedDict):
    role: str
    content: str


def _article_sentence_lines(article: dict[str, Any]) -> list[str]:
    lines: list[str] = []
    for paragraph in article.get("paragraphs", []):
        paragraph_id = paragraph.get("id", "")
        for sentence in paragraph.get("sentences", []):
            sentence_id = sentence.get("id", "")
            text = sentence.get("text", "")
            translation = sentence.get("translation", "")
            lines.append(f"{paragraph_id}/{sentence_id}: {text}\n中文翻译：{translation}")
    return lines


def build_kaoyan_training_messages(article: dict[str, Any]) -> list[ChatMessage]:
    system_prompt = (
        "You are Context Reader's Kaoyan reading question writer. "
        "Act like a 考研阅读命题人. Return strict JSON only. "
        "Do not wrap the answer in markdown. Do not add commentary outside JSON."
    )
    article_lines = "\n\n".join(_article_sentence_lines(article))
    user_prompt = f"""
请根据下面文章生成考研阅读训练题。必须遵守：
- 只生成考研阅读风格题，不生成雅思、托福或四六级题。
- 生成 4 到 5 道四选一题。
- 每题必须有 A/B/C/D 四个选项，且只有一个正确答案。
- 题型只能使用 detail、inference、main_idea、attitude、vocabulary_in_context。
- 每题必须能回到原文证据句；不要生成依赖外部背景知识的题。
- 每个选项都要标注 role：correct_evidence、distractor_evidence 或 unsupported。
- 正确选项必须有 sourceSentenceIds。
- 错误选项如果来自原文误读，填写 sourceSentenceIds；如果原文没有依据，sourceSentenceIds 为空并设置 role=unsupported。
- trapAnalysis 必须解释 B/C/D 或非正确选项为什么错，使用中文。
- explanation 必须按“定位原文 -> 同义替换或逻辑关系 -> 排除干扰项 -> 命题意图”的顺序讲。
- 不要编造句子 ID，只能使用输入中的 sentence id。

考研命题规则：
{json.dumps(KAOYAN_RULES, ensure_ascii=False)}

返回 JSON 形状：
{{
  "questions": [
    {{
      "id": "q1",
      "order": 1,
      "questionType": "detail",
      "testedAbility": "detail_location",
      "stem": "string",
      "options": [
        {{"label": "A", "text": "string", "sourceSentenceIds": ["s1"], "role": "correct_evidence"}},
        {{"label": "B", "text": "string", "sourceSentenceIds": ["s2"], "role": "distractor_evidence"}},
        {{"label": "C", "text": "string", "sourceSentenceIds": [], "role": "unsupported"}},
        {{"label": "D", "text": "string", "sourceSentenceIds": ["s3"], "role": "distractor_evidence"}}
      ],
      "answer": "A",
      "sourceSentenceIds": ["s1"],
      "explanation": "string",
      "trapAnalysis": {{"B": "string", "C": "string", "D": "string"}}
    }}
  ]
}}

文章标题：{article.get("title", "Untitled")}

文章句子：
{article_lines}
""".strip()
    return [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}]
