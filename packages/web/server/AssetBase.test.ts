import { _normalize as normalize } from './AssetBase'

const tags = {
  '123': { Name: 'Prosperity' },
  '234': { Name: 'Regeneration' },
}

describe('AssetBase', () => {
  describe('#normalize', () => {
    it('returns objecg with tag id converted to names and nice preview', () => {
      const thumbnail = {
        url: 'thumb.com',
        width: 100,
        height: 100,
      }
      const icon = {
        Name: 'Test',
        Preview: [
          {
            id: 'x',
            url: 'example.com',
            filename: 'test.zip',
            size: 200,
            type: 'image',
            thumbnails: { small: thumbnail, large: thumbnail, full: thumbnail },
          },
        ],
        Tags: ['234'],
        Description: 'example of working icon',
        Zip: [{ id: 'x', url: 'celo.org', filename: 'test.zip', size: 200, type: 'file' }],
        Terms: true,
        Order: 1,
      }
      expect(normalize(icon, 'id', tags)).toEqual({
        description: 'example of working icon',
        id: 'id',
        name: 'Test',
        preview: 'thumb.com',
        tags: ['Regeneration'],
        uri: 'celo.org',
      })
    })
  })
})
