const VP_PARAMS_MARKER_REGEX = /^__VP_PARAMS_START([\s\S]+?)__VP_PARAMS_END__/

export function processVPParams(content: string): string {
	let params: Record<string, string> = {}

	content = content.replace(VP_PARAMS_MARKER_REGEX, (_, paramsString) => {
		params = JSON.parse(paramsString)

		return ''
	})

	if (params && Object.keys(params).length > 0) {
		content = content.replace(/\{\{\s*\$params\.([\s\S]+?)\s*\}\}/g, (_, paramKey) => {
			return params[paramKey] ?? ''
		})
	}

	return content
}
