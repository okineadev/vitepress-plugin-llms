const removeHtmlExtension = (pathSegment: string): string => {
	const lastSlashIndex = pathSegment.lastIndexOf('/')
	const lastDotIndex = pathSegment.lastIndexOf('.')

	if (lastDotIndex > lastSlashIndex && lastDotIndex !== -1 && pathSegment.endsWith('.html')) {
		return pathSegment.slice(0, lastDotIndex)
	}

	return pathSegment
}

/**
 * Cleans a given URL by removing its file extension from the pathname, if present.
 *
 * This function parses the input URL, removes the file extension from the last path segment
 * if it exists (i.e., if the last dot comes after the last slash), and trims any trailing slash
 * (except for the root path). The returned URL excludes query parameters and hash fragments.
 *
 * @param url - The full URL string to clean.
 * @returns The cleaned URL string with the file extension removed from the pathname.
 *
 * @example
 * cleanUrl('https://example.com/docs/page.md')          // 'https://example.com/docs/page'
 * cleanUrl('https://example.com/docs/')                 // 'https://example.com/docs'
 * cleanUrl('https://example.com/docs/page.md?query=1')  // 'https://example.com/docs/page'
 */
export function cleanUrl(url: string): string {
	const { origin, pathname } = new URL(url)

	const pathnameWithoutTrailingSlash = pathname.replace(/\/+$/, '')

	if (pathname.length > 0) {
		return origin + removeHtmlExtension(pathnameWithoutTrailingSlash)
	}
		return origin
	
}

export function resolveMarkdownPageURL(url: string): string {
	const cleanedURL = cleanUrl(url)

	// If the URL is the root of the site, append 'index.md'
	if (cleanedURL === window.location.origin) {
		return `${cleanedURL}/index.md`
	}
		return `${cleanedURL}.md`
	
}

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
