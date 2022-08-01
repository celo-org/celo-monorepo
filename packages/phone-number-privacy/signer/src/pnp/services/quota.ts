// import { retryAsyncWithBackOffAndTimeout } from '@celo/base'
import { ContractKit } from '@celo/contractkit'
import {
  ErrorMessage,
  PnpQuotaRequest,
  SignMessageRequest,
} from '@celo/phone-number-privacy-common'
import BigNumber from 'bignumber.js'
import { Knex } from 'knex'
import { config } from '../../config'
// import { Histograms } from '../../../common/metrics'
import { getPerformedQueryCount, incrementQueryCount } from '../../common/database/wrappers/account'
import { storeRequest } from '../../common/database/wrappers/request'
import { Histograms } from '../../common/metrics'
import { OdisQuotaStatusResult, QuotaService } from '../../common/quota'
import { getBlockNumber, getOnChainOdisBalance, meter } from '../../common/web3/contracts'
import { PnpSession } from '../session'
export interface PnpQuotaStatus {
  queryCount: number
  totalQuota: number
  blockNumber: number
}

export class PnpQuotaService implements QuotaService<SignMessageRequest | PnpQuotaRequest> {
  constructor(readonly db: Knex, readonly kit: ContractKit) {}

  // public async checkAndUpdateQuotaStatus_old(
  //   state: PnpQuotaStatus,
  //   session: PnpSession<SignMessageRequest>,
  //   trx: Knex.Transaction
  // ): Promise<OdisQuotaStatusResult<SignMessageRequest>> {
  //   const remainingQuota = state.totalQuota - state.queryCount
  //   Histograms.userRemainingQuotaAtRequest.observe(remainingQuota)
  //   let sufficient = remainingQuota > 0
  //   if (!sufficient) {
  //     session.logger.debug({ ...state }, 'No remaining quota')
  //     if (this.bypassQuotaForE2ETesting(session.request.body)) {
  //       Counters.testQuotaBypassedRequests.inc()
  //       session.logger.info(
  //         { request: session.request.body },
  //         'Request will bypass quota check for e2e testing'
  //       )
  //       sufficient = true
  //     }
  //   } else {
  //     await this.updateQuotaStatus(trx, session)
  //     state.queryCount++
  //   }
  //   return { sufficient, state }
  // }

  // public async getQuotaStatus_old(
  //   session: PnpSession<SignMessageRequest | PnpQuotaRequest>,
  //   trx?: Knex.Transaction
  // ): Promise<PnpQuotaStatus> {
  //   const { account } = session.request.body
  //   const [queryCountResult, totalQuotaResult, blockNumberResult] = await meter(
  //     (_session: PnpSession<SignMessageRequest | PnpQuotaRequest>) =>
  //       Promise.allSettled([
  //         // TODO(Alec)(pnp)
  //         // Note: The database read of the user's queryCount
  //         // included here resolves to 0 on error
  //         getPerformedQueryCount(this.db, account, session.logger, trx),
  //         this.getTotalQuota(_session),
  //         getBlockNumber(this.kit),
  //       ]),
  //     [session],
  //     (err: any) => {
  //       throw err
  //     },
  //     Histograms.getRemainingQueryCountInstrumentation,
  //     'getQuotaStatus'
  //   )

  //   let hadBlockchainError = false
  //   let queryCount = -1
  //   let totalQuota = -1
  //   let blockNumber = -1
  //   if (queryCountResult.status === 'fulfilled') {
  //     queryCount = queryCountResult.value
  //   } else {
  //     session.logger.error(queryCountResult.reason)
  //     session.errors.push(ErrorMessage.DATABASE_GET_FAILURE)
  //   }
  //   if (totalQuotaResult.status === 'fulfilled') {
  //     totalQuota = totalQuotaResult.value
  //   } else {
  //     session.logger.error(totalQuotaResult.reason)
  //     hadBlockchainError = true
  //   }
  //   if (blockNumberResult.status === 'fulfilled') {
  //     blockNumber = blockNumberResult.value
  //   } else {
  //     session.logger.error(blockNumberResult.reason)
  //     hadBlockchainError = true
  //   }
  //   if (hadBlockchainError) {
  //     session.errors.push(ErrorMessage.CONTRACT_GET_FAILURE)
  //   }

  //   return { queryCount, totalQuota, blockNumber }
  // }

