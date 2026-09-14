import type { FilePart, TextPart } from 'ai'
import type { PromptAttachment } from './message-input-types.ts'

type MediaCategory = 'image' | 'video' | 'audio' | 'text' | 'other'

/* tasky: categorize by top-level type prefix so we dont accidentally match "image" in a random subtype */
function categorizeMedia(contentType: string): MediaCategory {
  if (contentType.startsWith('image/')) return 'image'
  if (contentType.startsWith('video/')) return 'video'
  if (contentType.startsWith('audio/')) return 'audio'
  if (contentType.startsWith('text/')) return 'text'
  return 'other'
}

/**
 * Downloads binary content from a URL into a Uint8Array.
 * Returns undefined when the download fails so callers can fall back gracefully.
 */
export async function downloadFile(
  url: string,
  fetchFile: typeof fetch = fetch
): Promise<Uint8Array | undefined> {
  try {
    const response = await fetchFile(url)
    if (!response.ok) return undefined
    const buffer = await response.arrayBuffer()
    return new Uint8Array(buffer)
  } catch {
    return undefined
  }
}

/**
 * Converts a Discord attachment into an AI SDK content part.
 *
 * Images and videos stay as URL file parts. Everything else is downloaded,
 * because Gemini rejects https URLs for file parts. Text becomes a text part;
 * other media is passed as bytes. `fetchFile` is injectable for testing.
 */
export async function attachmentContentPart(
  attachment: PromptAttachment,
  fetchFile: typeof fetch = fetch
): Promise<FilePart | TextPart> {
  const mediaType = attachment.contentType ?? ''
  const category = categorizeMedia(mediaType)

  if (mediaType === '') {
    return { text: `[attachment: ${attachment.url}]`, type: 'text' }
  }

  if (category === 'image' || category === 'video') {
    return { data: new URL(attachment.url), mediaType, type: 'file' }
  }

  const data = await downloadFile(attachment.url, fetchFile)
  if (data === undefined) {
    return { text: `[attachment: ${attachment.url}]`, type: 'text' }
  }

  if (category === 'text') {
    return { text: new TextDecoder().decode(data), type: 'text' }
  }

  return { data, mediaType, type: 'file' }
}
