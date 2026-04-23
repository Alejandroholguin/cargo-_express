import os, shutil, random, string
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, auth, schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

if not os.path.exists("uploads"): os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.post("/api/register")
def register(user_data: dict, db: Session = Depends(get_db)):
    new_user = models.User(email=user_data['email'], hashed_password=auth.hash_password(user_data['password']))
    db.add(new_user)
    db.commit()
    return {"msg": "Usuario creado"}

@app.post("/api/login")
def login(user_data: dict, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data['email']).first()
    if not user or not auth.verify_password(user_data['password'], user.hashed_password):
        raise HTTPException(401, "Error")
    return {"access_token": auth.create_access_token({"sub": user.email})}

@app.get("/api/track/{tracking}")
def track(tracking: str, db: Session = Depends(get_db)):
    s = db.query(models.Shipment).filter(models.Shipment.tracking_number == tracking).first()
    return s if s else {"tracking": tracking, "status": "En tránsito (Externo)"}

@app.post("/api/shipments")
def create_s(s_in: schemas.ShipmentCreate, db: Session = Depends(get_db), u=Depends(auth.get_current_user)):
    track_id = "CE-" + "".join(random.choices(string.digits, k=6))
    new_s = models.Shipment(tracking_number=track_id, client_name=s_in.client_name, weight=s_in.weight)
    db.add(new_s)
    db.commit()
    return new_s

@app.get("/api/shipments")
def list_s(db: Session = Depends(get_db), u=Depends(auth.get_current_user)):
    return db.query(models.Shipment).all()