  public async checkAndUpdateQuotaStatus(
    _state: PnpQuotaStatus,
    _session: PnpSession<SignMessageRequest>,
    _trx: Knex.Transaction
  ): Promise<OdisQuotaStatusResult<SignMessageRequest>> {
    throw new Error('Method not implemented.')
  }

  public async getQuotaStatus(
    _session: PnpSession<SignMessageRequest | PnpQuotaRequest>,
    _trx?: Knex.Transaction
  ): Promise<PnpQuotaStatus> {
    // TODO EN: ideally this would just subclass the Legacy Service and change the getTotalQuota function ...?
    const { account } = _session.request.body
    const [queryCountResult, totalQuotaResult, blockNumberResult] = await Promise.allSettled([
      // TODO(Alec)(pnp)
      // Note: The database read of the user's queryCount
      // included here resolves to 0 on error
      getPerformedQueryCount(this.db, account, _session.logger, _trx),
      this.getTotalQuota(_session),
      getBlockNumber(this.kit),
    ])

    let hadBlockchainError = false
    let queryCount = -1
    let totalQuota = -1
    let blockNumber = -1
    if (queryCountResult.status === 'fulfilled') {
      queryCount = queryCountResult.value
    } else {
      _session.logger.error(queryCountResult.reason)
      _session.errors.push(ErrorMessage.DATABASE_GET_FAILURE)
    }
    if (totalQuotaResult.status === 'fulfilled') {
      totalQuota = totalQuotaResult.value
    } else {
      _session.logger.error(totalQuotaResult.reason)
      hadBlockchainError = true
    }
    if (blockNumberResult.status === 'fulfilled') {
      blockNumber = blockNumberResult.value
    } else {
      _session.logger.error(blockNumberResult.reason)
      hadBlockchainError = true
    }
    if (hadBlockchainError) {
      _session.errors.push(ErrorMessage.CONTRACT_GET_FAILURE)
    }

    // TODO EN: what to do in case of integer overflow of quota?
    return { queryCount, totalQuota, blockNumber }
  }

  protected async updateQuotaStatus(
    trx: Knex.Transaction,
    session: PnpSession<SignMessageRequest>
  ) {
    // TODO: Review db error handling
    const [requestStored, queryCountIncremented] = await Promise.all([
      storeRequest(this.db, session.request.body, session.logger, trx),
      incrementQueryCount(this.db, session.request.body.account, session.logger, trx),
    ])
    if (!requestStored) {
      session.logger.debug('Did not store request.')
      session.errors.push(ErrorMessage.FAILURE_TO_STORE_REQUEST)
    }
    if (!queryCountIncremented) {
      session.logger.debug('Did not increment query count.')
      session.errors.push(ErrorMessage.FAILURE_TO_INCREMENT_QUERY_COUNT)
    }
  }

  protected async getTotalQuota(
    session: PnpSession<SignMessageRequest | PnpQuotaRequest>
  ): Promise<number> {
    return meter(
      // TODO EN: test the old version of this as this may not work there?
      this.getTotalQuotaWithoutMeter.bind(this),
      [session],
      (err: any) => {
        throw err
      },
      Histograms.getRemainingQueryCountInstrumentation,
      'getTotalQuota'
    )
  }

  /*
   * Calculates how many queries the caller has unlocked based on the algorithm
   * unverifiedQueryCount + verifiedQueryCount + (queryPerTransaction * transactionCount)
   * If the caller is not verified, they must have a minimum balance to get the unverifiedQueryMax.
   */
  private async getTotalQuotaWithoutMeter(
    session: PnpSession<SignMessageRequest | PnpQuotaRequest>
  ): Promise<number> {
    const { queryPriceInCUSD } = config.quota
    const { account } = session.request.body
    const totalPaid = await getOnChainOdisBalance(this.kit, account)
    const totalQuota = totalPaid
      .div(queryPriceInCUSD.times(new BigNumber(1e18)))
      .integerValue(BigNumber.ROUND_DOWN)
    // If any account hits an overflow here, we need to redesign how
    // quota/queries are computed anyways.
    return totalQuota.toNumber()
  }

  // TODO EN: revisit if this is necessary? what does Alec envision about this being different?
  // private bypassQuotaForE2ETesting(requestBody: SignMessageRequest): boolean {
  //   const sessionID = Number(requestBody.sessionID)
  //   return !Number.isNaN(sessionID) && sessionID % 100 < config.test_quota_bypass_percentage
  // }
}
