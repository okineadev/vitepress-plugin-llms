// oxlint-disable import/prefer-default-export
const VP_PARAMS_MARKER_REGEX = /^__VP_PARAMS_START([\s\S]+?)__VP_PARAMS_END__/

export function processVPParams(content: string): string {
	let params: Record<string, string> = {}

	content = content.replace(VP_PARAMS_MARKER_REGEX, (_, paramsString: string) => {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		params = JSON.parse(paramsString) as Record<string, string>

		return ''
	})

	if (Object.keys(params).length > 0) {
		content = content.replaceAll(
			/\{\{\s*\$params\.([\s\S]+?)\s*\}\}/g,
			(_, paramKey: string) => params[paramKey] ?? '',
		)
	}

	return content
}
