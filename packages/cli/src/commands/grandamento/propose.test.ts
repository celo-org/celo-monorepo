import { Address } from '@celo/base/lib/address'
import { newKitFromWeb3 } from '@celo/contractkit'
import { assumeOwnership } from '@celo/contractkit/lib/test-utils/transferownership'
import {
  ExchangeProposalState,
  GrandaMentoWrapper,
} from '@celo/contractkit/lib/wrappers/GrandaMento'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { setGrandaMentoLimits } from '../../test-utils/grandaMento'
import Propose from './propose'

testWithGanache('grandamento:propose cmd', (web3: Web3) => {
  const kit = newKitFromWeb3(web3)
  let grandaMento: GrandaMentoWrapper
  let accounts: Address[] = []

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    grandaMento = await kit.contracts.getGrandaMento()
  })

  beforeEach(async () => {
    await assumeOwnership(web3, accounts[0])
    await setGrandaMentoLimits(grandaMento)
  })

  describe('proposes', () => {
    it('can sell Celo', async () => {
      await Propose.run([
        '--from',
        accounts[0],
        '--sellCelo',
        'true',
        '--stableToken',
        'cUSD',
        '--value',
        '10000',
      ])

      const activeProposals = await grandaMento.getActiveProposalIds()

      expect(activeProposals).not.toEqual([])

      const proposal = await grandaMento.getExchangeProposal(activeProposals[0])
      expect(proposal.exchanger).toEqual(accounts[0])
      expect(proposal.stableToken).toEqual((await kit.contracts.getStableToken()).address)
      expect(proposal.sellAmount).toEqBigNumber(10000)
      expect(proposal.approvalTimestamp).toEqual(new BigNumber(0))
      expect(proposal.state).toEqual(ExchangeProposalState.Proposed)
      expect(proposal.sellCelo).toEqual(true)
    })

    it('can buy Celo', async () => {
      await Propose.run([
        '--from',
        accounts[0],
        '--sellCelo',
        'false',
        '--stableToken',
        'cUSD',
        '--value',
        '10000',
      ])
      const activeProposals = await grandaMento.getActiveProposalIds()

      expect(activeProposals).not.toEqual([])

      const proposal = await grandaMento.getExchangeProposal(activeProposals[0])
      expect(proposal.exchanger).toEqual(accounts[0])
      expect(proposal.stableToken).toEqual((await kit.contracts.getStableToken()).address)
      expect(proposal.sellAmount).toEqBigNumber(10000)
      expect(proposal.approvalTimestamp).toEqual(new BigNumber(0))
      expect(proposal.state).toEqual(ExchangeProposalState.Proposed)
      expect(proposal.sellCelo).toEqual(false)
    })

    it("doesn't work without explicitly setting the sellCelo flag", async () => {
      let activeProposals

      await expect(
        Propose.run([
          '--from',
          accounts[0],
          '--sellCelo',
          '--stableToken',
          'cUSD',
          '--value',
          '10000',
        ])
      ).rejects.toThrow()

      activeProposals = await grandaMento.getActiveProposalIds()
      expect(activeProposals).toEqual([])

      await expect(
        Propose.run([
          '--from',
          accounts[0],
          '--sellCelo',
          'tru', // typo on propose
          '--stableToken',
          'cUSD',
          '--value',
          '10000',
        ])
      ).rejects.toThrow()

      activeProposals = await grandaMento.getActiveProposalIds()
      expect(activeProposals).toEqual([])
    })
  })
})
