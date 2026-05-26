# Melody Mixer Frontend Backend Contract

The frontend uses `NEXT_PUBLIC_API_BASE_URL` for Rails API calls. If it is not set, it defaults to `http://localhost:3001/api/v1` so the Next dev server can run on `http://localhost:3000`.

## Existing Rails-Aligned Endpoints

- `POST /sessions`
  - Request: `{ "session": { "email": string, "password": string } }`
  - Response: JSON API style user payload with `data.attributes`.

- `DELETE /sessions`
  - Ends the current session.

- `POST /users`
  - Request: `{ "user": { "host_name", "description", "first_name", "last_name", "email", "phone_number", "password", "password_confirmation" } }`
  - Response: JSON API style user payload.

- `PATCH /users/:id`
  - Request: same user fields except password fields are optional.
  - Response: JSON API style user payload.

## Needed Show Builder Endpoint

- `POST /playlists`
  - Purpose: persist a radio show draft, ready block, or scheduled show.
  - Request shape:

```json
{
  "playlist": {
    "name": "Late Night Signal",
    "description": "Show notes",
    "host_name": "Poole and the Gang",
    "status": "draft",
    "scheduled_at": "2026-05-22T20:00",
    "songs": [
      {
        "name": "Station Intro",
        "artist": "Poole and the Gang",
        "album": "Host Break",
        "duration": "00:30",
        "file_url": "blob-or-upload-url",
        "file_name": "intro.webm"
      }
    ]
  }
}
```

The current Rails schema has `playlists` and `songs`, but routes/controllers are not exposed yet for playlist creation. Until this exists, the frontend saves the show payload to `localStorage` under `melody:lastShowDraft`.

## Audio Upload Decision

The old frontend used EdgeStore, while the Rails backend has S3-oriented audio file code. Pick one owner for audio persistence:

- Rails-owned: frontend sends multipart files to Rails, Rails uploads to S3 and returns durable URLs.
- Frontend-owned: frontend uploads to EdgeStore, then sends the returned URL to Rails with the playlist/song payload.

The current show builder supports metadata-only tracks, attached audio files, and browser-recorded host breaks. Durable backend persistence depends on the audio ownership decision above.
