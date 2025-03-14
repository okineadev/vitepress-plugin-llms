import path from 'node:path'

// Helper function to extract title from markdown file
export function extractTitle(content: string): string {
	// Look for first # heading
	const titleMatch = content.match(/^#\s+(.+)$/m)
	if (titleMatch?.[1]) {
		return titleMatch[1].trim()
	}

	// If no h1 heading, try to find the first line with content
	const lines = content.split('\n').map((line) => line.trim())
	for (const line of lines) {
		if (line && !line.startsWith('#') && !line.startsWith('---')) {
			return line.substring(0, 50) + (line.length > 50 ? '...' : '')
		}
	}

	// Fallback to filename if no title found
	return 'Untitled section'
}

/** Strip file extension */
export const stripExt = (filepath: string) =>
	path.basename(filepath, path.extname(filepath))
