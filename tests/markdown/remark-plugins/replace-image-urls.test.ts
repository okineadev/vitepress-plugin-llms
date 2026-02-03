import { describe, expect, it } from 'bun:test'
import { remark } from 'remark'
// oxlint-disable-next-line typescript/prefer-ts-expect-error typescript/ban-ts-comment
// @ts-ignore
import remarkReplaceImageUrls from '@/markdown/remark-plugins/replace-image-urls'

describe('remarkReplaceImageUrls', () => {
	it('replaces image links with hashed paths', async () => {
		const processor = remark().use(
			remarkReplaceImageUrls(new Map([['vs_code_proxy.png', 'assets/vs_code_proxy.hash.png']])),
		)
		const file = await processor.process('![alt](@/../assets/vs_code_proxy.png)')
		expect(String(file)).toBe('![alt](/assets/vs_code_proxy.hash.png)\n')
	})
})
