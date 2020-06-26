import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'

// To avoid over logging, we will average together web3 sync times
// then log the group's average performance stats
const SYNC_BATCH_SIZE = 10

// Tracking running total of duration and count of web3 syncs
// remaining until data is logged
export class Web3SyncAnalyticsTracker {
  totalDuration: number
  syncCountRemaining: number
  firstSync: boolean

  constructor() {
    this.totalDuration = 0.0
    this.syncCountRemaining = 1 // initiatlizing at 1 so first sync is logged alone
    this.firstSync = true
  }

  log = (syncStartTime: number) => {
    this.totalDuration += Date.now() - syncStartTime
    this.syncCountRemaining -= 1

    if (this.syncCountRemaining === 0) {
      this.submit()
      this.resetData()
    }
  }

  submit = () => {
    const syncBatchSize = this.firstSync ? 1 : SYNC_BATCH_SIZE
    CeloAnalytics.track(CustomEventNames.sync_complete, {
      syncMeanDuration: this.totalDuration / syncBatchSize,
      syncBatchSize,
    })
  }

  resetData = () => {
    this.totalDuration = 0
    this.syncCountRemaining = SYNC_BATCH_SIZE
    this.firstSync = false
  }
}
