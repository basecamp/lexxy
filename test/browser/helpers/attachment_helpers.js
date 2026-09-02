export async function selectAttachment(figure) {
  await figure.click({ position: { x: 8, y: 8 } })
}

export function attachmentTag(sgid, file, { caption = "" } = {}) {
  const captionAttribute = caption ? ` caption="${caption}"` : ""
  return `<action-text-attachment sgid="${sgid}" content-type="image/png" url="/${file}" filename="${file}" filesize="100" width="50" height="50" previewable="true" presentation="gallery"${captionAttribute}></action-text-attachment>`
}

export async function watchAnnouncements(page) {
  await page.evaluate(() => {
    window.__lexxyAnnouncements = []
    if (typeof document.ariaNotify === "function") {
      document.ariaNotify = (message) => window.__lexxyAnnouncements.push(message)
    }
    const regions = document.querySelectorAll("lexxy-editor lexxy-live-region [aria-relevant='additions']")
    for (const region of regions) {
      new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            const text = node.textContent
            if (text) window.__lexxyAnnouncements.push(text)
          }
        }
      }).observe(region, { childList: true })
    }
  })
}

export function announcements(page) {
  return page.evaluate(() => window.__lexxyAnnouncements ?? [])
}
