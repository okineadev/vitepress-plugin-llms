const VP_PARAMS_MARKER_REGEX = /^__VP_PARAMS_START([\s\S]+?)__VP_PARAMS_END__/

export function processVPParams(content: string): string {
	let params: Record<string, string> = {}

	content = content.replace(VP_PARAMS_MARKER_REGEX, (_, paramsString: string) => {
		// oxlint-disable-next-line typescript/no-unsafe-assignment
		params = JSON.parse(paramsString)

		return ''
	})

	if (Object.keys(params).length > 0) {
		// oxlint-disable-next-line typescript/no-unsafe-assignment typescript/no-unsafe-call
		content = content.replaceAll(/\{\{\s*\$params\.([\s\S]+?)\s*\}\}/g, (_, paramKey: string) => {
			return params[paramKey] ?? ''
		})
	}

	return content
}
