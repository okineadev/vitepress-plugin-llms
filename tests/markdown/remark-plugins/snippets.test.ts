import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { remark } from 'remark'

// Mock node:fs before importing the plugin
const mockExistsSync = mock(() => true)
const mockReadFileSync = mock(() => 'Included content from file')
const mockStatSync = mock(() => ({ isFile: () => true }))

mock.module('node:fs', () => ({
	default: {
		existsSync: mockExistsSync,
		readFileSync: mockReadFileSync,
		statSync: mockStatSync,
	},
	existsSync: mockExistsSync,
	readFileSync: mockReadFileSync,
	statSync: mockStatSync,
}))

import path from 'node:path'
import dedent from 'dedent'
// Import after mocking
// oxlint-disable-next-line typescript/prefer-ts-expect-error typescript/ban-ts-comment
// @ts-ignore
import remarkInclude from '@/markdown/remark-plugins/snippets'

const workDir = path.resolve('docs')

describe('remark-include simple test', () => {
	beforeEach(() => {
		mockExistsSync.mockReset()
		mockReadFileSync.mockReset()
		mockStatSync.mockReset()

		mockExistsSync.mockReturnValue(true)
		mockStatSync.mockReturnValue({ isFile: () => true })
	})

	it('should process basic include', async () => {
		mockReadFileSync.mockReturnValueOnce('Hello from included file!')

		const processor = remark().use(
			remarkInclude({
				srcDir: workDir,
			}),
		)

		const markdown = '# Main\n<!--@include: ./test.md-->\n# End'
		const result = await processor.process({
			cwd: workDir,
			path: path.join(workDir, 'main.md'),
			value: markdown,
		})

		const output = String(result)
		expect(output).toMatchInlineSnapshot(`
		  "# Main

		  Hello from included file!

		  # End
		  "
		`)
	})

	it('should handle missing files', async () => {
		mockExistsSync.mockReturnValue(false)

		const processor = remark().use(
			remarkInclude({
				srcDir: '/test',
			}),
		)

		const markdown = '# Main\n<!--@include: ./missing.md-->\n# End'
		const result = await processor.process(markdown)

		const output = String(result)
		// Should keep the original include comment when file is missing
		expect(output).toContain('<!--@include: ./missing.md-->')
	})

	it('should handle line ranges', async () => {
		const fileContent = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5'
		mockReadFileSync.mockReturnValue(fileContent)

		const processor = remark().use(
			remarkInclude({
				srcDir: workDir,
			}),
		)

		const markdown = '<!--@include: ./test.md{2,4}-->'
		const result = await processor.process({
			cwd: workDir,
			path: path.join(workDir, 'main.md'),
			value: markdown,
		})

		const output = String(result)

		expect(output).toContain('Line 2')
		expect(output).toContain('Line 3')
		expect(output).toContain('Line 4')
		expect(output).not.toContain('Line 1')
		expect(output).not.toContain('Line 5')
	})

	it('should handle line ranges without ending', async () => {
		const fileContent = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5'
		mockReadFileSync.mockReturnValue(fileContent)

		const processor = remark().use(
			remarkInclude({
				srcDir: workDir,
			}),
		)

		const markdown = '<!--@include: ./test.md{2,}-->'
		const result = await processor.process({
			cwd: workDir,
			path: path.join(workDir, 'main.md'),
			value: markdown,
		})

		const output = String(result)

		expect(output).toContain('Line 2')
		expect(output).toContain('Line 3')
		expect(output).toContain('Line 4')
		expect(output).not.toContain('Line 1')
	})

	it('should handle regions', async () => {
		const fileContent = `Before region
<!-- #region test -->
Inside region content
<!-- #endregion test -->
After region`

		mockReadFileSync.mockReturnValue(fileContent)

		const processor = remark().use(
			remarkInclude({
				srcDir: workDir,
			}),
		)

		const markdown = '<!--@include: ./test.md#test-->'
		const result = await processor.process({
			cwd: workDir,
			path: path.join(workDir, 'main.md'),
			value: markdown,
		})

		const output = String(result)

		expect(output).toContain('Inside region content')
		expect(output).not.toContain('Before region')
		expect(output).not.toContain('After region')
	})

	it('should handle @ prefix', async () => {
		mockReadFileSync.mockReturnValue('Content from source root')

		const processor = remark().use(
			remarkInclude({
				srcDir: path.resolve('/source/root'),
			}),
		)

		const markdown = '<!--@include: @/config/file.md-->'
		const result = await processor.process(markdown)

		const output = String(result)
		expect(output).toContain('Content from source root')

		// Check that the path was resolved from srcDir
		expect(mockReadFileSync).toHaveBeenCalledWith(
			expect.stringMatching(path.resolve('/source/root/config/file.md')),
			'utf-8',
		)
	})
})

