from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ExamProfile = Literal["kaoyan"]
QuestionType = Literal["detail", "inference", "main_idea", "attitude", "vocabulary_in_context"]
OptionRole = Literal["correct_evidence", "distractor_evidence", "unsupported"]


class TrainingGenerateRequest(BaseModel):
    force_regenerate: bool = Field(default=False, validation_alias="forceRegenerate")


class TrainingOption(BaseModel):
    label: Literal["A", "B", "C", "D"]
    text: str
    source_sentence_ids: list[str] = Field(
        default_factory=list,
        validation_alias="sourceSentenceIds",
        serialization_alias="sourceSentenceIds",
    )
    role: OptionRole


class TrainingQuestion(BaseModel):
    id: str
    order: int
    question_type: QuestionType = Field(validation_alias="questionType", serialization_alias="questionType")
    tested_ability: str = Field(validation_alias="testedAbility", serialization_alias="testedAbility")
    stem: str
    options: list[TrainingOption]
    answer: Literal["A", "B", "C", "D"]
    source_sentence_ids: list[str] = Field(
        validation_alias="sourceSentenceIds",
        serialization_alias="sourceSentenceIds",
    )
    explanation: str
    trap_analysis: dict[str, str] = Field(validation_alias="trapAnalysis", serialization_alias="trapAnalysis")


class TrainingSetResponse(BaseModel):
    id: str
    article_id: str = Field(serialization_alias="articleId")
    exam_profile: ExamProfile = Field(serialization_alias="examProfile")
    question_count: int = Field(serialization_alias="questionCount")
    questions: list[TrainingQuestion]
    created_at: datetime | str = Field(serialization_alias="createdAt")
    updated_at: datetime | str = Field(serialization_alias="updatedAt")
