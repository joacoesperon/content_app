"""Google Drive upload and Google Sheets append for Instagram scheduling."""
from __future__ import annotations

import mimetypes
import pickle
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

from backend.config import PROJECT_ROOT

SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/spreadsheets",
]

GDRIVE_FOLDER_ID = "1v6mGiGcHh5-LUeS7_B7_k638yK9Q2owH"
SHEET_ID = "1F5WxTjInm9rVybXnrY4c-y23JOoS5cJs2rvIRJx1-eM"
SHEET_NAME = "Instagram Scheduled Posts"

_CREDENTIALS_PATH = PROJECT_ROOT / "credentials.json"
_TOKEN_PATH = PROJECT_ROOT / "token.pickle"

_creds: Credentials | None = None


def _get_creds() -> Credentials:
    global _creds
    if _creds and _creds.valid:
        return _creds
    if _TOKEN_PATH.exists():
        with open(_TOKEN_PATH, "rb") as f:
            _creds = pickle.load(f)
    if not _creds or not _creds.valid:
        if _creds and _creds.expired and _creds.refresh_token:
            _creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(_CREDENTIALS_PATH), SCOPES)
            _creds = flow.run_local_server(port=0)
        with open(_TOKEN_PATH, "wb") as f:
            pickle.dump(_creds, f)
    return _creds


def _get_or_create_folder(service, name: str, parent_id: str) -> str:
    """Return the ID of a folder by name inside parent_id, creating it if needed."""
    results = service.files().list(
        q=f"name = '{name}' and '{parent_id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        fields="files(id)",
    ).execute()
    files = results.get("files", [])
    if files:
        return files[0]["id"]
    folder = service.files().create(
        body={"name": name, "mimeType": "application/vnd.google-apps.folder", "parents": [parent_id]},
        fields="id",
    ).execute()
    return folder["id"]


def get_post_folder(date: str, post_slug: str, post_type: str = "carousels") -> str:
    """Return the Drive folder ID for Instagram Uploads/{post_type}/{date}/{post_slug}, creating as needed."""
    service = build("drive", "v3", credentials=_get_creds())
    type_folder_id = _get_or_create_folder(service, post_type, GDRIVE_FOLDER_ID)
    date_folder_id = _get_or_create_folder(service, date, type_folder_id)
    post_folder_id = _get_or_create_folder(service, post_slug, date_folder_id)
    return post_folder_id


def upload_image(path: Path, folder_id: str) -> str:
    """Upload image to the given Drive folder, make it public, return URL."""
    mime, _ = mimetypes.guess_type(str(path))
    mime = mime or "image/jpeg"
    service = build("drive", "v3", credentials=_get_creds())
    file = service.files().create(
        body={"name": path.name, "parents": [folder_id]},
        media_body=MediaFileUpload(str(path), mimetype=mime, resumable=False),
        fields="id",
    ).execute()
    file_id = file["id"]
    service.permissions().create(
        fileId=file_id,
        body={"type": "anyone", "role": "reader"},
    ).execute()
    return f"https://drive.google.com/uc?export=view&id={file_id}"


def append_scheduled_post(
    post_slug: str,
    post_type: str,
    caption: str,
    scheduled_at: int,
    img_urls: list[str],
    video_url: str = "",
) -> None:
    """Append a pending-status row to the Instagram Scheduled Posts sheet."""
    service = build("sheets", "v4", credentials=_get_creds())
    imgs = (img_urls + [""] * 8)[:8]
    row = [post_slug, post_type, caption, video_url, str(scheduled_at), "pending"] + imgs
    service.spreadsheets().values().append(
        spreadsheetId=SHEET_ID,
        range=f"{SHEET_NAME}!A:N",
        valueInputOption="RAW",
        body={"values": [row]},
    ).execute()
