export async function optimizeImage(file, config = {}) {
    if (!file.type.startsWith("image/")) return null

    const { maxWidth = Infinity, maxHeight = Infinity, quality = 0.8 } = config

    const configFormat = config.format?.toLowerCase().trim()
    const originalFormat = getOriginalFormat(file)
    const effectiveFormat = configFormat ?? originalFormat

    const { mimeType, extension } = getMimeAndExtension(effectiveFormat)

    const originalImg = new Image()
    const objectUrl = URL.createObjectURL(file)
    originalImg.src = objectUrl
    await originalImg.decode()
    URL.revokeObjectURL(objectUrl)

    const scale = Math.min(1, maxWidth / originalImg.width, maxHeight / originalImg.height)
    const width = Math.round(originalImg.width * scale)
    const height = Math.round(originalImg.height * scale)

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    ctx.drawImage(originalImg, 0, 0, width, height)

    const previewUrl = canvas.toDataURL(mimeType, quality)

    const optimizedBlob = await new Promise(resolve => {
        canvas.toBlob(resolve, mimeType, quality)
    })

    if (!optimizedBlob) return null

    const baseName = file.name.replace(/\.[^/.]+$/, "")
    const newFilename = `${baseName}.${extension}`

    const optimizedFile = new File([ optimizedBlob ], newFilename, { type: optimizedBlob.type })

    return {
        optimizedFile,
        previewUrl,
        width,
        height,
        filename: newFilename,
        size: optimizedBlob.size,
    }
}

function getOriginalFormat(file) {
    const type = file.type.toLowerCase()
    const ext = file.name.split(".").pop()?.toLowerCase()

    if (type === "image/jpeg" || ext === "jpg" || ext === "jpeg") return "jpeg"
    if (type === "image/png" || ext === "png") return "png"
    if (type === "image/webp" || ext === "webp") return "webp"
    if (type === "image/avif" || ext === "avif") return "avif"

    return "webp"
}

function getMimeAndExtension(format) {
    switch (format) {
        case "jpeg":
        case "jpg":
            return { mimeType: "image/jpeg", extension: "jpg" }
        case "png":
            return { mimeType: "image/png", extension: "png" }
        case "webp":
            return { mimeType: "image/webp", extension: "webp" }
        case "avif":
            return { mimeType: "image/avif", extension: "avif" }
        default:
            return { mimeType: "image/webp", extension: "webp" }
    }
}
