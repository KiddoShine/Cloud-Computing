import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.preprocessing import StandardScaler
from firebase_admin import credentials, firestore, initialize_app
from datetime import datetime
import uvicorn
import os

# Inisialisasi Firebase
cred = credentials.Certificate("./firebase-env.json")
initialize_app(cred)

# Akses Firestore
db = firestore.client()

# Load model dan scaler
svm_model = joblib.load("modelstunting1.pkl")
scaler = joblib.load("scaler.pkl")

# Inisialisasi FastAPI
app = FastAPI()

# Model data input
class InputData(BaseModel):
    Gender: str
    Age: int
    Birth_Weight: float
    Birth_Length: float
    Body_Weight: float
    Body_Length: float
    Breastfeeding: int

# Fungsi untuk normalisasi input Gender
def normalize_gender(gender: str) -> int:
    gender = gender.strip().lower()
    if gender in ["laki-laki", "laki", "cowo"]:
        return 0
    elif gender in ["perempuan", "cewe"]:
        return 1
    else:
        raise ValueError("Invalid gender input. Use 'Laki-Laki' or 'Perempuan'.")

# Endpoint untuk menyimpan data dan memproses prediksi
@app.post("/predict/{user_id}")
async def add_and_predict(user_id: str, input_data: InputData):
    try:
        # Normalisasi data Gender
        gender = normalize_gender(input_data.Gender)
        
        # Data yang akan disimpan
        user_data = {
            "Gender": gender,
            "Age": input_data.Age,
            "Birth_Weight": input_data.Birth_Weight,
            "Birth_Length": input_data.Birth_Length,
            "Body_Weight": input_data.Body_Weight,
            "Body_Length": input_data.Body_Length,
            "Breastfeeding": input_data.Breastfeeding,
        }
        
        # Simpan data ke Firestore
        user_ref = db.collection("Users").document(user_id)
        user_ref.update(user_data)
        
        # Konversi data ke DataFrame
        data_for_prediction = pd.DataFrame([{
            "Gender": gender,
            "Age": input_data.Age,
            "Birth Weight": input_data.Birth_Weight,
            "Birth Length": input_data.Birth_Length,
            "Body Weight": input_data.Body_Weight,
            "Body Length": input_data.Body_Length,
            "Breastfeeding": input_data.Breastfeeding
        }])
        
        # Normalisasi data menggunakan scaler
        input_scaled = scaler.transform(data_for_prediction)
        
        # Prediksi menggunakan model
        prediction = svm_model.predict(input_scaled)
        stunting_result = int(prediction[0])  # 0 = Not Stunted, 1 = Stunted
        
        # Update hasil prediksi di Firestore
        user_ref.update({"Stunting": stunting_result})
        
        # Kembalikan hasil sebagai respons
        return {
            "code": 200,
            "message": "Data added and prediction saved successfully",
            "data": {
                "Stunting": stunting_result,
                "Details": user_data
            }
        }
    
    except ValueError as e:
        return {
            "code": 400,
            "message": str(e),
            "data": None
        }
    except Exception as e:
        return {
            "code": 500,
            "message": f"An error occurred: {str(e)}",
            "data": None
        }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))  # Default ke 8000
    uvicorn.run(app, host="0.0.0.0", port=port)
