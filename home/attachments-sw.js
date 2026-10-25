// Service Worker that mocks Active Storage's Direct Upload endpoints.
// Allows the "Try it" demo to support file uploads without a server.

const files = new Map()
let blobCounter = 0

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  const method = event.request.method

  if (url.pathname.endsWith("/rails/active_storage/direct_uploads") && method === "POST") {
    event.respondWith(createBlob(event.request))
  } else if (url.pathname.includes("/rails/active_storage/disk/") && method === "PUT") {
    event.respondWith(storeFile(event.request, url))
  } else if (url.pathname.includes("/rails/active_storage/blobs/") && method === "GET") {
    event.respondWith(serveFile(url))
  }
})

async function createBlob(request) {
  const { blob } = await request.json()
  const signedId = `demo-signed-id-${++blobCounter}`

  files.set(signedId, { metadata: blob })

  return new Response(JSON.stringify({
    id: blobCounter,
    key: `demo-key-${blobCounter}`,
    filename: blob.filename,
    content_type: blob.content_type,
    byte_size: blob.byte_size,
    checksum: blob.checksum,
    signed_id: signedId,
    attachable_sgid: `demo-sgid-${blobCounter}`,
    direct_upload: {
      url: `/rails/active_storage/disk/${signedId}`,
      headers: { "Content-Type": blob.content_type },
    },
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

async function storeFile(request, url) {
  const signedId = url.pathname.split("/").pop()
  const data = await request.arrayBuffer()
  const contentType = request.headers.get("content-type")

  const existing = files.get(signedId) || {}
  files.set(signedId, { ...existing, data, contentType })

  return new Response(null, { status: 204 })
}

async function serveFile(url) {
  const segments = url.pathname.split("/")
  const blobsIndex = segments.indexOf("blobs")
  const signedId = segments[blobsIndex + 1]

  const file = files.get(signedId)
  if (file?.data) {
    return new Response(file.data, {
      status: 200,
      headers: { "Content-Type": file.contentType || "application/octet-stream" },
    })
  }

  return new Response("Not found", { status: 404 })
}
