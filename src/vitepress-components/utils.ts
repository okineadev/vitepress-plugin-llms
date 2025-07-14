export { cleanUrl } from '@/utils/shared'

/**
 * Triggers a file download in the browser with the specified filename and content.
 *
 * @param filename - The name for the downloaded file (e.g., 'report.txt').
 * @param content - The content of the file. Can be a string or other Blob-compatible data.
 * @param blobType - The MIME type of the content (e.g., 'text/plain', 'application/json').
 *
 * @example
 * downloadFile('hello.txt', 'Hello, world!');
 */
export function downloadFile(filename: string, content: string | Blob, blobType = 'text/plain'): void {
	const blob = content instanceof Blob ? content : new Blob([content], { type: blobType })
	const url = URL.createObjectURL(blob)

	Object.assign(document.createElement('a'), {
		href: url,
		download: filename,
	}).click()

	URL.revokeObjectURL(url)
}
