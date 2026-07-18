from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """12-factor config: everything from env, nothing baked into code."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str | None = None
    agent_model: str = "claude-sonnet-4-5"
    llm_stub: bool = False

    @property
    def use_stub(self) -> bool:
        return self.llm_stub or not self.anthropic_api_key


settings = Settings()
