import os
import shutil
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from video_processor import split_video
from youtube_uploader import (
    get_auth_url,
    exchange_code_for_token,
    is_authenticated,
    upload_video,
)

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = "static"
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# YouTube category name → YouTube API category ID
CATEGORY_IDS: dict[str, str] = {
    "Film & Animation": "1",
    "Autos & Vehicles": "2",
    "Music": "10",
    "Pets & Animals": "15",
    "Sports": "17",
    "Travel & Events": "19",
    "Gaming": "20",
    "People & Blogs": "22",
    "Comedy": "23",
    "Entertainment": "24",
    "News & Politics": "25",
    "Howto & Style": "26",
    "Education": "27",
    "Science & Technology": "28",
    "Nonprofits & Activism": "29",
}


# ── Video split ────────────────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_and_process_video(file: UploadFile = File(...)):
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File provided is not a video.")

    temp_input_path = f"temp_in_{file.filename}"

    try:
        with open(temp_input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        clip_filenames = split_video(
            input_video_path=temp_input_path,
            output_dir=STATIC_DIR,
            clip_duration=60,
        )

        clip_urls = [f"{BACKEND_URL}/static/{filename}" for filename in clip_filenames]

        return {
            "message": "Video split and processed successfully",
            "urls": clip_urls,
        }

    except Exception as e:
        print(f"\n--- ACTUAL ERROR: {str(e)} ---\n")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    finally:
        if os.path.exists(temp_input_path):
            os.remove(temp_input_path)


# ── YouTube OAuth ──────────────────────────────────────────────────────────────

@app.get("/auth/youtube")
def youtube_auth():
    """Redirect the user to Google's OAuth consent screen."""
    return RedirectResponse(url=get_auth_url())


@app.get("/auth/callback")
def youtube_callback(code: str):
    """Google redirects here after the user grants permission."""
    try:
        exchange_code_for_token(code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth failed: {str(e)}")
    # Close the tab and tell the React app auth is done
    return RedirectResponse(url=f"{FRONTEND_URL}/youtube?auth=success")


@app.get("/api/youtube/status")
def youtube_auth_status():
    """Let the frontend check whether the user is already authenticated."""
    return {"authenticated": is_authenticated()}


# ── YouTube upload ─────────────────────────────────────────────────────────────

@app.post("/api/youtube/upload")
async def youtube_upload(
    file: UploadFile | None = File(None),
    clip_url: str | None = Form(None),
    title: str = Form(...),
    description: str = Form(""),
    tags: str = Form(""),
    category: str = Form(""),
    visibility: str = Form("public"),
    made_for_kids: str = Form("false"),
):
    if not is_authenticated():
        raise HTTPException(status_code=401, detail="Not authenticated with YouTube.")

    video_path = None
    is_temp = False

    if clip_url:
        filename = os.path.basename(clip_url.split("?")[0])
        candidate_path = os.path.join(STATIC_DIR, filename)
        if not os.path.exists(candidate_path):
            raise HTTPException(status_code=404, detail=f"Clip file not found on server: {filename}")
        video_path = candidate_path
    elif file and file.filename:
        if file.content_type and not file.content_type.startswith("video/"):
            raise HTTPException(status_code=400, detail="File provided is not a video.")
        video_path = f"temp_yt_{file.filename}"
        is_temp = True
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    else:
        raise HTTPException(status_code=400, detail="Please select a generated clip or provide a video file.")

    try:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        category_id = CATEGORY_IDS.get(category, "22")  # default: People & Blogs
        kids = made_for_kids.lower() == "true"

        video_id = upload_video(
            video_path=video_path,
            title=title,
            description=description,
            tags=tag_list,
            category_id=category_id,
            privacy_status=visibility,
            made_for_kids=kids,
        )

        return {
            "message": "Video uploaded successfully",
            "video_id": video_id,
            "url": f"https://www.youtube.com/watch?v={video_id}",
        }

    except RuntimeError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        print(f"\n--- YOUTUBE UPLOAD ERROR: {str(e)} ---\n")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    finally:
        if is_temp and video_path and os.path.exists(video_path):
            os.remove(video_path)
