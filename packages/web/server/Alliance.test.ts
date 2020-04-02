import { Category } from 'src/alliance/CategoryEnum'
import { CATEGORY_FIELD, LOGO_FIELD, normalize, URL_FIELD } from './Alliance'

describe('Alliance', () => {
  describe('normalize', () => {
    const Logo = []
    it('transforms when no logo is attached', () => {
      expect(
        normalize({
          Name: 'Test',
          Approved: true,
          [URL_FIELD]: 'celo.org',
          [CATEGORY_FIELD]: [Category.Build],
          [LOGO_FIELD]: Logo,
        })
      ).toEqual({ name: 'Test', url: 'celo.org', logo: { width: 1, height: 1, uri: '' } })
    })
  })
})
