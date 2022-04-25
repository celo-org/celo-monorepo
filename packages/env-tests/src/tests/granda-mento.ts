import { sleep } from '@celo/base'
import { StableToken } from '@celo/contractkit'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { describe, test } from '@jest/globals'
import BigNumber from 'bignumber.js'
import Logger from 'bunyan'
import { EnvTestContext } from '../context'
import {
  fundAccountWithCELO,
  fundAccountWithStableToken,
  getKey,
  getValidatorKey,
  ONE,
  TestAccounts,
} from '../scaffold'

export function runGrandaMentoTest(context: EnvTestContext, stableTokensToTest: StableToken[]) {
  const celoAmountToFund = ONE.times(61000)
  const stableTokenAmountToFund = ONE.times(61000)

  const celoAmountToSell = ONE.times(60000)
  const stableTokenAmountToSell = ONE.times(60000)

  describe('Granda Mento Test', () => {
    beforeAll(async () => {
      await fundAccountWithCELO(context, TestAccounts.GrandaMentoExchanger, celoAmountToFund)
    })

    const baseLogger = context.logger.child({ test: 'grandaMento' })

    for (const sellCelo of [true, false]) {
      for (const stableToken of stableTokensToTest) {
        const sellTokenStr = sellCelo ? 'CELO' : stableToken
        const buyTokenStr = sellCelo ? stableToken : 'CELO'
        describe(`selling ${sellTokenStr} for ${buyTokenStr}`, () => {
          beforeAll(async () => {
            if (!sellCelo) {
              await fundAccountWithStableToken(
                context,
                TestAccounts.GrandaMentoExchanger,
                stableTokenAmountToFund,
                stableToken
              )
            }
          })

          let buyToken: GoldTokenWrapper | StableTokenWrapper
          let sellToken: GoldTokenWrapper | StableTokenWrapper
          let stableTokenAddress: string
          let sellAmount: BigNumber

          beforeEach(async () => {
            const goldTokenWrapper = await context.kit.contracts.getGoldToken()
            const stableTokenWrapper = await context.kit.celoTokens.getWrapper(
              stableToken as StableToken
            )
            stableTokenAddress = stableTokenWrapper.address
            if (sellCelo) {
              buyToken = stableTokenWrapper
              sellToken = goldTokenWrapper
              sellAmount = celoAmountToSell
            } else {
              buyToken = goldTokenWrapper
              sellToken = stableTokenWrapper
              sellAmount = stableTokenAmountToSell
            }
          })

          const createExchangeProposal = async (logger: Logger, fromAddress: string) => {
            const grandaMento = await context.kit.contracts.getGrandaMento()
            const tokenApprovalReceipt = await sellToken
              .approve(grandaMento.address, sellAmount.toFixed())
              .sendAndWaitForReceipt({
                from: fromAddress,
              })
            logger.debug(
              {
                sellAmount,
                sellTokenStr,
                spender: grandaMento.address,
              },
              'Approved GrandaMento to spend sell token'
            )
            const minedTokenApprovalTx = await context.kit.web3.eth.getTransaction(
              tokenApprovalReceipt.transactionHash
            )
            const tokenApprovalCeloFees = new BigNumber(tokenApprovalReceipt.gasUsed).times(
              minedTokenApprovalTx.gasPrice
            )

            // Some flakiness has been observed after approving, so we sleep
            await sleep(5000)

            const creationTx = await grandaMento.createExchangeProposal(
              context.kit.celoTokens.getContract(stableToken as StableToken),
              sellAmount,
              sellCelo
            )
            const creationReceipt = await creationTx.sendAndWaitForReceipt({
              from: fromAddress,
            })
            // Some flakiness has been observed after proposing, so we sleep
            await sleep(5000)
            const proposalId =
              creationReceipt.events!.ExchangeProposalCreated.returnValues.proposalId

            logger.debug(
              {
                sellAmount,
                sellCelo,
                proposalId,
              },
              'Created exchange proposal'
            )
            const minedCreationTx = await context.kit.web3.eth.getTransaction(
              creationReceipt.transactionHash
            )
            const creationCeloFees = new BigNumber(creationReceipt.gasUsed).times(
              minedCreationTx.gasPrice
            )
            return {
              creationReceipt,
              minedCreationTx,
              proposalId,
              celoFees: tokenApprovalCeloFees.plus(creationCeloFees),
            }
          }

          test('exchanger creates and cancels an exchange proposal', async () => {
            const from = await getKey(context.mnemonic, TestAccounts.GrandaMentoExchanger)
            context.kit.connection.addAccount(from.privateKey)
            context.kit.defaultAccount = from.address

            const logger = baseLogger.child({ from: from.address })
            const grandaMento = await context.kit.contracts.getGrandaMento()

            const sellTokenBalanceBeforeCreation = await sellToken.balanceOf(from.address)

            const creationInfo = await createExchangeProposal(logger, from.address)
            let celoFees = creationInfo.celoFees

            const sellTokenBalanceAfterCreation = await sellToken.balanceOf(from.address)

            // If we are looking at the CELO balance, take the fees spent into consideration.
            const expectedBalanceDifference = sellCelo ? sellAmount.plus(celoFees) : sellAmount

            expect(
              sellTokenBalanceBeforeCreation.minus(sellTokenBalanceAfterCreation).toString()
            ).toBe(expectedBalanceDifference.toString())

            const cancelReceipt = await grandaMento
              .cancelExchangeProposal(creationInfo.proposalId)
              .sendAndWaitForReceipt({
                from: from.address,
              })
            const minedCancelTx = await context.kit.web3.eth.getTransaction(
              cancelReceipt.transactionHash
            )

            logger.debug(
              {
                proposalId: creationInfo.proposalId,
              },
              'Cancelled exchange proposal'
            )

            celoFees = celoFees.plus(
              new BigNumber(cancelReceipt.gasUsed).times(minedCancelTx.gasPrice)
            )

            const sellTokenBalanceAfterCancel = await sellToken.balanceOf(from.address)
            // If we are looking at the CELO balance, take the fees spent into consideration.
            const expectedBalance = sellCelo
              ? sellTokenBalanceBeforeCreation.minus(celoFees)
              : sellTokenBalanceBeforeCreation
            expect(sellTokenBalanceAfterCancel.toString()).toBe(expectedBalance.toString())
          })

          test('exchanger creates and executes an approved exchange proposal', async () => {
            const from = await getKey(context.mnemonic, TestAccounts.GrandaMentoExchanger)
            context.kit.connection.addAccount(from.privateKey)
            context.kit.defaultAccount = from.address

            const logger = baseLogger.child({ from: from.address })

            const grandaMento = await context.kit.contracts.getGrandaMento()

            const sellTokenBalanceBefore = await sellToken.balanceOf(from.address)
            const buyTokenBalanceBefore = await buyToken.balanceOf(from.address)

            const creationInfo = await createExchangeProposal(logger, from.address)

            const approver = await getValidatorKey(context.mnemonic, 0)
            await grandaMento
              .approveExchangeProposal(creationInfo.proposalId)
              .sendAndWaitForReceipt({
                from: approver.address,
              })

            const vetoPeriodSeconds = await grandaMento.vetoPeriodSeconds()
            // Sleep for the veto period, add 5 seconds for extra measure
            const sleepPeriodMs = vetoPeriodSeconds.plus(5).times(1000).toNumber()
            logger.debug(
              {
                sleepPeriodMs,
                vetoPeriodSeconds,
              },
              'Sleeping so the veto period elapses'
            )
            await sleep(sleepPeriodMs)

            // Executing from the approver to avoid needing to calculate additional gas paid
            // by the approver in this test.
            await grandaMento
              .executeExchangeProposal(creationInfo.proposalId)
              .sendAndWaitForReceipt({
                from: approver.address,
              })

            logger.debug(
              {
                proposalId: creationInfo.proposalId,
              },
              'Executed exchange proposal'
            )

            const sellTokenBalanceAfter = await sellToken.balanceOf(from.address)
            let expectedSellTokenBalanceAfter = sellTokenBalanceBefore.minus(sellAmount)
            if (sellCelo) {
              expectedSellTokenBalanceAfter = expectedSellTokenBalanceAfter.minus(
                creationInfo.celoFees
              )
            }
            expect(sellTokenBalanceAfter.toString()).toBe(expectedSellTokenBalanceAfter.toString())

            const sortedOracles = await context.kit.contracts.getSortedOracles()
            const celoStableTokenRate = (await sortedOracles.medianRate(stableTokenAddress)).rate

            const exchangeRate = sellCelo
              ? celoStableTokenRate
              : new BigNumber(1).div(celoStableTokenRate)
            const buyAmount = getBuyAmount(exchangeRate, sellAmount, await grandaMento.spread())

            const buyTokenBalanceAfter = await buyToken.balanceOf(from.address)
            let expectedBuyTokenBalanceAfter = buyTokenBalanceBefore.plus(buyAmount)
            if (!sellCelo) {
              expectedBuyTokenBalanceAfter = expectedBuyTokenBalanceAfter.minus(
                creationInfo.celoFees
              )
            }
            expect(buyTokenBalanceAfter.toString()).toBe(expectedBuyTokenBalanceAfter.toString())
          })
        })
      }
    }
  })
}

// exchangeRate is the price of the sell token quoted in buy token
function getBuyAmount(exchangeRate: BigNumber, sellAmount: BigNumber, spread: BigNumber.Value) {
  return sellAmount.times(new BigNumber(1).minus(spread)).times(exchangeRate)
}
