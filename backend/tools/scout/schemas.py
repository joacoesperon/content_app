from pydantic import BaseModel
from typing import Optional

class ScoutRunRequest(BaseModel):
    prompt: str = "Generá contenido orgánico para Instagram esta semana" 
 
class ScoutOutputFile(BaseModel):
    filename: str
    content: str