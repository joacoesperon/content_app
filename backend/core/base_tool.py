from abc import ABC, abstractmethod
from fastapi import APIRouter


class BaseTool(ABC):
    @property
    @abstractmethod
    def id(self) -> str:
        """Unique identifier, e.g. 'static_ads'."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Display name for the UI."""

    @property
    @abstractmethod
    def description(self) -> str:
        """Short description shown in the sidebar/dashboard."""

    @property
    @abstractmethod
    def icon(self) -> str:
        """Icon identifier (emoji or icon name)."""

    @property
    @abstractmethod
    def router(self) -> APIRouter:
        """FastAPI router with all endpoints for this tool."""

    @abstractmethod
    async def health_check(self) -> dict:
        """Return tool readiness status."""
