import os
import json
import io
import cv2
import numpy as np
import openpyxl
from PIL import Image
from typing import Dict, Any, List
import torch
from torchvision import transforms, models

# Directory references
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_PATH = os.path.join(CURRENT_DIR, "Precise E-Waste Materials Breakdown.xlsx")
MODEL_PATH = os.path.join(CURRENT_DIR, "waste_classifier.pth")
MAPPING_PATH = os.path.join(CURRENT_DIR, "class_mapping.json")

# Standard scrap metal rates in India (INR)
MATERIAL_INFO = {
    "Gold": {"rate": 7250.0, "unit": "g", "hi": "सोना"},
    "Silver": {"rate": 92.0, "unit": "g", "hi": "चांदी"},
    "Copper": {"rate": 780.0, "unit": "kg", "hi": "तांबा"},
    "Aluminum": {"rate": 210.0, "unit": "kg", "hi": "एल्युमिनियम"},
    "Brass": {"rate": 480.0, "unit": "kg", "hi": "पीतल"},
    "Iron": {"rate": 38.0, "unit": "kg", "hi": "लोहा"},
    "Tin": {"rate": 1800.0, "unit": "kg", "hi": "टिन"},
    "Nickel": {"rate": 1400.0, "unit": "kg", "hi": "निकल"},
    "Cobalt": {"rate": 2200.0, "unit": "kg", "hi": "कोबाल्ट"},
    "Lithium": {"rate": 1500.0, "unit": "kg", "hi": "लिथियम"},
    "Indium": {"rate": 18000.0, "unit": "kg", "hi": "इंडियम"},
    "Palladium": {"rate": 3100.0, "unit": "g", "hi": "पैलेडियम"},
    "Silicon": {"rate": 160.0, "unit": "kg", "hi": "सिलिकॉन"},
    "ABS Plastic": {"rate": 45.0, "unit": "kg", "hi": "एबीएस प्लास्टिक"},
    "Polycarbonate": {"rate": 40.0, "unit": "kg", "hi": "पॉलीकार्बोनेट"},
    "PVC": {"rate": 35.0, "unit": "kg", "hi": "पीवीसी"},
    "Glass": {"rate": 5.0, "unit": "kg", "hi": "ग्लास"},
    "Fiberglass": {"rate": 20.0, "unit": "kg", "hi": "फाइबरग्लास"},
    "Graphite": {"rate": 80.0, "unit": "kg", "hi": "ग्रेफाइट"},
    "Rubber": {"rate": 15.0, "unit": "kg", "hi": "रबर"},
    "Silicone": {"rate": 60.0, "unit": "kg", "hi": "सिलिकॉन रबर"},
    "Liquid Crystals": {"rate": 50.0, "unit": "kg", "hi": "लिक्विड क्रिस्टल"}
}

# English and Hindi titles for objects
OBJECT_TITLES = {
    "Mobile": {"en": "Mobile Phone", "hi": "स्मार्टफोन"},
    "Laptop": {"en": "Laptop / Notebook", "hi": "लैपटॉप"},
    "Charger": {"en": "Mobile / Device Charger", "hi": "चार्जर एडॉप्टर"},
    "Copper Wire": {"en": "Copper Wire / Cable", "hi": "तांबे का तार"},
    "Keyboard": {"en": "Computer Keyboard", "hi": "कीबोर्ड"},
    "Mouse": {"en": "Computer Mouse", "hi": "माउस"},
    "PCB": {"en": "Circuit Board (PCB)", "hi": "सर्किट बोर्ड (पीसीबी)"},
    "RAM Sticks": {"en": "RAM Memory Stick", "hi": "रैम स्टिक"}
}

CLASS_TO_EXCEL_OBJ = {
    "Mobile_image": "Mobile",
    "charger": "Charger",
    "copper wire": "Copper Wire",
    "keyboard": "Keyboard",
    "laptop": "Laptop",
    "mouse": "Mouse",
    "pcb": "PCB",
    "ram sticks": "RAM Sticks"
}

