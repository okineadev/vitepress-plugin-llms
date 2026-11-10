import { millify } from 'millify'
import pc from 'picocolors'
import { estimateTokenCount } from 'tokenx'

import { getHumanReadableSizeOf } from '@/utils/helpers'
import log from '@/utils/logger'
import { expandTemplate } from '@/utils/template-utils'

function logGeneratedFile({
	file,
	content,
	count,
	full,
}: {
	file: string
	content: string
	count: number
	full: boolean
}): void {
	const variables = {
		file: pc.cyan(file),
		fileCount: pc.bold(count.toString()),
		size: pc.bold(getHumanReadableSizeOf(content)),
		tokens: pc.bold(millify(estimateTokenCount(content))),
	}
	const template = full
		? 'Generated {file} (~{tokens} tokens, {size}) with {fileCount} markdown files'
		: 'Generated {file} (~{tokens} tokens, {size}) with {fileCount} documentation links'
	log.success(expandTemplate(template, variables))
}

export default logGeneratedFile
