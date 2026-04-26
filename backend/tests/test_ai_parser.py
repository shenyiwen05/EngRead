import json

import pytest

from app.ai.parser import AnalysisValidationError, parse_ai_analysis


def valid_analysis_payload():
    sentence_text = "Small firms come under pressure."
    return {
        "title": "Small Firms",
        "topic": "Business",
        "difficulty": "B2",
        "estimatedReadingMinutes": 2,
        "paragraphs": [
            {
                "id": "p1",
                "order": 1,
                "originalText": sentence_text,
                "sentences": [
                    {
                        "id": "s1",
                        "order": 1,
                        "text": sentence_text,
                        "translation": "小公司承压。",
                        "isLongSentence": False,
                        "tokens": [
                            {"id": "t1", "text": "Small", "start": 0, "end": 5, "isClickable": False},
                            {"id": "t2", "text": "come", "start": 12, "end": 16, "phraseId": "ph1", "isClickable": True},
                            {"id": "t3", "text": "under", "start": 17, "end": 22, "phraseId": "ph1", "isClickable": True},
                            {"id": "t4", "text": "pressure", "start": 23, "end": 31, "phraseId": "ph1", "isClickable": True},
                        ],
                        "phrases": [
                            {
                                "id": "ph1",
                                "text": "come under pressure",
                                "start": 12,
                                "end": 31,
                                "type": "academic_expression",
                                "meaningInSentence": "承受压力",
                            }
                        ],
                    }
                ],
            }
        ],
        "review": {
            "keyPhrases": [],
            "familiarButShiftedWords": [],
            "longSentences": [],
            "summary": "Small firms are under pressure.",
        },
    }


def test_parse_ai_analysis_accepts_valid_payload():
    parsed = parse_ai_analysis(valid_analysis_payload())

    assert parsed["title"] == "Small Firms"
    assert parsed["paragraphs"][0]["sentences"][0]["tokens"][1]["phraseId"] == "ph1"
    assert parsed["review"]["summary"] == "Small firms are under pressure."


def test_parse_ai_analysis_repairs_fenced_json_with_trailing_commas():
    raw_json = json.dumps(valid_analysis_payload(), ensure_ascii=False)
    damaged = raw_json.replace('"summary": "Small firms are under pressure."', '"summary": "Small firms are under pressure.",')

    parsed = parse_ai_analysis(f"```json\n{damaged}\n```")

    assert parsed["paragraphs"][0]["sentences"][0]["phrases"][0]["text"] == "come under pressure"


def test_parse_ai_analysis_rejects_phrase_id_outside_same_sentence():
    payload = valid_analysis_payload()
    payload["paragraphs"][0]["sentences"][0]["tokens"][1]["phraseId"] = "missing_phrase"

    with pytest.raises(AnalysisValidationError, match="phraseId"):
        parse_ai_analysis(payload)


def test_parse_ai_analysis_rejects_token_span_outside_sentence():
    payload = valid_analysis_payload()
    payload["paragraphs"][0]["sentences"][0]["tokens"][0]["text"] = "Missing"
    payload["paragraphs"][0]["sentences"][0]["tokens"][0]["end"] = 999

    with pytest.raises(AnalysisValidationError, match="token.*span"):
        parse_ai_analysis(payload)


def test_parse_ai_analysis_rejects_phrase_span_outside_sentence():
    payload = valid_analysis_payload()
    payload["paragraphs"][0]["sentences"][0]["phrases"][0]["text"] = "missing phrase"
    payload["paragraphs"][0]["sentences"][0]["phrases"][0]["start"] = -1

    with pytest.raises(AnalysisValidationError, match="phrase.*span"):
        parse_ai_analysis(payload)


def test_parse_ai_analysis_fills_missing_stable_ids_for_model_output():
    payload = valid_analysis_payload()
    sentence = payload["paragraphs"][0]["sentences"][0]
    del sentence["tokens"][0]["id"]
    del sentence["phrases"][0]["id"]
    sentence["tokens"][1]["phraseId"] = "ph1_1"
    sentence["tokens"][2]["phraseId"] = "ph1_1"
    sentence["tokens"][3]["phraseId"] = "ph1_1"

    parsed = parse_ai_analysis(payload)
    parsed_sentence = parsed["paragraphs"][0]["sentences"][0]

    assert parsed_sentence["tokens"][0]["id"] == "t1_1_1"
    assert parsed_sentence["phrases"][0]["id"] == "ph1_1"


