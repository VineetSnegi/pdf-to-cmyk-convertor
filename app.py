from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import storage, firestore
from google.oauth2 import service_account
import subprocess
import os
import base64
import json
import traceback
import uuid
from datetime import timedelta, datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment Variables
INPUT_BUCKET = os.getenv("BUCKET_INPUT", "pdf-input-bucket-cmyk-convertor")
OUTPUT_BUCKET = os.getenv("BUCKET_OUTPUT", "pdf-output-bucket-cmyk-convertor")
SIGNED_URL_KEY_PATH = os.getenv("SIGNED_URL_KEY", "key.json")

storage_client = storage.Client()
firestore_client = firestore.Client()

# ---------- Helper Functions ----------

def download_from_gcs(bucket_name, source_blob_name, destination_file_name):
    try:
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(source_blob_name)
        if not blob.exists():
            raise FileNotFoundError(f"Blob '{source_blob_name}' not found in bucket '{bucket_name}'.")
        blob.download_to_filename(destination_file_name)
        print(f"✅ Downloaded {source_blob_name} from {bucket_name} to {destination_file_name}")
    except Exception as e:
        print(f"❌ Failed to download '{source_blob_name}' from bucket '{bucket_name}'")
        print("📛 Error:", str(e))
        raise

def upload_to_gcs(bucket_name, destination_blob_name, source_file_name):
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(source_file_name)
    print(f"✅ Uploaded {source_file_name} to {bucket_name}/{destination_blob_name}")

def convert_pdf_to_cmyk(input_path, output_path):
    gs_command = [
        "gs",
        "-dSAFER",
        "-dBATCH",
        "-dNOPAUSE",
        "-sDEVICE=pdfwrite",
        "-sColorConversionStrategy=CMYK",
        "-dProcessColorModel=/DeviceCMYK",
        f"-sOutputFile={output_path}",
        input_path
    ]
    subprocess.run(gs_command, check=True)

def generate_signed_url(bucket_name, blob_name, expiration_minutes=15, method="GET"):
    credentials = service_account.Credentials.from_service_account_file(SIGNED_URL_KEY_PATH)
    signer_client = storage.Client(credentials=credentials)
    bucket = signer_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    url = blob.generate_signed_url(
        expiration=timedelta(minutes=expiration_minutes),
        method=method,
        version="v4",
        content_type="application/pdf" if method == "PUT" else None
    )
    return url

# ---------- Cloud Pub/Sub Trigger ----------

@app.post("/pubsub/")
async def pubsub_entrypoint(request: Request):
    try:
        body = await request.json()
        message_data = body.get("message", {}).get("data")
        attributes = body.get("message", {}).get("attributes", {})

        file_name = (
            attributes.get("name")
            or attributes.get("objectId")
            or (json.loads(base64.b64decode(message_data).decode()).get("file_name") if message_data else None)
        )

        if not file_name:
            raise HTTPException(status_code=400, detail="Missing PDF file name in Pub/Sub message")

        if file_name.endswith("-cmyk.pdf") or "-cmyk." in file_name:
            print(f"⚠️ Skipping file '{file_name}' as it appears to be already converted.")
            return {"status": "skipped", "reason": "Already converted"}

        if not file_name.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        print(f"📩 Received file: {file_name}")

        doc_ref = firestore_client.collection("processed_files").document(file_name)
        if doc_ref.get().exists:
            print(f"⚠️ File '{file_name}' already processed. Skipping.")
            return {"status": "skipped", "reason": "Already processed"}

        output_file_name = f"{os.path.splitext(file_name)[0]}-cmyk.pdf"
        input_local_path = f"/tmp/{os.path.basename(file_name)}"
        output_local_path = f"/tmp/{output_file_name}"

        # Handle missing file in GCS gracefully
        try:
            download_from_gcs(INPUT_BUCKET, file_name, input_local_path)
        except FileNotFoundError:
            print(f"⚠️ File '{file_name}' already deleted or missing, skipping processing.")
            return {"status": "skipped", "reason": "File not found"}

        convert_pdf_to_cmyk(input_local_path, output_local_path)
        upload_to_gcs(OUTPUT_BUCKET, output_file_name, output_local_path)
        signed_url = generate_signed_url(OUTPUT_BUCKET, output_file_name)

        ttl_expiry = datetime.utcnow() + timedelta(days=7)
        doc_ref.set({
            "original_file": file_name,
            "converted_file": output_file_name,
            "download_url": signed_url,
            "ttl": ttl_expiry
        })

        return {
            "status": "success",
            "converted_file": output_file_name,
            "download_url": signed_url
        }

    except subprocess.CalledProcessError:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Ghostscript conversion failed.")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

# ---------- Upload URL Generator ----------

@app.post("/generate-upload-url")
async def generate_upload_url(request: Request):
    try:
        data = await request.json()
        original_name = data.get("file_name")
        if not original_name or not original_name.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Invalid or missing 'file_name'. Must be a .pdf")

        unique_id = str(uuid.uuid4())[:8]
        safe_name = f"{unique_id}_{original_name}"

        upload_url = generate_signed_url(INPUT_BUCKET, safe_name, expiration_minutes=10, method="PUT")

        return {
            "upload_url": upload_url,
            "file_name": safe_name,
            "original_name": original_name,
            "expires_in_minutes": 10
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate upload URL: {str(e)}")

# ---------- Firestore Polling Endpoint ----------

@app.get("/check-status/{file_name}")
async def check_conversion_status(file_name: str):
    try:
        print(f"🔍 Looking up Firestore for: {file_name}")
        doc_ref = firestore_client.collection("processed_files").document(file_name)
        doc = doc_ref.get()

        if not doc.exists:
            print(f"📛 No document found in Firestore for: {file_name}")
            raise HTTPException(status_code=404, detail="File not processed yet or does not exist.")

        data = doc.to_dict()
        converted_file = data.get("converted_file")
        if not converted_file:
            raise HTTPException(status_code=500, detail="Missing converted file name in Firestore document.")

        fresh_url = generate_signed_url(OUTPUT_BUCKET, converted_file, expiration_minutes=10)

        return {
            "status": "completed",
            "converted_file": converted_file,
            "download_url": fresh_url
        }

    except Exception as e:
        print("❌ Error during Firestore check:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to check status: {str(e)}")

# ---------- Root Endpoints for Cloud Run health check ----------

@app.get("/")
async def root_get():
    return {"message": "PDF to CMYK converter is running"}

@app.post("/")
async def root_post():
    return {"message": "POST route handled"}
