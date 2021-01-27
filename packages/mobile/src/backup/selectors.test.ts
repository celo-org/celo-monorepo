import { shouldForceBackupSelector } from 'src/backup/selectors'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import { getMockStoreData } from 'test/utils'

const mockCurrentTime = 1552353116086

jest.mock('src/utils/time', () => ({
  ...jest.requireActual('src/utils/time'),
  getRemoteTime: () => mockCurrentTime,
}))

const mockState = (
  accountCreationTime: number,
  backupRequiredTime: number | null,
  backupCompleted: boolean
) =>
  getMockStoreData({
    account: { accountCreationTime, backupRequiredTime, backupCompleted },
  })

describe('backup/selectors', () => {
  describe('shouldForceBackupSelector', () => {
    it("should not force account key prompt if enough time hasn't passed since creation", () => {
      // Account created 12 hours ago, no delay and no backup.
      expect(
        shouldForceBackupSelector(mockState(mockCurrentTime - ONE_DAY_IN_MILLIS * 0.5, null, false))
      ).toBe(false)
    })

    it('should force account key prompt if enough time passed since account creation', () => {
      // Account created 36 hours ago, no delay and no backup.
      expect(
        shouldForceBackupSelector(mockState(mockCurrentTime - ONE_DAY_IN_MILLIS * 1.5, null, false))
      ).toBe(true)
    })

    it('should not force account key prompt if delay button was just pressed', () => {
      // Account created 36 hours ago, delay pressed less than an hour ago and no backup.
      expect(
        shouldForceBackupSelector(
          mockState(mockCurrentTime - ONE_DAY_IN_MILLIS * 1.5, mockCurrentTime + 10, false)
        )
      ).toBe(false)
    })

    it('should force account key prompt if delay button was pressed a while ago', () => {
      // Account created 36 hours ago, delay pressed over an hour ago and no backup.
      expect(
        shouldForceBackupSelector(
          mockState(mockCurrentTime - ONE_DAY_IN_MILLIS * 1.5, mockCurrentTime - 10, false)
        )
      ).toBe(true)
    })

    it('should not force account key prompt if backup was already completed', () => {
      // Account already backed up.
      expect(
        shouldForceBackupSelector(mockState(mockCurrentTime - ONE_DAY_IN_MILLIS * 1.5, null, true))
      ).toBe(false)
    })
  })
})
