// oxlint-disable typescript/no-inferrable-types
//#region Regexes
export const includesRE: RegExp = /<!--\s*@include:\s*(?<path>.*?)\s*-->/gu
export const snippetRE: RegExp = /^<<<\s*(?<path>.*?)$/gmu
export const regionRE: RegExp = /(?<region>#[^\s{]+)/u
export const rangeRE: RegExp = /\{(?<start>\d*),(?<end>\d*)\}$/u

/**
 * Raw path format: "/path/to/file.extension#region {meta} [title]" where #region, {meta} and [title] are
 * optional meta can be like '1,2,4-6 lang', 'lang' or '1,2,4-6' lang can contain special characters like C++,
 * C#, F#, etc. path can be relative to the current file or absolute file extension is optional path can
 * contain spaces and dots
 *
 * Captures: ['/path/to/file.extension', 'extension', '#region', '{meta}', '[title]']
 */
export const rawPathRegexp: RegExp =
	// oxlint-disable-next-line require-unicode-regexp
	/^(?<path>.+?(?:(?:\.(?<extension>[a-z0-9]+))?))(?:(?<region>#[\w-]+))?(?: ?(?:{(?<lines>\d+(?:[,-]\d+)*)? ?(?<language>\S+)? ?(?<meta>\S+)?}))? ?(?:\[(?<title>.+)\])?$/

// VitePress region markers
export const markers: {
	end: RegExp
	start: RegExp
}[] = [
	{
		end: /^\s*\/\/\s*#?endregion\b\s*(?<name>.*?)\s*$/u,
		start: /^\s*\/\/\s*#?region\b\s*(?<name>.*?)\s*$/u,
	},
	{
		end: /^\s*<!--\s*#?endregion\b\s*(?<name>.*?)\s*-->/u,
		start: /^\s*<!--\s*#?region\b\s*(?<name>.*?)\s*-->/u,
	},
	{
		end: /^\s*\/\*\s*#endregion\b\s*(?<name>.*?)\s*\*\//u,
		start: /^\s*\/\*\s*#region\b\s*(?<name>.*?)\s*\*\//u,
	},
	{
		// Spellchecker:disable
		end: /^\s*#[eE]nd ?[rR]egion\b\s*(?<name>.*?)\s*$/u,
		start: /^\s*#[rR]egion\b\s*(?<name>.*?)\s*$/u,
		// Spellchecker:enable
	},
	{
		end: /^\s*#\s*#?endregion\b\s*(?<name>.*?)\s*$/u,
		start: /^\s*#\s*#?region\b\s*(?<name>.*?)\s*$/u,
	},
	{
		end: /^\s*(?:--|::|@?REM)\s*#endregion\b\s*(?<name>.*?)\s*$/u,
		start: /^\s*(?:--|::|@?REM)\s*#region\b\s*(?<name>.*?)\s*$/u,
	},
	{
		end: /^\s*#pragma\s+endregion\b\s*(?<name>.*?)\s*$/u,
		start: /^\s*#pragma\s+region\b\s*(?<name>.*?)\s*$/u,
	},
	{
		end: /^\s*\(\*\s*#endregion\b\s*(?<name>.*?)\s*\*\)/u,
		start: /^\s*\(\*\s*#region\b\s*(?<name>.*?)\s*\*\)/u,
	},
] as const
//#endregion
