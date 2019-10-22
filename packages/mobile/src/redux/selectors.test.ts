import { DAYS_TO_BACKUP, DAYS_TO_DELAY } from 'src/backup/utils'
import { disabledDueToNoBackup } from 'src/redux/selectors'

const DAYS_TO_MS = 24 * 60 * 60 * 1000
const MS_TO_BACKUP = DAYS_TO_BACKUP * DAYS_TO_MS
const MS_TO_DELAY = DAYS_TO_DELAY * DAYS_TO_MS

const NOW = new Date().getTime()
const ONE_DAY_AGO = NOW - MS_TO_BACKUP - 10000

describe('redux/selectors', () => {
  describe('disabledDueToNoBackup', () => {
    it('should disable after set days', () => {
      // Created less than 1 day ago
      expect(disabledDueToNoBackup(ONE_DAY_AGO + 20000, false, 0)).toBe(false)
    })

    it('should disable after set days', () => {
      // Created 1 day ago
      expect(disabledDueToNoBackup(ONE_DAY_AGO, false, 0)).toBe(true)
    })

    it('should be enabled if within delay', () => {
      // Created 1 day ago and delayed now
      expect(disabledDueToNoBackup(ONE_DAY_AGO, false, NOW)).toBe(false)
    })

    it('should be disabled after delay', () => {
      // Created 1 day ago and delayed 1 hour ago
      expect(disabledDueToNoBackup(ONE_DAY_AGO, false, NOW + MS_TO_DELAY)).toBe(false)
    })
  })
})
