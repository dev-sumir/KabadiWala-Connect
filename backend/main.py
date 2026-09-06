import os
import base64
from typing import Optional, Dict
from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import random
from analyzer import analyze_scrap_image, RATES

app = FastAPI(
    title="KabadiWala Connect AI Vision API",
    description="E-Waste and Scrap Metal AI Analyzer for Kabadiwalas and Recyclers",
    version="1.0.0"
)

# Enable CORS for mobile app requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Base64ImagePayload(BaseModel):
    image: Optional[str] = None
    imageBase64: Optional[str] = None

class PhonePayload(BaseModel):
    phone: str

class VerifyOTPPayload(BaseModel):
    phone: str
    otp: str

# In-memory store for OTPs (In production, use Redis or Database)
otp_store: Dict[str, str] = {}

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "KabadiWala Connect AI Vision API",
        "version": "1.0.0"
    }

@app.get("/api/rates")
def get_live_rates():
    """Returns standard live scrap metal rates per unit in India"""
    return {
        "status": "success",
        "currency": "INR (₹)",
        "rates": RATES
    }

@app.post("/api/send-otp")
async def send_otp(payload: PhonePayload):
    """
    Mock endpoint to send an SMS OTP.
    In production, integrate with Fast2SMS, Twilio, etc.
    """
    if not payload.phone:
        raise HTTPException(status_code=400, detail="Phone number is required")
        
    # Generate a random 4-digit OTP
    otp = str(random.randint(1000, 9999))
    
    # Store OTP in memory
    otp_store[payload.phone] = otp
    
    # MOCK: Print to console instead of sending real SMS
    print(f"========== SMS SENT ==========")
    print(f"To: {payload.phone}")
    print(f"Message: Your KabadiWala Connect verification code is {otp}")
    print(f"==============================")
    
    return {
        "status": "success",
        "message": "OTP sent successfully"
    }

@app.post("/api/verify-otp")
async def verify_otp(payload: VerifyOTPPayload):
    """
    Verifies the OTP against the stored value.
    """
    if not payload.phone or not payload.otp:
        raise HTTPException(status_code=400, detail="Phone number and OTP are required")
        
    stored_otp = otp_store.get(payload.phone)
    
    if not stored_otp:
        raise HTTPException(status_code=400, detail="No OTP found for this number or it has expired")
        
    if stored_otp != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    # OTP is valid, remove it from store to prevent reuse
    del otp_store[payload.phone]
    
    return {
        "status": "success",
        "message": "OTP verified successfully",
        "token": "mock-jwt-token-12345" # In production, return a real session token
    }

@app.post("/api/analyze-base64")
async def analyze_image_base64(payload: Base64ImagePayload):
    """
    Receives base64 encoded image from React Native app directly via JSON.
    Bypasses native React Native FormData/multipart limitations.
    """
    data_str = payload.imageBase64 or payload.image
    if not data_str:
        raise HTTPException(status_code=400, detail="No base64 image data provided in payload.")

    try:
        if "," in data_str:
            data_str = data_str.split(",", 1)[1]

        image_bytes = base64.b64decode(data_str)
        analysis = analyze_scrap_image(image_bytes)
        if analysis.get("status") == "error":
            return {
                "status": "error",
                "errorType": analysis.get("errorType"),
                "messageEn": analysis.get("messageEn"),
                "messageHi": analysis.get("messageHi"),
                "detail": analysis.get("messageEn")
            }
        return {
            "status": "success",
            "data": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")

@app.post("/api/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """
    Receives captured photo from mobile app and returns detected scrap classification,
    extracted precious metal breakdown, and valuation.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        contents = await file.read()
        analysis = analyze_scrap_image(contents)
        if analysis.get("status") == "error":
            return {
                "status": "error",
                "errorType": analysis.get("errorType"),
                "messageEn": analysis.get("messageEn"),
                "messageHi": analysis.get("messageHi"),
                "detail": analysis.get("messageEn")
            }
        return {
            "status": "success",
            "filename": file.filename,
            "data": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

