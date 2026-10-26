import { describe, expect, test, vi } from "vitest"
import { UploadRequests } from "src/editor/attachments/upload_requests"

function fakeRequest() {
  return { abort: vi.fn() }
}

describe("UploadRequests", () => {
  test("aborts a tracked request and forgets it", () => {
    const uploadRequests = new UploadRequests()
    const request = fakeRequest()

    uploadRequests.track("node-1", request)
    uploadRequests.abort("node-1")

    expect(request.abort).toHaveBeenCalledTimes(1)
  })

  test("only aborts the request for the given key", () => {
    const uploadRequests = new UploadRequests()
    const first = fakeRequest()
    const second = fakeRequest()

    uploadRequests.track("node-1", first)
    uploadRequests.track("node-2", second)
    uploadRequests.abort("node-1")

    expect(first.abort).toHaveBeenCalledTimes(1)
    expect(second.abort).not.toHaveBeenCalled()
  })

  test("does not abort again after the request has been aborted", () => {
    const uploadRequests = new UploadRequests()
    const request = fakeRequest()

    uploadRequests.track("node-1", request)
    uploadRequests.abort("node-1")
    uploadRequests.abort("node-1")

    expect(request.abort).toHaveBeenCalledTimes(1)
  })

  test("does not abort a forgotten request", () => {
    const uploadRequests = new UploadRequests()
    const request = fakeRequest()

    uploadRequests.track("node-1", request)
    uploadRequests.forget("node-1")
    uploadRequests.abort("node-1")

    expect(request.abort).not.toHaveBeenCalled()
  })

  test("aborting an unknown key is a no-op", () => {
    const uploadRequests = new UploadRequests()

    expect(() => uploadRequests.abort("missing")).not.toThrow()
  })
})
