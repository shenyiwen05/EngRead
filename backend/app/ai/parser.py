import json
from typing import Any

from app.utils.json_repair import repair_json_text


class AnalysisValidationError(ValueError):
    pass


def parse_ai_analysis(raw_analysis: dict[str, Any] | str) -> dict[str, Any]:
    if isinstance(raw_analysis, str):
        analysis = _parse_json_text(raw_analysis)
    elif isinstance(raw_analysis, dict):
        analysis = dict(raw_analysis)
    else:
        raise AnalysisValidationError("analysis must be a JSON object")

    _normalize_analysis(analysis)
    _validate_analysis(analysis)
    return analysis


def _parse_json_text(raw_text: str) -> dict[str, Any]:
    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        repaired = repair_json_text(raw_text)
        try:
            parsed = json.loads(repaired)
        except json.JSONDecodeError as exc:
            raise AnalysisValidationError("analysis JSON is invalid") from exc

    if not isinstance(parsed, dict):
        raise AnalysisValidationError("analysis must be a JSON object")
    return parsed


def _normalize_analysis(analysis: dict[str, Any]) -> None:
    paragraphs = analysis.get("paragraphs")
    if not isinstance(paragraphs, list):
        return

    for paragraph_index, paragraph in enumerate(paragraphs, start=1):
        if not isinstance(paragraph, dict):
            continue
        paragraph.setdefault("id", f"p{paragraph_index}")
        sentences = paragraph.get("sentences")
        if not isinstance(sentences, list):
            continue

        for sentence_index, sentence in enumerate(sentences, start=1):
            if not isinstance(sentence, dict):
                continue
            sentence.setdefault("id", f"s{paragraph_index}_{sentence_index}")
            _normalize_sentence_items(sentence, paragraph_index, sentence_index)
            _normalize_sentence_breakdown(sentence)
            _repair_sentence_spans(sentence)


def _normalize_sentence_items(sentence: dict[str, Any], paragraph_index: int, sentence_index: int) -> None:
    phrases = sentence.get("phrases")
    if isinstance(phrases, list):
        for phrase_index, phrase in enumerate(phrases, start=1):
            if isinstance(phrase, dict):
                phrase.setdefault("id", f"ph{paragraph_index}_{phrase_index}")
                _normalize_phrase(phrase)

    tokens = sentence.get("tokens")
    if isinstance(tokens, list):
        for token_index, token in enumerate(tokens, start=1):
            if isinstance(token, dict):
                token.setdefault("id", f"t{paragraph_index}_{sentence_index}_{token_index}")
                _normalize_token_explanation(token)
                if token.get("phraseId") or token.get("explanation"):
                    token["isClickable"] = True


def _normalize_phrase(phrase: dict[str, Any]) -> None:
    collocations = phrase.get("collocations")
    if collocations is None:
        return
    if not isinstance(collocations, list):
        phrase.pop("collocations", None)
        return

    phrase["collocations"] = [item for item in collocations if isinstance(item, str)]


def _normalize_token_explanation(token: dict[str, Any]) -> None:
    explanation = token.get("explanation")
    if not isinstance(explanation, dict):
        return

    token_text = token.get("text")
    if isinstance(token_text, str) and token_text:
        explanation.setdefault("word", token_text)

    if not isinstance(explanation.get("commonMeanings"), list):
        explanation["commonMeanings"] = []


def _normalize_sentence_breakdown(sentence: dict[str, Any]) -> None:
    breakdown = sentence.get("breakdown")
    if not isinstance(breakdown, dict):
        return

    for key in ("mainClause", "logic", "explanation"):
        if not isinstance(breakdown.get(key), str):
            breakdown[key] = ""

    modifiers = breakdown.get("modifiers")
    if isinstance(modifiers, list):
        breakdown["modifiers"] = [item for item in modifiers if isinstance(item, str)]
    else:
        breakdown["modifiers"] = []


def _repair_sentence_spans(sentence: dict[str, Any]) -> None:
    text = sentence.get("text")
    if not isinstance(text, str):
        return

    for key in ("phrases", "tokens"):
        items = sentence.get(key)
        if not isinstance(items, list):
            continue
        for item in items:
            if isinstance(item, dict):
                _repair_item_span(item, text)


