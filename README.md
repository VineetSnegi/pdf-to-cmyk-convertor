# PDF to CMYK Converter 🚀

This is a full-stack PDF processing service that **converts uploaded PDFs to CMYK color format** using **Ghostscript**, deployed on **Google Cloud Run** with fully automated CI/CD using **GitHub Actions**.

---

##  Features

- Upload PDFs via frontend or API
- Convert PDFs from RGB to CMYK using Ghostscript
- Store original & converted files on GCS
- Secure uploads/downloads using signed URLs
- Avoid duplicate processing with Firestore deduplication
- GitHub Actions CI/CD: Build → Push → Deploy
- Clean up old Docker images via GitHub Actions

---

## Tech Stack

| Layer         | Tech                                   |
|---------------|----------------------------------------|
| Backend       | FastAPI + Ghostscript (PDF processing) |
| Frontend      | Simple HTML form for upload            |
| Container     | Docker                                 |
| Cloud Infra   | Google Cloud Run, GCS, Firestore, Pub/Sub |
| CI/CD         | GitHub Actions + Artifact Registry     |

---

## GitHub Actions CI/CD

This repository includes a GitHub Actions workflow that:

1. **Builds Docker Image**
2. **Pushes to Artifact Registry**
3. **Deploys to Cloud Run**
4. **Cleans up old untagged images**

The workflow uses these secrets:

- `GCP_SA_KEY`
- `PROJECT_ID`
- `REGION`
- `REPOSITORY`
- `SERVICE_NAME`
- `SERVICE_ACCOUNT`

You can find the full pipeline inside `.github/workflows/deploy.yml`

---

## 📂 Project Structure

```plaintext
pdf-to-cmyk-convertor/
├── app.py                # FastAPI backend
├── index.html            # Simple upload frontend
├── Dockerfile            # Build instructions
├── requirements.txt      # Python dependencies
├── cors.json             # CORS headers
├── .gitignore
└── .github/
    └── workflows/
        └── deploy.yml    # GitHub Actions CI/CD
```
### Work on this project is still going on