import { censor, Fields } from './Announcement'
describe('censor', () => {
  const ANNOUNCEMENTS: Fields[] = [
    { block: ['us', 'np'], live: true, text: 'no kimchi fries', link: 'example.us' },
    { block: ['uk'], live: true, text: 'brexit', link: 'example.co.uk' },
    { block: [], live: true, text: 'none', link: 'example.com' },
    { live: true, text: 'no array', link: 'example.com' },
  ]
  describe('when an announcment contains the given country lowercase', () => {
    it('removes the anouncment from list', () => {
      expect(censor(ANNOUNCEMENTS, 'us')).toEqual([
        { block: ['uk'], live: true, text: 'brexit', link: 'example.co.uk' },
        { block: [], live: true, text: 'none', link: 'example.com' },
        { live: true, text: 'no array', link: 'example.com' },
      ])
    })
  })

  describe('when an announcment contains the given country uppercase', () => {
    it('removes the anouncment from list', () => {
      expect(censor(ANNOUNCEMENTS, 'NP')).toEqual([
        { block: ['uk'], live: true, text: 'brexit', link: 'example.co.uk' },
        { block: [], live: true, text: 'none', link: 'example.com' },
        { live: true, text: 'no array', link: 'example.com' },
      ])
    })
  })
  describe('when an announcment does not contain the given country', () => {
    it('makes no modification to list', () => {
      expect(censor(ANNOUNCEMENTS, 'au')).toEqual(ANNOUNCEMENTS)
    })
  })

  describe('when announcment is blocked but country is not found', () => {
    it('returns the unblocked announcement', () => {
      expect(censor(ANNOUNCEMENTS, null)).toEqual([
        { live: true, text: 'no array', link: 'example.com' },
      ])
    })
  })
})
