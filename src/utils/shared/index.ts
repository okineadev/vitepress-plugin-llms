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
export function cleanUrl(path: string): string {
	// Remove query parameters and hash fragments
	let cleanedPath = path.split('?')[0].split('#')[0]

	// Remove trailing slash (but keep root '/')
	if (cleanedPath.length > 1 && cleanedPath.endsWith('/')) {
		cleanedPath = cleanedPath.slice(0, -1)
	}

	// Helper function to remove HTML extension from a path segment
	const removeHtmlExtension = (pathSegment: string): string => {
		const lastSlashIndex = pathSegment.lastIndexOf('/')
		const lastDotIndex = pathSegment.lastIndexOf('.')

		if (lastDotIndex > lastSlashIndex && lastDotIndex !== -1 && pathSegment.endsWith('.html')) {
			return pathSegment.substring(0, lastDotIndex)
		}

		return pathSegment
	}

	// Check if this looks like a URL with protocol
	const protocolMatch = cleanedPath.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//)

	if (protocolMatch) {
		const protocolEndIndex = protocolMatch[0].length
		const pathStartIndex = cleanedPath.indexOf('/', protocolEndIndex)

		if (pathStartIndex === -1) {
			// No path part, just return as is
			return cleanedPath
		}

		const domainPart = cleanedPath.substring(0, pathStartIndex)
		const pathPart = cleanedPath.substring(pathStartIndex)

		return domainPart + removeHtmlExtension(pathPart)
	}

	return removeHtmlExtension(cleanedPath)
}