# Global in-memory storage for Excel data and Model
EXCEL_MATERIALS: Dict[str, List[Dict[str, Any]]] = {}
CLASSIFIER_MODEL = None
CLASS_NAMES: List[str] = []

def load_excel_materials():
    """Parses precise material weights from the Excel workbook"""
    global EXCEL_MATERIALS
    if not os.path.exists(EXCEL_PATH):
        print(f"Warning: Excel file not found at {EXCEL_PATH}")
        return

    try:
        wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
        sheet = wb.active
        current_obj = None

        for row in sheet.iter_rows(values_only=True):
            obj_col, mat_col, weight_col = row[0], row[1], row[2]
            if str(obj_col).strip() == "Object":
                continue
            
            if obj_col and str(obj_col).strip():
                current_obj = str(obj_col).strip()
                if current_obj not in EXCEL_MATERIALS:
                    EXCEL_MATERIALS[current_obj] = []
            
            if current_obj and mat_col and weight_col is not None:
                mat_name = str(mat_col).strip()
                try:
                    w = float(weight_col)
                    info = MATERIAL_INFO.get(mat_name, {"rate": 30.0, "unit": "kg", "hi": mat_name})
                    rate = info["rate"]
                    unit = info["unit"]
                    
                    val = (w * rate) if unit == "g" else ((w / 1000.0) * rate)
                    EXCEL_MATERIALS[current_obj].append({
                        "nameEn": mat_name,
                        "nameHi": info["hi"],
                        "weightGrams": round(w, 2),
                        "rate": rate,
                        "rateUnit": unit,
                        "estimatedValue": round(val, 2)
                    })
                except (ValueError, TypeError):
                    continue
        print(f"Successfully loaded Excel materials for {len(EXCEL_MATERIALS)} items: {list(EXCEL_MATERIALS.keys())}")
    except Exception as e:
        print(f"Error loading Excel file: {e}")

def load_model():
    """Loads the trained PyTorch MobileNetV3 weights and class labels"""
    global CLASSIFIER_MODEL, CLASS_NAMES
    try:
        if os.path.exists(MAPPING_PATH) and os.path.exists(MODEL_PATH):
            with open(MAPPING_PATH, "r", encoding="utf-8") as f:
                CLASS_NAMES = json.load(f)

            model = models.mobilenet_v3_small(weights=None)
            model.classifier[3] = torch.nn.Linear(model.classifier[3].in_features, len(CLASS_NAMES))
            model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
            model.eval()
            CLASSIFIER_MODEL = model
            print(f"Successfully loaded classifier model with classes: {CLASS_NAMES}")
        else:
            print("Model weights or class mapping not found yet.")
    except Exception as e:
        print(f"Error loading trained model: {e}")

# Initialize at module import
load_excel_materials()
load_model()

