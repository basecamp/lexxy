export async function selectAttachment(figure) {
  await figure.click({ position: { x: 8, y: 8 } })
}

export function attachmentTag(sgid, file, { caption = "" } = {}) {
  const captionAttribute = caption ? ` caption="${caption}"` : ""
  return `<action-text-attachment sgid="${sgid}" content-type="image/png" url="/${file}" filename="${file}" filesize="100" width="50" height="50" previewable="true" presentation="gallery"${captionAttribute}></action-text-attachment>`
}

// The live region clears itself within a frame of each announcement, so a
// direct textContent read races with the cleanup. Watching mutations captures
// every announcement as it lands and exposes the full list to the test.
export async function watchAnnouncements(page) {
  await page.evaluate(() => {
    window.__lexxyAnnouncements = []
    const region = document.querySelector("lexxy-editor lexxy-live-region")
    new MutationObserver(() => {
      const text = region.textContent
      if (text) window.__lexxyAnnouncements.push(text)
    }).observe(region, { childList: true, characterData: true, subtree: true })
  })
}

export function announcements(page) {
  return page.evaluate(() => window.__lexxyAnnouncements ?? [])
}
