export interface StoragePort {
  upload(
    filename: string,
    data: Buffer,
    contentType: string
  ): Promise<{ url: string; pathname: string }>
  getUrl(pathname: string): Promise<string>
}
