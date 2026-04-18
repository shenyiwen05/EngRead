from app.ai.providers.openai_compatible import OpenAICompatibleProvider


class QwenProvider(OpenAICompatibleProvider):
    api_url = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
