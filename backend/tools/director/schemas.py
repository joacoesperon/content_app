from pydantic import BaseModel


class DirectorRunRequest(BaseModel):
    prompt: str = ""


class DirectorOutputFile(BaseModel):
    filename: str
    content: str
