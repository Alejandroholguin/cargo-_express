from pydantic import BaseModel

class ShipmentCreate(BaseModel):
    client_name: str
    weight: float
    mode: str

class StatusUpdate(BaseModel):
    status: str