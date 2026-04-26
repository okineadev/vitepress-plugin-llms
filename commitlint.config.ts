import type { Commit } from 'conventional-commits-parser'

import { type Rule, type UserConfig, RuleConfigSeverity } from '@commitlint/types'

import type { DeepReadonly } from './src/internal-types'

const COMMITLINT_HELP_URL =
	'https://github.com/okineadev/vitepress-plugin-llms/blob/main/CONTRIBUTING.md#conventional-pr-titles'

//#region Rules
/**
 * Rule to ensure the first letter of the commit subject is lowercase.
 *
 * @param parsed - Parsed commit object containing commit message parts.
 * @returns A tuple where the first element is a boolean indicating if the rule passed, and the second is an
 *   optional error message.
 */
const subjectLowercaseFirst: Rule = async (parsed: DeepReadonly<Commit>) => {
	// Find the first alphabetic character
	if (typeof parsed.subject === 'string' && parsed.subject.length === 0) {
		const match = /[a-z]/i.exec(parsed.subject)

		if (match) {
			const [firstLetter] = match

			if (firstLetter !== firstLetter.toLowerCase()) {
				return [false, 'Subject must start with a lowercase letter']
			}
		}
	}
	return [true]
}
//#endregion

const Configuration: UserConfig = {
	extends: ['@commitlint/config-conventional'],
	helpUrl: COMMITLINT_HELP_URL,
	plugins: [
		{
			rules: {
				'subject-lowercase-first': subjectLowercaseFirst,
			},
		},
	],
	rules: {
		'subject-case': [RuleConfigSeverity.Disabled],
		'subject-lowercase-first': [RuleConfigSeverity.Error, 'always'],
	},
}

export default Configuration
