import { put } from "@vercel/blob"
import type { StoragePort } from "../../domain/ports/storage-port"

export class VercelBlobStorage implements StoragePort {
  async upload(
    filename: string,
    data: Buffer,
    contentType: string
  ): Promise<{ url: string; pathname: string }> {
    const blob = await put(filename, data, {
      access: "public",
      contentType,
    })
    return { url: blob.url, pathname: blob.pathname }
  }

  async getUrl(pathname: string): Promise<string> {
    // Vercel Blob URLs are deterministic based on pathname
    // The actual URL is stored in payment metadata
    return pathname
  }
}
