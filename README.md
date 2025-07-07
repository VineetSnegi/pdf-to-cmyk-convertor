# PDF to CMYK Converter

A full-stack service to convert uploaded PDF files to CMYK color space using FastAPI, Ghostscript, and Google Cloud.  
This project features a modern frontend (Next.js, deployed on Vercel), a robust backend (FastAPI, Dockerized), and automated CI/CD with GitHub Actions.

---

## Features

- Upload PDFs via a web frontend or REST API
- Convert PDFs from RGB to CMYK using Ghostscript
- Store files (original & converted) securely on Google Cloud Storage (GCS)
- Download links via signed URLs for secure access
- Duplicate prevention using Firestore for file deduplication
- Automated deployment to Google Cloud Run via GitHub Actions
- Automatic cleanup of old Docker images

---

## Tech Stack

| Layer         | Tech/Service                                 |
|---------------|----------------------------------------------|
| Backend       | FastAPI, Ghostscript, Python                 |
| Frontend      | Next.js (React), deployed on Vercel          |
| Container     | Docker                                       |
| Cloud Infra   | Google Cloud Run, GCS, Firestore             |
| CI/CD         | GitHub Actions, Artifact Registry            |

---

## Quick Start

### 1. Clone the repository

```sh
git clone https://github.com/your-username/pdf-to-cmyk-convertor.git
cd pdf-to-cmyk-convertor
```

### 2. Backend (Local Development)

```sh
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload
```

- The backend will be available at `http://localhost:8000`

### 3. Frontend (Local Development)

```sh
cd frontend
npm install
npm run dev
```

- The frontend will be available at `http://localhost:3000`
- Make sure to set `NEXT_PUBLIC_API_URL` in your `.env` file to point to your backend.

---

## Project Structure

```plaintext
pdf-to-cmyk-convertor/
├── backend/
│   ├── app.py                # FastAPI backend
│   ├── requirements.txt      # Backend Python dependencies
│   ├── Dockerfile            # Backend Docker build instructions
│   ├── cors.json             # GCS CORS config (not in image)
│   └── .dockerignore         # Docker ignore rules for backend
├── frontend/
│   ├── ...                   # All frontend (e.g., Next.js) files
│   └── (deployed on Vercel)
├── .github/
│   └── workflows/
│       └── deploy.yaml       # GitHub Actions CI/CD for backend
├── .gitignore                # Root gitignore
├── README.md                 # Project documentation
```

---

## Deployment & CI/CD

- Backend is deployed to Google Cloud Run using Docker.
- Frontend is deployed to [Vercel](https://vercel.com/).
- CI/CD: On push to `main`, GitHub Actions will:
  1. Build and push the Docker image to Artifact Registry
  2. Deploy the backend to Cloud Run
  3. Clean up old Docker images

### Required GitHub Secrets

- `GCP_SA_KEY` — Google Cloud service account key (JSON)
- `PROJECT_ID` — GCP project ID
- `REGION` — GCP region (e.g., `us-central1`)
- `REPOSITORY` — Artifact Registry repo name
- `SERVICE_NAME` — Cloud Run service name
- `SERVICE_ACCOUNT` — Cloud Run service account email

---

## CORS Configuration

- The `backend/cors.json` file is used to set CORS rules for your GCS bucket.
- Apply it using:
  ```sh
  gsutil cors set cors.json gs://your-bucket-name
  ```

---

## Security & Secrets

- Never commit `key.json` or other secrets to the repository.
- Use GitHub Actions secrets and Cloud Run secret mounting for production deployments.

---

## Contributing

1. Fork the repo and create your branch from `main`.
2. Make your changes and test locally.
3. Push to your fork and submit a pull request.
4. Describe your changes clearly in the PR.

---

## Notes

- The frontend and backend are decoupled; update the API URL in the frontend as needed.
- Work on this project is still going on