import importlib
import pkgutil
from backend.core.base_tool import BaseTool
import backend.tools as tools_pkg


class ToolRegistry:
    def __init__(self):
        self.tools: list[BaseTool] = []

    def discover_tools(self):
        """Auto-discover tool packages under backend/tools/."""
        for _importer, modname, ispkg in pkgutil.iter_modules(tools_pkg.__path__):
            if not ispkg:
                continue
            module = importlib.import_module(f"backend.tools.{modname}")
            if hasattr(module, "tool"):
                tool = module.tool
                if isinstance(tool, BaseTool):
                    self.tools.append(tool)

    async def list_tools(self) -> list[dict]:
        """Return metadata for all registered tools."""
        result = []
        for t in self.tools:
            health = await t.health_check()
            result.append({
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "icon": t.icon,
                "health": health,
            })
        return result
