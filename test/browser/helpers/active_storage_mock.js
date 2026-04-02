// Mocks the Active Storage direct upload endpoints using Playwright route interception.
// Returns a handle for asserting that the expected calls were made.

// 1×1 transparent PNG used as a fallback when the fixture file doesn't exist on disk.
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualzQAAAABJRU5ErkJggg==",
  "base64"
)

export async function mockActiveStorageUploads(page, { delayBlobResponses = false } = {}) {
  let blobCounter = 0
  const calls = { blobCreations: [], fileUploads: [] }
  const pendingBlobRoutes = []

  // When delayBlobResponses is true, GET /blobs/* requests are held until
  // calls.releaseBlobResponses() is called. This lets tests assert the local
  // preview is visible before the server image arrives.
  calls.releaseBlobResponses = async () => {
    await Promise.all(pendingBlobRoutes.map(fulfill => fulfill()))
    pendingBlobRoutes.length = 0
  }

  // POST /rails/active_storage/direct_uploads — creates a blob record
  await page.route("**/rails/active_storage/direct_uploads", async (route) => {
    const request = route.request()
    if (request.method() !== "POST") return route.fallback()

    const body = JSON.parse(request.postData())
    const blob = body.blob
    const signedId = `mock-signed-id-${++blobCounter}`

    calls.blobCreations.push(blob)

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: blobCounter,
        key: `test-key-${blobCounter}`,
        filename: blob.filename,
        content_type: blob.content_type,
        byte_size: blob.byte_size,
        checksum: blob.checksum,
        signed_id: signedId,
        attachable_sgid: `mock-sgid-${blobCounter}`,
        direct_upload: {
          url: `/rails/active_storage/disk/${signedId}`,
          headers: { "Content-Type": blob.content_type },
        },
      }),
    })
  })

  // GET /rails/active_storage/blobs/* — serves the uploaded file back (for preload)
  await page.route("**/rails/active_storage/blobs/**", async (route) => {
    const request = route.request()
    if (request.method() !== "GET") return route.fallback()

    const url = new URL(request.url())
    const filename = decodeURIComponent(url.pathname.split("/").pop())
    const blob = calls.blobCreations.find(b => b.filename === filename)
    const contentType = blob?.content_type || "application/octet-stream"

    const fulfill = async () => {
      // Serve the fixture file if it exists, otherwise return a 1×1 transparent PNG.
      // The fixture file is only needed when delayBlobResponses is true (preview swap test).
      // For other tests, always serve the tiny PNG to avoid layout shifts from full-size
      // images that can break position-dependent tests like drag and drop.
      const fs = await import("fs")
      const fixturePath = `test/fixtures/files/${filename}`
      if (delayBlobResponses && fs.existsSync(fixturePath)) {
        await route.fulfill({ status: 200, contentType, path: fixturePath })
      } else {
        await route.fulfill({ status: 200, contentType: "image/png", body: TRANSPARENT_PNG })
      }
    }

    if (delayBlobResponses) {
      pendingBlobRoutes.push(fulfill)
    } else {
      await fulfill()
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

    await route.fulfill({ status: 204 })
  })

  return calls
}
