// Mocks the Active Storage direct upload endpoints using Playwright route interception.
// Returns a handle for asserting that the expected calls were made.

// Fallback preview image. Must be byte-valid — Firefox rejects malformed data and
// fires <img> onerror, reverting the preview swap to the file icon (a flake). Must
// also be wider than the figure's min-inline-size (10ch); a sub-figure image leaves
// the figure chrome on top of the click point, so Firefox reports the figure as
// intercepting pointer events when tests click the preview img.
const FALLBACK_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAHgAAABaCAYAAABzAJLvAAAA6ElEQVR4nO3RwQkAIBDAMMe+Ed1KxxBqHvkXumb2oWu9DsBgDMbgTxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcZ3CcwXEGxxkcdwGOw47/2hYVfQAAAABJRU5ErkJggg==",
  "base64"
)

export async function mockActiveStorageUploads(page, { delayBlobResponses = false, delayDirectUploadResponse = false, uploadDelayMs = 0, holdFileUploads = false, includePreviewStatusUrl = false, previewStatusInitiallyProcessing = true, previewReadyStatus = 410, failBlobResponses = false } = {}) {
  let blobCounter = 0
  const calls = { blobCreations: [], fileUploads: [], previewStatusRequests: [], previewUrlRequests: [] }
  const pendingBlobRoutes = []
  const pendingDirectUploadRoutes = []
  let blobsReleased = false
  let directUploadReleased = false
  let previewProcessing = previewStatusInitiallyProcessing

  calls.markPreviewReady = () => { previewProcessing = false }

  // When delayBlobResponses is true, GET /blobs/* requests are held until
  // calls.releaseBlobResponses() is called. This lets tests assert the local
  // preview is visible before the server image arrives. Idempotent: once
  // released, any subsequent blob requests are fulfilled immediately.
  calls.releaseBlobResponses = async () => {
    blobsReleased = true
    await Promise.all(pendingBlobRoutes.map(fulfill => fulfill()))
    pendingBlobRoutes.length = 0
  }

  // When delayDirectUploadResponse is true, POST /direct_uploads responses are
  // held until calls.releaseDirectUploadResponses() is called. This lets tests
  // keep uploads pending while typing, then release completion deterministically.
  calls.releaseDirectUploadResponses = async () => {
    directUploadReleased = true
    await Promise.all(pendingDirectUploadRoutes.map(fulfill => fulfill()))
    pendingDirectUploadRoutes.length = 0
  }

  // POST /rails/active_storage/direct_uploads — creates a blob record
  await page.route("**/rails/active_storage/direct_uploads", async (route) => {
    const request = route.request()
    if (request.method() !== "POST") return route.fallback()

    const body = JSON.parse(request.postData())
    const blob = body.blob
    const blobId = ++blobCounter
    const signedId = `mock-signed-id-${blobId}`

    calls.blobCreations.push(blob)

    // Non-image previewable types (PDFs, videos) get a preview URL from the
    // server. Images are handled via isPreviewableImage and don't need this.
    const previewable = blob.content_type === "application/pdf" ||
      blob.content_type.startsWith("video/")

    const fulfill = async () => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: blobId,
          key: `test-key-${blobId}`,
          filename: blob.filename,
          content_type: blob.content_type,
          byte_size: blob.byte_size,
          checksum: blob.checksum,
          signed_id: signedId,
          attachable_sgid: `mock-sgid-${blobId}`,
          previewable: previewable || undefined,
          url: previewable ? `/rails/active_storage/blobs/${signedId}/previews/full` : undefined,
          preview_status_url: previewable && includePreviewStatusUrl
            ? `/rails/active_storage/blobs/${signedId}/preview_status`
            : undefined,
          direct_upload: {
            url: `/rails/active_storage/disk/${signedId}`,
            headers: { "Content-Type": blob.content_type },
          },
        }),
      })
    }

    if (delayDirectUploadResponse && !directUploadReleased) {
      pendingDirectUploadRoutes.push(fulfill)
    } else {
      await fulfill()
    }
  })

  // GET /rails/active_storage/blobs/* — serves the uploaded file back (for preload)
  await page.route("**/rails/active_storage/blobs/**", async (route) => {
    const request = route.request()
    if (request.method() !== "GET") return route.fallback()

    const url = new URL(request.url())
    if (url.pathname.includes("/previews/")) {
      calls.previewUrlRequests.push(request.url())
    }
    const filename = decodeURIComponent(url.pathname.split("/").pop())
    const blob = calls.blobCreations.find(b => b.filename === filename)
    const contentType = blob?.content_type || "application/octet-stream"

    const fulfill = async () => {
      if (failBlobResponses) {
        await route.fulfill({ status: 500 })
        return
      }

      // Serve the fixture file if it exists, otherwise the small FALLBACK_PNG.
      // The fixture file is only needed when delayBlobResponses is true (preview swap test).
      // The fallback keeps full-size images out of other tests to avoid layout shifts
      // that can break position-dependent tests like drag and drop.
      const fs = await import("fs")
      const fixturePath = `test/fixtures/files/${filename}`
      if (delayBlobResponses && fs.existsSync(fixturePath)) {
        await route.fulfill({ status: 200, contentType, path: fixturePath })
      } else {
        await route.fulfill({ status: 200, contentType: "image/png", body: FALLBACK_PNG })
      }
    }

    if (delayBlobResponses && !blobsReleased) {
      pendingBlobRoutes.push(fulfill)
    } else {
      await fulfill()
    }
  })

  // GET /rails/active_storage/blobs/*/preview_status — status endpoint Lexxy
  // polls when the host opts into deferred preview rendering. 200 = still
  // processing, 410 (or any non-2xx) = ready. Registered after the general
  // blobs route so it takes precedence (Playwright matches routes in reverse
  // registration order).
  await page.route("**/rails/active_storage/blobs/*/preview_status", async (route) => {
    if (route.request().method() !== "GET") return route.fallback()

    calls.previewStatusRequests.push(route.request().url())

    if (previewProcessing) {
      await route.fulfill({ status: 200 })
    } else {
      await route.fulfill({
        status: previewReadyStatus,
        headers: previewReadyStatus >= 300 && previewReadyStatus < 400
          ? { Location: "/rails/active_storage/blobs/elsewhere/previews/full" }
          : {}
      })
    }
  })

  // PUT /rails/active_storage/disk/* — stores the file bytes
  await page.route("**/rails/active_storage/disk/**", async (route) => {
    const request = route.request()
    if (request.method() !== "PUT") return route.fallback()

    calls.fileUploads.push({
      url: request.url(),
      contentType: request.headers()["content-type"],
    })

    // When holdFileUploads is true, the PUT is never fulfilled, keeping the
    // upload in flight. This lets tests assert that trashing an attachment
    // aborts the connection (Playwright reports an aborted request as failed).
    if (holdFileUploads) return

    if (uploadDelayMs > 0) {
      await page.waitForTimeout(uploadDelayMs)
    }

    await route.fulfill({ status: 204 })
  })

  return calls
}
