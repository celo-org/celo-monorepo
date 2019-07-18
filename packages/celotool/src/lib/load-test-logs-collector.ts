import {
  LOG_TAG_BLOCKSCOUT_TIME_MEASUREMENT,
  LOG_TAG_BLOCKSCOUT_TIMEOUT,
  LOG_TAG_BLOCKSCOUT_VALIDATION_ERROR,
  LOG_TAG_GETH_RPC_ERROR,
  LOG_TAG_TRANSACTION_ERROR,
  LOG_TAG_TRANSACTION_VALIDATION_ERROR,
  LOG_TAG_TX_TIME_MEASUREMENT,
} from 'src/lib/geth'

export interface TimeStatsBase {
  count: number
  totalTime: number
  maximalTime: number
  minimalTime: number
}

export interface TimeStatsAccumulated extends TimeStatsBase {
  durations: number[]
}

export interface BlockscoutStats extends TimeStatsAccumulated {
  timeouts: number
  validationErrors: any[]
}

export interface ErrorsStatsBase {
  count: number
  errors: any[]
}

export interface TransactionsErrorsState extends ErrorsStatsBase {
  validationCount: number
  validationErrors: any[]
}

export interface LogsAggregator {
  /* State storage */
  podsStats: any
  blockscoutStats: BlockscoutStats
  transactionsStats: { [key: string]: TimeStatsAccumulated }
  transactionsErrors: { [key: string]: TransactionsErrorsState }
  gethRPCErrors: any[]

  /* Public handler for mutating the state */
  handleNewEntry: (json: any) => void

  handleMultipleEntries: (messages: any[]) => void

  /* Returns summry in JSON */
  getSummary: () => string

  /* Helper functions */
  _initTransactionsStatsForToken: (token: string) => void
  _initTransactionsErrorsForToken: (token: string) => void
  _updateTimeStats: (json: any, statsStorage: TimeStatsAccumulated) => void

  /* State mutators depending on the event type */
  _handleTxTimeMeasurement: (json: any, token: string) => void
  _handleTxError: (json: any, token: string) => void
  _handleTxValidationError: (json: any, token: string) => void
  _handleBlockscoutTimeout: () => void
  _handleBlockscoutTimeMeasurement: (json: any) => void
  _handleBlockscoutValidationError: (json: any) => void
  _handleGethRPCError: (json: any) => void
}

export const createLogsAggregator = () => {
  const allowedTags = [
    LOG_TAG_TX_TIME_MEASUREMENT,
    LOG_TAG_BLOCKSCOUT_TIME_MEASUREMENT,
    LOG_TAG_TRANSACTION_ERROR,
    LOG_TAG_TRANSACTION_VALIDATION_ERROR,
    LOG_TAG_BLOCKSCOUT_TIMEOUT,
    LOG_TAG_BLOCKSCOUT_VALIDATION_ERROR,
    LOG_TAG_GETH_RPC_ERROR,
  ]

  const logsAggregator: LogsAggregator = {
    podsStats: {},
    blockscoutStats: {
      count: 0,
      totalTime: 0,
      maximalTime: 0,
      minimalTime: Number.MAX_SAFE_INTEGER,
      timeouts: 0,
      validationErrors: [],
      durations: [],
    },
    transactionsStats: {},
    transactionsErrors: {},
    gethRPCErrors: [],

    _initTransactionsStatsForToken(token: string) {
      if (!this.transactionsStats[token]) {
        this.transactionsStats[token] = {
          count: 0,
          totalTime: 0,
          maximalTime: 0,
          minimalTime: Number.MAX_SAFE_INTEGER,
          durations: [],
        }
      }
    },
    _initTransactionsErrorsForToken(token: string) {
      if (!this.transactionsErrors[token]) {
        this.transactionsErrors[token] = {
          count: 0,
          errors: [],
          validationCount: 0,
          validationErrors: [],
        }
      }
    },
    _updateTimeStats(json: any, statsStorage: TimeStatsAccumulated) {
      try {
        const timeTaken = parseInt(json.p_time, 10)
        statsStorage.count += 1
        statsStorage.totalTime += timeTaken
        statsStorage.maximalTime = Math.max(statsStorage.maximalTime, timeTaken)
        statsStorage.minimalTime = Math.min(statsStorage.minimalTime, timeTaken)
        statsStorage.durations.push(timeTaken)
      } catch (ignored) {
        // ignore errors
      }
    },

    _handleTxTimeMeasurement(json: any, token: string) {
      this._initTransactionsStatsForToken(token)
      this._updateTimeStats(json, this.transactionsStats[token])
    },
    _handleTxError(json: any, token: string) {
      this._initTransactionsErrorsForToken(token)
      if (json.error) {
        this.transactionsErrors[token].count += 1
        this.transactionsErrors[token].errors.push(json.error)
      }
    },
    _handleTxValidationError(json: any, token: string) {
      this._initTransactionsErrorsForToken(token)
      if (json.error) {
        this.transactionsErrors[token].validationCount += 1
        this.transactionsErrors[token].validationErrors.push(json.error)
      }
    },
    _handleBlockscoutTimeout() {
      this.blockscoutStats.timeouts += 1
    },
    _handleBlockscoutTimeMeasurement(json: any) {
      this._updateTimeStats(json, this.blockscoutStats)
    },
    _handleBlockscoutValidationError(json: any) {
      if (json.error) {
        this.blockscoutStats.validationErrors.push(json.error)
      }
    },
    _handleGethRPCError(json: any) {
      if (json.error) {
        this.gethRPCErrors.push(json.error)
      }
    },

    handleMultipleEntries(messages: any[]) {
      messages.forEach((json) => {
        this.handleNewEntry(json)
      })
    },

    handleNewEntry(json: any) {
      if (allowedTags.indexOf(json.tag) < 0) {
        return
      }

      if (!this.podsStats[json.podID]) {
        this.podsStats[json.podID] = 1
      } else {
        this.podsStats[json.podID] += 1
      }

      const token = json.token
      switch (json.tag) {
        case LOG_TAG_TX_TIME_MEASUREMENT:
          this._handleTxTimeMeasurement(json, token)
          break

        case LOG_TAG_TRANSACTION_ERROR:
          this._handleTxError(json, token)
          break

        case LOG_TAG_TRANSACTION_VALIDATION_ERROR:
          this._handleTxValidationError(json, token)
          break

        case LOG_TAG_BLOCKSCOUT_TIME_MEASUREMENT:
          this._handleBlockscoutTimeMeasurement(json)
          break

        case LOG_TAG_BLOCKSCOUT_TIMEOUT:
          this._handleBlockscoutTimeout()
          break

        case LOG_TAG_BLOCKSCOUT_VALIDATION_ERROR:
          this._handleBlockscoutValidationError(json)
          break

        case LOG_TAG_GETH_RPC_ERROR:
          this._handleGethRPCError(json)
          break

        default:
          break
      }
    },

    getSummary() {
      const collectedLogsSummary = {
        podsStats: this.podsStats,
        blockscoutStats: this.blockscoutStats,
        transactionsStats: this.transactionsStats,
        transactionsErrors: this.transactionsErrors,
        gethRPCErrors: this.gethRPCErrors,
      }

      const summaryJSON = JSON.stringify(collectedLogsSummary, null, 2)

      return summaryJSON
    },
  }

  return logsAggregator
}
