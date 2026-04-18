from typing import TypedDict


class ChatMessage(TypedDict):
    role: str
    content: str


def build_analysis_messages(raw_text: str, title: str | None = None) -> list[ChatMessage]:
    title_line = f"文章标题：{title}" if title else "文章标题：请根据原文生成简洁标题"
    system_prompt = (
        "You are Context Reader's article analysis engine. Return strict JSON only. "
        "Do not wrap the answer in markdown. Do not add commentary outside JSON."
    )
    user_prompt = f"""
{title_line}

请分析下面英文文章，并返回 strict JSON。必须遵守：
- 保留 paragraphs -> sentences 的阅读结构。
- 每个 sentence 必须包含 text、translation、isLongSentence、tokens、phrases。
- token 的 start/end 与 phrase 的 start/end 必须是 sentence.text 内的字符位置。
- tokens 只为可点击的重点词、熟词生义词、词组内单词生成；不要为每个普通单词生成 token。
- 普通重点词 token 必须包含 explanation，并设置 isClickable=true。
- 词组内每个 token 必须设置 phraseId，并设置 isClickable=true。
- 可点击学习点采用中等密度：每 100 个英文词目标提供 6 到 10 个可点击学习点。
- 每个自然段通常提供 4 到 8 个可点击学习点；短段可以少一些，但不要整段只有 1 个可点击点。
- 每个句子通常选择 1 个词组或搭配，再选择 1 个重点词；信息量高的句子可以选择 1 个词组和 2 个重点词。
- 学习点优先级：词组搭配、固定表达、短语动词、学术表达；熟词生义；外刊高频动词、名词、形容词；影响理解的抽象词；主题相关表达。
- 不要为冠词、普通代词、普通介词、非常基础且无语境价值的词生成 token。
- 普通重点词 explanation 的 meaningInSentence 不超过 20 个汉字，note 不超过 24 个汉字。
- 如果 token 属于词组，设置 phraseId，并且 phraseId 必须指向同一句里的 phrases.id。
- 识别词组、熟词生义、长句拆解，但不要编造原文中不存在的词组或解释。
- 只有真正的长句才生成 breakdown；普通句子不要生成 breakdown。
- 解释面向中文学习者，保持简洁，不要写课堂式长篇讲解。
- review 必须包含 keyPhrases、familiarButShiftedWords、longSentences、summary。
- 省略空数组之外的空字段；不要输出 null、空字符串、无内容的 breakdown。
- AI 只在导入文章分析时调用一次；阅读、点击、展开时不得再次调用 AI，因此 JSON 必须足够完整，可直接缓存。

JSON 形状：
{{
  "title": "string",
  "topic": "string",
  "difficulty": "A2|B1|B2|C1|C2",
  "estimatedReadingMinutes": 3,
  "paragraphs": [
    {{
      "id": "p1",
      "order": 1,
      "originalText": "string",
      "sentences": [
        {{
          "id": "s1",
          "order": 1,
          "text": "string",
          "translation": "string",
          "isLongSentence": false,
          "tokens": [],
          "phrases": []
        }}
      ]
    }}
  ],
  "review": {{
    "keyPhrases": [],
    "familiarButShiftedWords": [],
    "longSentences": [],
    "summary": "string"
  }}
}}

英文原文：
{raw_text}
""".strip()
    return [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}]
