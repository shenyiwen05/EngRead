from app.ai.providers.openai_compatible import OpenAICompatibleProvider


class DeepSeekProvider(OpenAICompatibleProvider):
    api_url = "https://api.deepseek.com/chat/completions"
