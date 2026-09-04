from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class LLMProvider(ABC):
    name: str

    @abstractmethod
    async def generate_json(self, prompt: str, system_instruction: str) -> Optional[Dict[str, Any]]:
        """
        Executes prompt and returns parsed JSON object, or None if failed.
        """
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        """Returns True if the provider has configured API key."""
        pass
