require "application_system_test_case"

class UploadFocusTest < ApplicationSystemTestCase
  setup do
    visit edit_post_path(posts(:empty))
    wait_for_editor
  end

  test "upload completion does not steal focus from title field" do
    # Defer XHR responses for the direct upload blob creation endpoint.
    # This lets us control when the upload "completes" so we can focus
    # the title field before the upload finishes.
    page.execute_script <<~JS
      window.__xhrQueue = [];
      const OrigXHR = window.XMLHttpRequest;
      const origOpen = OrigXHR.prototype.open;
      const origSend = OrigXHR.prototype.send;

      OrigXHR.prototype.open = function(method, url, ...rest) {
        this.__url = url;
        return origOpen.call(this, method, url, ...rest);
      };

      OrigXHR.prototype.send = function(body) {
        if (this.__url && this.__url.includes('direct_uploads')) {
          // Defer this request — store it and send later
          this.__deferredBody = body;
          window.__xhrQueue.push(this);
          return;
        }
        return origSend.call(this, body);
      };

      window.__flushXhrQueue = function() {
        const queue = window.__xhrQueue;
        window.__xhrQueue = [];
        // Restore original send before flushing
        OrigXHR.prototype.send = origSend;
        OrigXHR.prototype.open = origOpen;
        queue.forEach(xhr => origSend.call(xhr, xhr.__deferredBody));
      };
    JS

    # Start the upload — the blob creation XHR is deferred
    attach_file file_fixture("example.png") do
      click_on "Upload files"
    end

    # Focus the title field while upload is paused
    title_field = find("input[aria-label='Post title']")
    title_field.set("Hello")
    assert_equal title_field, active_element, "Title should have focus before upload completes"

    # Release the deferred upload request
    page.execute_script "window.__flushXhrQueue()"

    # Wait for upload to complete — the upload node is replaced with a permanent attachment
    assert_image_figure_attachment content_type: "image/png", caption: "example.png"

    # Focus should still be on the title field, not stolen by the editor
    assert_equal title_field, active_element,
      "Expected title field to retain focus after upload completes"
  end

  test "typing in title field is uninterrupted by upload completion" do
    # Same XHR deferral setup
    page.execute_script <<~JS
      window.__xhrQueue = [];
      const OrigXHR = window.XMLHttpRequest;
      const origOpen = OrigXHR.prototype.open;
      const origSend = OrigXHR.prototype.send;

      OrigXHR.prototype.open = function(method, url, ...rest) {
        this.__url = url;
        return origOpen.call(this, method, url, ...rest);
      };

      OrigXHR.prototype.send = function(body) {
        if (this.__url && this.__url.includes('direct_uploads')) {
          this.__deferredBody = body;
          window.__xhrQueue.push(this);
          return;
        }
        return origSend.call(this, body);
      };

      window.__flushXhrQueue = function() {
        const queue = window.__xhrQueue;
        window.__xhrQueue = [];
        OrigXHR.prototype.send = origSend;
        OrigXHR.prototype.open = origOpen;
        queue.forEach(xhr => origSend.call(xhr, xhr.__deferredBody));
      };
    JS

    # Start the upload — deferred
    attach_file file_fixture("example.png") do
      click_on "Upload files"
    end

    # Move to the title and type
    title_field = find("input[aria-label='Post title']")
    title_field.set("Hello")

    # Release the upload
    page.execute_script "window.__flushXhrQueue()"

    # Wait for upload to complete
    assert_image_figure_attachment content_type: "image/png", caption: "example.png"

    # Continue typing — should still be in the title field
    title_field.send_keys " world"

    assert_equal "Hello world", title_field.value,
      "Expected to continue typing in title after upload completes"
  end
end
