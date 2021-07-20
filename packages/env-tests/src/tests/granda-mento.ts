import { sleep } from '@celo/base'
import { StableToken } from '@celo/contractkit'
import { describe, test } from '@jest/globals'
import BigNumber from 'bignumber.js'
import { EnvTestContext } from '../context'
import {
  fundAccountWithCELO,
  fundAccountWithStableToken,
  getKey,
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

          test('exchanger creates and cancels an exchange proposal', async () => {
            const from = await getKey(context.mnemonic, TestAccounts.GrandaMentoExchanger)
            context.kit.connection.addAccount(from.privateKey)
            context.kit.defaultAccount = from.address

            const logger = baseLogger.child({ from: from.address })

            const grandaMento = await context.kit.contracts.getGrandaMento()

            let sellToken
            let sellAmount
            if (sellCelo) {
              sellToken = await context.kit.contracts.getGoldToken()
              sellAmount = celoAmountToSell
            } else {
              sellToken = await context.kit.celoTokens.getWrapper(stableToken as StableToken)
              sellAmount = stableTokenAmountToSell
            }
            await sellToken
              .approve(grandaMento.address, sellAmount.toFixed())
              .sendAndWaitForReceipt({
                from: from.address,
              })
            logger.debug(
              {
                sellAmount,
                sellTokenStr,
                spender: grandaMento.address,
              },
              'Approved GrandaMento to spend sell token'
            )

            // Some flakiness has been observed after approving, so we sleep
            await sleep(5000)

            const sellTokenBalanceBeforeCreation = await sellToken.balanceOf(from.address)

            const creationTx = await grandaMento.createExchangeProposal(
              context.kit.celoTokens.getContract(stableToken as StableToken),
              sellAmount,
              sellCelo
            )
            const creationReceipt = await creationTx.sendAndWaitForReceipt({
              from: from.address,
            })
            const minedCreationTx = await context.kit.web3.eth.getTransaction(
              creationReceipt.transactionHash
            )
            const proposalId = creationReceipt.events!.ExchangeProposalCreated.returnValues
              .proposalId

            logger.debug(
              {
                sellAmount,
                sellCelo,
                proposalId,
              },
              'Created exchange proposal'
            )

            let celoFees = new BigNumber(creationReceipt.gasUsed).times(minedCreationTx.gasPrice)

            const sellTokenBalanceAfterCreation = await sellToken.balanceOf(from.address)

            // If we are looking at the CELO balance, take the fees spent into consideration.
            const expectedBalanceDifference = sellCelo ? sellAmount.plus(celoFees) : sellAmount

            expect(
              sellTokenBalanceBeforeCreation.minus(sellTokenBalanceAfterCreation).toString()
            ).toBe(expectedBalanceDifference.toString())

            const cancelReceipt = await grandaMento
              .cancelExchangeProposal(proposalId)
              .sendAndWaitForReceipt({
                from: from.address,
              })
            const minedCancelTx = await context.kit.web3.eth.getTransaction(
              cancelReceipt.transactionHash
            )

            logger.debug(
              {
                proposalId,
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
        })
      }
    }
  })
}