def test_parse_ai_analysis_repairs_bad_span_when_text_is_unique():
    payload = valid_analysis_payload()
    token = payload["paragraphs"][0]["sentences"][0]["tokens"][1]
    phrase = payload["paragraphs"][0]["sentences"][0]["phrases"][0]
    token["start"] = 999
    token["end"] = 1003
    phrase["start"] = 999
    phrase["end"] = 1018

    parsed = parse_ai_analysis(payload)
    sentence = parsed["paragraphs"][0]["sentences"][0]

    assert sentence["tokens"][1]["start"] == 12
    assert sentence["tokens"][1]["end"] == 16
    assert sentence["phrases"][0]["start"] == 12
    assert sentence["phrases"][0]["end"] == 31


def test_parse_ai_analysis_repairs_shifted_span_when_text_is_unique():
    payload = valid_analysis_payload()
    token = payload["paragraphs"][0]["sentences"][0]["tokens"][1]
    token["start"] = 13
    token["end"] = 17

    parsed = parse_ai_analysis(payload)
    parsed_token = parsed["paragraphs"][0]["sentences"][0]["tokens"][1]

    assert parsed_token["start"] == 12
    assert parsed_token["end"] == 16


def test_parse_ai_analysis_marks_explainable_tokens_clickable():
    payload = valid_analysis_payload()
    sentence = payload["paragraphs"][0]["sentences"][0]
    sentence["tokens"][1].pop("isClickable", None)
    sentence["tokens"][2].pop("isClickable", None)
    sentence["tokens"][3].pop("isClickable", None)
    sentence["tokens"][0]["explanation"] = {
        "word": "Small",
        "meaningInSentence": "小型的",
        "commonMeanings": ["小的"],
    }
    sentence["tokens"][0].pop("isClickable", None)

    parsed = parse_ai_analysis(payload)
    tokens = parsed["paragraphs"][0]["sentences"][0]["tokens"]

    assert tokens[0]["isClickable"] is True
    assert tokens[1]["isClickable"] is True
    assert tokens[2]["isClickable"] is True
    assert tokens[3]["isClickable"] is True


def test_parse_ai_analysis_fills_word_explanation_defaults_from_token_text():
    payload = valid_analysis_payload()
    sentence = payload["paragraphs"][0]["sentences"][0]
    sentence["tokens"][0]["explanation"] = {
        "meaningInSentence": "小型的",
        "note": "修饰企业规模。",
    }

    parsed = parse_ai_analysis(payload)
    explanation = parsed["paragraphs"][0]["sentences"][0]["tokens"][0]["explanation"]

    assert explanation["word"] == "Small"
    assert explanation["commonMeanings"] == []
    assert parsed["paragraphs"][0]["sentences"][0]["tokens"][0]["isClickable"] is True


def test_parse_ai_analysis_fills_breakdown_defaults_for_partial_model_output():
    payload = valid_analysis_payload()
    sentence = payload["paragraphs"][0]["sentences"][0]
    sentence["isLongSentence"] = True
    sentence["breakdown"] = {
        "mainClause": "Small firms come under pressure",
        "logic": "先给主体，再说明压力。",
    }

    parsed = parse_ai_analysis(payload)
    breakdown = parsed["paragraphs"][0]["sentences"][0]["breakdown"]

    assert breakdown["mainClause"] == "Small firms come under pressure"
    assert breakdown["modifiers"] == []
    assert breakdown["logic"] == "先给主体，再说明压力。"
    assert breakdown["explanation"] == ""


def test_parse_ai_analysis_fills_phrase_meaning_from_common_meaning():
    payload = valid_analysis_payload()
    phrase = payload["paragraphs"][0]["sentences"][0]["phrases"][0]
    phrase.pop("meaningInSentence")
    phrase["commonMeaning"] = "承受压力"

    parsed = parse_ai_analysis(payload)
    parsed_phrase = parsed["paragraphs"][0]["sentences"][0]["phrases"][0]

    assert parsed_phrase["meaningInSentence"] == "承受压力"


def test_parse_ai_analysis_drops_breakdown_without_substantive_content():
    payload = valid_analysis_payload()
    sentence = payload["paragraphs"][0]["sentences"][0]
    sentence["isLongSentence"] = True
    sentence["breakdown"] = {
        "mainClause": "Small firms come under pressure",
        "logic": "",
        "explanation": "",
        "modifiers": [],
    }

    parsed = parse_ai_analysis(payload)

    assert "breakdown" not in parsed["paragraphs"][0]["sentences"][0]


def test_parse_ai_analysis_drops_non_array_phrase_collocations():
    payload = valid_analysis_payload()
    phrase = payload["paragraphs"][0]["sentences"][0]["phrases"][0]
    phrase["collocations"] = "come under pressure from markets"

    parsed = parse_ai_analysis(payload)

    assert "collocations" not in parsed["paragraphs"][0]["sentences"][0]["phrases"][0]
