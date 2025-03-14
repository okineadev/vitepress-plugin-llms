import pc from 'picocolors'

/**
 * Log prefix styling with plugin name and separator
 * @constant {string}
 */
const logPrefix = pc.blue('llmstxt') + pc.dim(' » ')

/** Logger object with standardized logging methods */
const log = {
	/**
	 * Logs informational messages
	 * @param {string} message - The message to log
	 * @example
	 * log.info('Starting process')
	 */
	info: (message: string) => console.log(`${logPrefix}  ${message}`),

	/**
	 * Logs success messages with a green checkmark
	 * @param {string} message - The success message to log
	 * @example
	 * log.success('File copied successfully')
	 */
	success: (message: string) =>
		console.log(`${logPrefix}${pc.green('✓')} ${message}`),

	/**
	 * Logs warning messages with a yellow warning symbol
	 * @param {string} message - The warning message to log
	 * @example
	 * log.warn('No files found to process')
	 */
	warn: (message: string) =>
		console.warn(`${logPrefix}${pc.yellow('⚠')} ${pc.yellow(message)}`),

	/**
	 * Logs error messages with a red X symbol
	 * @param {string} message - The error message to log
	 * @example
	 * log.error('Failed to copy file')
	 */
	error: (message: string) =>
		console.error(`${logPrefix}${pc.red('✗')} ${pc.red(message)}`),
}

export default log
