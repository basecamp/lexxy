export async function selectAttachment(figure) {
  await figure.click({ position: { x: 8, y: 8 } })
}

export function attachmentTag(sgid, file) {
  return `<action-text-attachment sgid="${sgid}" content-type="image/png" url="/${file}" filename="${file}" filesize="100" width="50" height="50" previewable="true" presentation="gallery"></action-text-attachment>`
}
