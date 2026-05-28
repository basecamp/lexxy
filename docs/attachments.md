---
title: Attachments
layout: default
nav_order: 6
---

# Attachments

Lexxy uploads files using Active Storage's Direct Upload protocol and renders previews for previewable blobs (images, PDFs, videos).

## Upload response

After a Direct Upload completes, Lexxy reads the following fields from the blob JSON returned by the upload endpoint:

| Field | Description |
|-------|-------------|
| `signed_id` | The Active Storage signed ID for the blob. |
| `attachable_sgid` | The signed Global ID used to embed the attachment in Action Text. |
| `filename` | The file name. |
| `content_type` | MIME type of the file. |
| `byte_size` | File size in bytes. |
| `previewable` | `true` if the blob can be previewed as an image (e.g., a PDF or video). |
| `url` | The URL to load the preview image from. Required when `previewable` is `true`. |
| `preview_status_url` | Optional. URL of a status endpoint Lexxy polls while the preview is being generated. See [Deferred previews](#deferred-previews) below. |

## Deferred previews

Generating a preview for a PDF or video is expensive. The default Active Storage path runs the transform (libvips, ffmpeg, etc.) on the request thread the first time the preview URL is hit — under load this becomes the dominant cost of a previewable upload, and concurrent hits to the same not-yet-generated variant can each pay the cost independently.

Lexxy offers two ways to handle this:

### Default: render the preview URL directly

When `preview_status_url` is not provided, Lexxy renders the preview URL once after upload. If the request fails, the attachment falls back to a file icon. The preview will appear on a subsequent render once the server has generated it.

This is the right choice when your backend generates previews on demand and the preview URL either streams the bytes or errors while processing is in progress. Be aware that the first request after upload will pay the generation cost.

### Opt-in: poll a status URL

If your backend can generate previews in the background (rather than on the request thread), supply a `preview_status_url` in the upload response. Lexxy will:

1. Show a file icon while the preview is being generated.
2. Poll the status URL with exponential backoff (up to 10 attempts).
3. Replace the file icon with the preview image once the status URL signals that the preview is ready.

This lets the host kick off background preview generation immediately after upload (for example, from an Active Job triggered by an `after_create_commit` on the blob) while keeping the editor's pending UI driven by a cheap status check. The preview URL itself is hit exactly once per upload — after the status endpoint says the preview is ready — so the expensive transform runs in the background, not on the polling path.

#### Status URL contract

Lexxy polls the status URL with `fetch` and interprets the response as follows:

- **`2xx`** — preview is still being generated. Lexxy will poll again after a backoff delay.
- **Any other status (`3xx`, `4xx`, `5xx`)** — preview is ready (or won't ever be ready). Lexxy stops polling and loads the preview URL.
- **Network error** — counted as a retry, up to the maximum attempts.

A response body is not required; only the HTTP status matters. Cookies are sent with the request (`credentials: "include"`), so the endpoint can be authenticated.
