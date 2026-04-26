KAOYAN_RULES = {
    "examProfile": "kaoyan",
    "questionTypes": [
        {
            "id": "detail",
            "name": "细节理解题",
            "requires": "A sentence or sentence pair with clear factual information.",
            "focus": "定位原文、识别同义替换、避免局部信息误读。",
        },
        {
            "id": "inference",
            "name": "推理判断题",
            "requires": "A claim that supports a careful inference without requiring outside knowledge.",
            "focus": "合理推出，但不能过度推断。",
        },
        {
            "id": "main_idea",
            "name": "主旨大意题",
            "requires": "A paragraph or full article with a clear central point.",
            "focus": "抓住中心，不被局部例子带偏。",
        },
        {
            "id": "attitude",
            "name": "作者态度题",
            "requires": "Evaluative wording, contrast, concession, or stance markers.",
            "focus": "识别作者立场和语气，而不是引用对象的立场。",
        },
        {
            "id": "vocabulary_in_context",
            "name": "词义语境题",
            "requires": "A word or phrase whose meaning depends on context.",
            "focus": "根据上下文判断本句义，不按孤立词义选择。",
        },
    ],
    "distractorStrategies": [
        "concept_swap",
        "scope_expansion",
        "scope_narrowing",
        "possibility_to_certainty",
        "local_to_global",
        "quoted_view_as_author_view",
        "unsupported_claim",
        "logic_relation_error",
    ],
    "explanationOrder": ["定位原文", "同义替换或逻辑关系", "排除干扰项", "命题意图"],
}
