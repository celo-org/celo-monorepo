import { Address } from '@celo/base/lib/address'
import { NetworkConfig, testWithGanache, timeTravel } from '@celo/dev-utils/lib/ganache-test'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { StableToken as StableTokenName } from '../base'
import { StableToken } from '../celo-tokens'
import { newKitFromWeb3 } from '../kit'
import { GoldTokenWrapper } from './GoldTokenWrapper'
import { ExchangeProposalState, GrandaMentoWrapper } from './GrandaMento'
import { StableTokenWrapper } from './StableTokenWrapper'

const expConfig = NetworkConfig.grandaMento

testWithGanache('GrandaMento Wrapper', (web3: Web3) => {
  const kit = newKitFromWeb3(web3)
  let accounts: Address[] = []
  let grandaMento: GrandaMentoWrapper
  let celoToken: GoldTokenWrapper
  let stableToken: StableTokenWrapper
  const newLimitMin = new BigNumber('1000')
  const newLimitMax = new BigNumber('1000000000000')

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    grandaMento = await kit.contracts.getGrandaMento()

    stableToken = await kit.contracts.getStableToken(StableToken.cUSD)
    celoToken = await kit.contracts.getGoldToken()
  })

  const increaseLimits = async () => {
    await (
      await grandaMento.setStableTokenExchangeLimits(
        'StableToken',
        newLimitMin.toString(),
        newLimitMax.toString()
      )
    ).sendAndWaitForReceipt()
  }

  describe('No limits sets', () => {
    it('gets the proposals', async () => {
      const activeProposals = await grandaMento.getActiveProposalIds()
      expect(activeProposals).toEqual([])
    })

    it('fetches empty limits', async () => {
      let limits = await grandaMento.stableTokenExchangeLimits(StableTokenName.cUSD)
      expect(limits.minExchangeAmount).toEqBigNumber(new BigNumber(0))
      expect(limits.maxExchangeAmount).toEqBigNumber(new BigNumber(0))
    })
  })

  it("fetchs a proposal it doesn't exist", async () => {
    const throwFunc = async () => {
      await grandaMento.getExchangeProposal(0)
    }
    await expect(throwFunc).rejects.toThrow("Proposal doesn't exist")
  })

  describe('When Granda Mento is enabled', () => {
    beforeEach(async () => {
      await increaseLimits()
    })

    it('has new limits', async () => {
      // await increaseLimits() // this should be in the before all but for some reason not working

      console.log(StableTokenName.cUSD)
      const limits = await grandaMento.stableTokenExchangeLimits(StableTokenName.cUSD)
      expect(limits.minExchangeAmount).toEqBigNumber(newLimitMin)
      expect(limits.maxExchangeAmount).toEqBigNumber(newLimitMax)
    })

    describe('Has  a proposal', () => {
      it('can submit a proposal', async () => {
        // await increaseLimits() // this should be in the before all but for some reason not working
        console.log(await grandaMento.getAllStableTokenLimits())
        const sellAmount = new BigNumber('100000000')
        await (
          await celoToken.increaseAllowance(grandaMento.address, sellAmount)
        ).sendAndWaitForReceipt()

        await (
          await grandaMento.createExchangeProposal(StableTokenName.cUSD, sellAmount, true)
        ).sendAndWaitForReceipt()

        const activeProposals = await grandaMento.getActiveProposalIds()
        expect(activeProposals).not.toEqual([])

        let proposal = await grandaMento.getExchangeProposal(activeProposals[0])
        expect(proposal.exchanger).toEqual(accounts[0])
        expect(proposal.stableToken).toEqual(stableToken.address)
        expect(proposal.sellAmount).toEqBigNumber(sellAmount)
        expect(proposal.buyAmount).toEqBigNumber(new BigNumber('99000000')) // TODO double check this number
        expect(proposal.approvalTimestamp).toEqual(new BigNumber(0))
        expect(proposal.state).toEqual(ExchangeProposalState.Proposed)
        expect(proposal.sellCelo).toEqual(true)

        await (
          await grandaMento.approveExchangeProposal(activeProposals[0])
        ).sendAndWaitForReceipt()

        proposal = await grandaMento.getExchangeProposal(activeProposals[0])

        expect(proposal.state).toEqual(ExchangeProposalState.Approved)
        await timeTravel(expConfig.vetoPeriodSeconds, web3)
        await (
          await grandaMento.executeExchangeProposal(activeProposals[0])
        ).sendAndWaitForReceipt()

        proposal = await grandaMento.getExchangeProposal(activeProposals[0])
        expect(proposal.state).toEqual(ExchangeProposalState.Executed)
      })

      it('Cancel proposal', async () => {
        // await increaseLimits() // TODO this should be in the before all but for some reason not working
        const celoToken = await kit.contracts.getGoldToken()
        const sellAmount = new BigNumber('100000000')
        await (
          await celoToken.increaseAllowance(grandaMento.address, sellAmount)
        ).sendAndWaitForReceipt()

        await (
          await grandaMento.createExchangeProposal(StableTokenName.cUSD, sellAmount, true)
        ).sendAndWaitForReceipt()

        await (await grandaMento.cancelExchangeProposal(1)).sendAndWaitForReceipt()

        const proposal = await grandaMento.getExchangeProposal('1')
        expect(proposal.state).toEqual(4)
      })

      it('updated the config', async () => {
        // await increaseLimits() // TODO this should be in the before all but for some reason not working
        const config = await grandaMento.getConfig()
        expect(config.exchangeLimits.get(StableTokenName.cUSD)?.minExchangeAmount).toEqBigNumber(
          new BigNumber(newLimitMin)
        )
        expect(config.exchangeLimits.get(StableTokenName.cUSD)?.maxExchangeAmount).toEqBigNumber(
          new BigNumber(newLimitMax)
        )
        expect(config.exchangeLimits.get(StableTokenName.cEUR)?.minExchangeAmount).toEqBigNumber(
          new BigNumber(0)
        )
        expect(config.exchangeLimits.get(StableTokenName.cEUR)?.maxExchangeAmount).toEqBigNumber(
          new BigNumber(0)
        )
      })
    })
  })

  it('#getConfig', async () => {
    const config = await grandaMento.getConfig()
    // expect(config.approver).toBe(expConfig.approver) // TODO FIX this tests
    expect(config.spread).toEqBigNumber(expConfig.spread)
    expect(config.vetoPeriodSeconds).toEqBigNumber(expConfig.vetoPeriodSeconds)
    expect(config.exchangeLimits.get(StableTokenName.cUSD)?.minExchangeAmount).toEqBigNumber(
      new BigNumber(0)
    )
    expect(config.exchangeLimits.get(StableTokenName.cUSD)?.maxExchangeAmount).toEqBigNumber(
      new BigNumber(0)
    )
    expect(config.exchangeLimits.get(StableTokenName.cEUR)?.minExchangeAmount).toEqBigNumber(
      new BigNumber(0)
    )
    expect(config.exchangeLimits.get(StableTokenName.cEUR)?.maxExchangeAmount).toEqBigNumber(
      new BigNumber(0)
    )
  })
})