describe('remark-include code snippets', () => {
	beforeEach(() => {
		mockExistsSync.mockReset()
		mockReadFileSync.mockReset()
		mockStatSync.mockReset()

		mockExistsSync.mockReturnValue(true)
		mockStatSync.mockReturnValue({ isFile: () => true })
	})

	it('should process basic code snippet', async () => {
		const jsCode = `function hello() {
  console.log("Hello World!");
}`
		mockReadFileSync.mockReturnValueOnce(jsCode)

		const processor = remark().use(
			remarkInclude({
				srcDir: '/test',
			}),
		)

		const markdown = '# Example\n<<< @/example.js\n# End'
		const result = await processor.process(markdown)

		const output = String(result)
		expect(output).toMatchInlineSnapshot(`
		  "# Example

		  \`\`\`js
		  function hello() {
		    console.log("Hello World!");
		  }
		  \`\`\`

		  # End
		  "
		`)
		expect(mockExistsSync).toHaveBeenCalledTimes(1)
		expect(mockReadFileSync).toHaveBeenCalledTimes(1)
	})

	it('should handle snippet with custom language', async () => {
		const code = `print("Hello Python!")`
		mockReadFileSync.mockReturnValue(code)

		const processor = remark().use(
			remarkInclude({
				srcDir: '/test',
			}),
		)

		const markdown = '<<< @/example.py{python}'
		const result = await processor.process(markdown)

		const output = String(result)
		expect(output).toMatchInlineSnapshot(`
		  "\`\`\`python
		  print("Hello Python!")
		  \`\`\`
		  "
		`)
	})

	it('should handle snippet with title', async () => {
		const code = `const greeting = "Hello!";`
		mockReadFileSync.mockReturnValue(code)

		const processor = remark().use(
			remarkInclude({
				srcDir: '/test',
			}),
		)

		const markdown = '<<< @/example.js[My Example]'
		const result = await processor.process(markdown)

		const output = String(result)
		expect(output).toMatchInlineSnapshot(`
		  "\`\`\`js[My Example]
		  const greeting = "Hello!";
		  \`\`\`
		  "
		`)
	})

	it('should handle snippet with highlighted line ranges', async () => {
		const code = dedent`
			Line 1: import
			Line 2: function start
			Line 3: console.log
			Line 4: function end
			Line 5: export
		`
		mockReadFileSync.mockReturnValue(code)

		const processor = remark().use(
			remarkInclude({
				srcDir: '/test',
			}),
		)

		const markdown = '<<< @/example.js{2-4}'
		const result = await processor.process(markdown)

		const output = String(result)
		expect(output).toMatchInlineSnapshot(`
		  "\`\`\`js{2-4}
		  Line 1: import
		  Line 2: function start
		  Line 3: console.log
		  Line 4: function end
		  Line 5: export
		  \`\`\`
		  "
		`)
	})

	it('should handle snippet with regions', async () => {
		const code = `// Before region
// #region auth
function login(user) {
  return authenticate(user);
}
// #endregion auth
// After region`

		mockReadFileSync.mockReturnValue(code)

		const processor = remark().use(
			remarkInclude({
				srcDir: '/test',
			}),
		)

		const markdown = '<<< @/auth.js#auth'
		const result = await processor.process(markdown)

		const output = String(result)
		expect(output).toMatchInlineSnapshot(`
		  "\`\`\`js
		  function login(user) {
		    return authenticate(user);
		  }
		  \`\`\`
		  "
		`)
	})

	it('should handle snippet with all options', async () => {
		const code = `// #region utils
function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}
// #endregion utils`

		mockReadFileSync.mockReturnValue(code)

		const processor = remark().use(
			remarkInclude({
				srcDir: '/test',
			}),
		)

		const markdown = '<<< @/math.js#utils{1,5 typescript class="highlight"}[Math Utils]'
		const result = await processor.process(markdown)

		const output = String(result)
		expect(output).toMatchInlineSnapshot(`
		  "\`\`\`typescript{1,5}[Math Utils] class="highlight"
		  function add(a, b) {
		    return a + b;
		  }

		  function multiply(a, b) {
		    return a * b;
		  }
		  \`\`\`
		  "
		`)
	})

	it('should handle missing snippet files', async () => {
		mockExistsSync.mockReturnValue(false)

		const processor = remark().use(
			remarkInclude({
				srcDir: '/test',
			}),
		)

		const markdown = '# Example\n<<< @/missing.js\n# End'
		const result = await processor.process(markdown)

		const output = String(result)
		// Should keep the original snippet syntax when file is missing
		expect(output).toMatchInlineSnapshot(`
		  "# Example

		  <<< @/missing.js

		  # End
		  "
		`)
	})

	it('should handle relative paths in snippets', async () => {
		const code = `console.log("Relative path test");`
		mockReadFileSync.mockReturnValue(code)

		const processor = remark().use(
			remarkInclude({
				srcDir: workDir,
			}),
		)

		const markdown = '<<< ./relative/example.js'
		const result = await processor.process({
			cwd: workDir,
			path: path.join(workDir, 'main.md'),
			value: markdown,
		})

		const output = String(result)
		expect(output).toMatchInlineSnapshot(`
		  "\`\`\`js
		  console.log("Relative path test");
		  \`\`\`
		  "
		`)

		// Check that relative path was resolved correctly
		expect(mockReadFileSync).toHaveBeenCalledWith(expect.stringMatching(/relative[/\\]example\.js$/), 'utf-8')
	})

	it('should handle different file extensions', async () => {
		const pythonCode = `def hello():
    print("Hello from Python!")`
		mockReadFileSync.mockReturnValue(pythonCode)

		const processor = remark().use(
			remarkInclude({
				srcDir: '/test',
			}),
		)

		const markdown = '<<< @/example.py'
		const result = await processor.process(markdown)

		const output = String(result)
		expect(output).toMatchInlineSnapshot(`
		  "\`\`\`py
		  def hello():
		      print("Hello from Python!")
		  \`\`\`
		  "
		`)
	})

	it('should handle HTML region markers in snippets', async () => {
		const htmlCode = `<div>
<!-- #region content -->
<h1>Title</h1>
<p>Content here</p>
<!-- #endregion content -->
</div>`

		mockReadFileSync.mockReturnValue(htmlCode)

		const processor = remark().use(
			remarkInclude({
				srcDir: '/test',
			}),
		)

		const markdown = '<<< @/template.html#content'
		const result = await processor.process(markdown)

		const output = String(result)
		expect(output).toMatchInlineSnapshot(`
		  "\`\`\`html
		  <h1>Title</h1>
		  <p>Content here</p>
		  \`\`\`
		  "
		`)
	})

	it('should handle CSS region markers in snippets', async () => {
		const cssCode = `/* #region layout */
.container {
  max-width: 1200px;
  margin: 0 auto;
}
/* #endregion layout */

.other-styles {
  color: red;
}`

		mockReadFileSync.mockReturnValue(cssCode)

		const processor = remark().use(
			remarkInclude({
				srcDir: '/test',
			}),
		)

		const markdown = '<<< @/styles.css#layout'
		const result = await processor.process(markdown)

		const output = String(result)
		expect(output).toMatchInlineSnapshot(`
		  "\`\`\`css
		  .container {
		    max-width: 1200px;
		    margin: 0 auto;
		  }
		  \`\`\`
		  "
		`)
	})
})