def _repair_item_span(item: dict[str, Any], sentence_text: str) -> None:
    item_text = item.get("text")
    if not isinstance(item_text, str) or not item_text:
        return

    start = item.get("start")
    end = item.get("end")
    if (
        isinstance(start, int)
        and isinstance(end, int)
        and 0 <= start < end <= len(sentence_text)
        and sentence_text[start:end] == item_text
    ):
        return

    first = sentence_text.find(item_text)
    if first == -1:
        return
    if sentence_text.find(item_text, first + 1) != -1:
        return

    item["start"] = first
    item["end"] = first + len(item_text)


def _validate_analysis(analysis: dict[str, Any]) -> None:
    paragraphs = _required_list(analysis, "paragraphs", "analysis")
    review = _required_dict(analysis, "review", "analysis")
    _required_list(review, "keyPhrases", "review")
    _required_list(review, "familiarButShiftedWords", "review")
    _required_list(review, "longSentences", "review")
    _required_str(review, "summary", "review")

    for paragraph_index, paragraph in enumerate(paragraphs):
        paragraph_path = f"paragraphs[{paragraph_index}]"
        _ensure_dict(paragraph, paragraph_path)
        _required_str(paragraph, "id", paragraph_path)
        _required_list(paragraph, "sentences", paragraph_path)

        for sentence_index, sentence in enumerate(paragraph["sentences"]):
            sentence_path = f"{paragraph_path}.sentences[{sentence_index}]"
            _validate_sentence(sentence, sentence_path)


def _validate_sentence(sentence: Any, sentence_path: str) -> None:
    _ensure_dict(sentence, sentence_path)
    _required_str(sentence, "id", sentence_path)
    text = _required_str(sentence, "text", sentence_path)
    _required_str(sentence, "translation", sentence_path)
    tokens = _required_list(sentence, "tokens", sentence_path)
    phrases = _required_list(sentence, "phrases", sentence_path)

    phrase_ids: set[str] = set()
    for phrase_index, phrase in enumerate(phrases):
        phrase_path = f"{sentence_path}.phrases[{phrase_index}]"
        _ensure_dict(phrase, phrase_path)
        phrase_id = _required_str(phrase, "id", phrase_path)
        phrase_ids.add(phrase_id)
        _validate_span(phrase, text, phrase_path, "phrase")

    for token_index, token in enumerate(tokens):
        token_path = f"{sentence_path}.tokens[{token_index}]"
        _ensure_dict(token, token_path)
        _required_str(token, "id", token_path)
        _required_str(token, "text", token_path)
        _validate_span(token, text, token_path, "token")
        phrase_id = token.get("phraseId")
        if phrase_id is not None and phrase_id not in phrase_ids:
            raise AnalysisValidationError(f"{token_path}.phraseId points to a missing phrase in the same sentence")


def _validate_span(item: dict[str, Any], sentence_text: str, path: str, label: str) -> None:
    start = item.get("start")
    end = item.get("end")
    if not isinstance(start, int) or not isinstance(end, int):
        raise AnalysisValidationError(f"{path} {label} span must use integer start/end")
    if start < 0 or end > len(sentence_text) or start >= end:
        raise AnalysisValidationError(f"{path} {label} span is outside sentence text")


def _required_dict(data: dict[str, Any], key: str, path: str) -> dict[str, Any]:
    value = data.get(key)
    if not isinstance(value, dict):
        raise AnalysisValidationError(f"{path}.{key} is required")
    return value


def _required_list(data: dict[str, Any], key: str, path: str) -> list[Any]:
    value = data.get(key)
    if not isinstance(value, list):
        raise AnalysisValidationError(f"{path}.{key} is required")
    return value


def _required_str(data: dict[str, Any], key: str, path: str) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise AnalysisValidationError(f"{path}.{key} is required")
    return value


def _ensure_dict(value: Any, path: str) -> None:
    if not isinstance(value, dict):
        raise AnalysisValidationError(f"{path} must be an object")