# Image transforms for MobileNetV3
INFERENCE_TRANSFORMS = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def check_image_outliers(img_bgr: np.ndarray) -> Dict[str, Any]:
    """
    Detects outliers:
    1. Pitch black / extreme darkness
    2. Blurry / out-of-focus camera capture
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    # 1. Darkness / Under-exposure check
    mean_brightness = float(np.mean(gray))
    if mean_brightness < 20.0:
        return {
            "isOutlier": True,
            "errorType": "dark",
            "messageEn": "Image is too dark. Please turn on flashlight or capture in good lighting.",
            "messageHi": "तस्वीर बहुत अंधेरी है। कृपया फ्लैश जलाएं या रोशनी में फोटो लें।"
        }

    # 2. Blurry check using Laplacian variance
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if laplacian_var < 25.0:
        return {
            "isOutlier": True,
            "errorType": "blurry",
            "messageEn": "Image is blurry. Please hold camera steady and retake photo.",
            "messageHi": "फोटो धुंधली है। कृपया कैमरा स्थिर रखें और दोबारा फोटो लें।"
        }

    return {"isOutlier": False}

def analyze_scrap_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    1. Validates image decodability & outliers (dark / blurry).
    2. Runs inference using our trained custom MobileNetV3 model.
    3. Verifies prediction confidence (rejects if non-scrap / < 60% confidence).
    4. Retrieves exact materials & weights from the Excel dataset.
    5. Returns formatted valuation breakdown.
    """
    # 1. Decode image with OpenCV
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img_bgr is None:
        return {
            "status": "error",
            "errorType": "decode_failed",
            "messageEn": "Could not decode image. Please try again.",
            "messageHi": "छवि लोड नहीं हो सकी। कृपया दोबारा प्रयास करें।"
        }

    # 2. Check for physical image outliers (dark / blurry)
    outlier_res = check_image_outliers(img_bgr)
    if outlier_res["isOutlier"]:
        return {
            "status": "error",
            "errorType": outlier_res["errorType"],
            "messageEn": outlier_res["messageEn"],
            "messageHi": outlier_res["messageHi"]
        }

    # 3. Model classification
    global CLASSIFIER_MODEL, CLASS_NAMES
    if CLASSIFIER_MODEL is None or not CLASS_NAMES:
        load_model()

    if CLASSIFIER_MODEL is None:
        return {
            "status": "error",
            "errorType": "model_unavailable",
            "messageEn": "Classifier model is loading. Please retry.",
            "messageHi": "मॉडल लोड हो रहा है। कृपया पुनः प्रयास करें।"
        }

    # Convert to RGB PIL Image for PyTorch
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(img_rgb)
    tensor_input = INFERENCE_TRANSFORMS(pil_img).unsqueeze(0)

    with torch.no_grad():
        outputs = CLASSIFIER_MODEL(tensor_input)
        probs = torch.softmax(outputs, dim=1)
        conf, pred_idx = torch.max(probs, dim=1)

    confidence = conf.item()
    predicted_class = CLASS_NAMES[pred_idx.item()]

    # 4. Confidence / Non-scrap outlier check
    # If the model is not confident enough (e.g. random non-scrap photo, hand, wall)
    if confidence < 0.60:
        return {
            "status": "error",
            "errorType": "no_scrap_detected",
            "messageEn": "No recognizable e-waste detected. Please frame the scrap item clearly inside the box.",
            "messageHi": "कोई ई-वेस्ट सामान नहीं पहचाना गया। कृपया सामान को चौकोर बॉक्स के अंदर रखें।"
        }

    # 5. Look up Excel material profile
    excel_obj_key = CLASS_TO_EXCEL_OBJ.get(predicted_class, "Mobile")
    materials = EXCEL_MATERIALS.get(excel_obj_key, [])
    
    # Fallback to general materials if key missing
    if not materials and EXCEL_MATERIALS:
        excel_obj_key = list(EXCEL_MATERIALS.keys())[0]
        materials = EXCEL_MATERIALS[excel_obj_key]

    titles = OBJECT_TITLES.get(excel_obj_key, {"en": excel_obj_key, "hi": excel_obj_key})

    total_weight = sum(m["weightGrams"] for m in materials)
    total_estimated_value = sum(m["estimatedValue"] for m in materials)

    return {
        "status": "success",
        "id": f"item_{predicted_class}",
        "titleEn": titles["en"],
        "titleHi": titles["hi"],
        "confidence": round(confidence * 100, 1),
        "totalWeightGrams": round(total_weight, 1),
        "totalEstimatedValue": round(total_estimated_value, 2),
        "materials": materials,
        "advice": "इस सामान से कीमती धातुएं सुरक्षित रूप से निकाली जा सकती हैं।"
    }

# Export scrap rates for /api/rates
RATES = {k.lower(): v["rate"] for k, v in MATERIAL_INFO.items()}
