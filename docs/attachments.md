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

For previewable PDFs and videos, the server may need time to generate the preview image after the upload completes. There are two ways Lexxy can handle this:

### Default: render the preview URL directly

When `preview_status_url` is not provided, Lexxy renders the preview URL once after upload. If the request fails, the attachment falls back to a file icon. The preview will appear on a subsequent render once the server has generated it.

This is the right choice when your backend generates previews on demand and the preview URL either streams the bytes or errors while processing is in progress.

### Opt-in: poll a status URL

If your backend generates previews asynchronously and serves a temporary placeholder image while processing (so that the preview URL doesn't error during that window), supply a `preview_status_url` in the upload response. Lexxy will:

1. Show a file icon while the preview is being generated.
2. Poll the status URL with exponential backoff (up to 10 attempts).
3. Replace the file icon with the preview image once the status URL signals that the preview is ready.

This avoids polling the preview URL itself, which on backends that lazily generate previews can trigger preview generation on every request.

#### Status URL contract

Lexxy polls the status URL with `fetch` and interprets the response as follows:

- **`2xx`** — preview is still being generated. Lexxy will poll again after a backoff delay.
- **Any other status (`3xx`, `4xx`, `5xx`)** — preview is ready (or won't ever be ready). Lexxy stops polling and loads the preview URL.
- **Network error** — counted as a retry, up to the maximum attempts.

A response body is not required; only the HTTP status matters. Cookies are sent with the request (`credentials: "include"`), so the endpoint can be authenticated.
