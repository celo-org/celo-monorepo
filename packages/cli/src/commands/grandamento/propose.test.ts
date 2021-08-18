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
import Propose from './propose'

testWithGanache('grandamento:list cmd', (web3: Web3) => {
  // jest.spyOn(console, 'log')
  const kit = newKitFromWeb3(web3)
  let grandaMento: GrandaMentoWrapper
  const newLimitMin = new BigNumber('1000')
  const newLimitMax = new BigNumber('1000000000000')
  let accounts: Address[] = []

  const increaseLimits = async () => {
    await (
      await grandaMento.setStableTokenExchangeLimits(
        'StableToken',
        newLimitMin.toString(),
        newLimitMax.toString()
      )
    ).sendAndWaitForReceipt()
  }

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    grandaMento = await kit.contracts.getGrandaMento()
  })

  beforeEach(async () => {
    await assumeOwnership(web3, accounts[0])
    await increaseLimits()
  })

  describe('proposes', async () => {
    await Propose.run([
      '--from',
      accounts[0],
      '--sellCelo',
      '--stableToken',
      'cUSD',
      '--value',
      '10000',
    ])

    it('created the right proposal', async () => {
      const activeProposals = await grandaMento.getActiveProposalIds()

      expect(activeProposals).not.toEqual([])

      let proposal = await grandaMento.getExchangeProposal(activeProposals[0])
      expect(proposal.exchanger).toEqual(accounts[0])
      expect(proposal.stableToken).toEqual((await kit.contracts.getStableToken()).address)
      expect(proposal.sellAmount).toEqBigNumber(10000)
      expect(proposal.approvalTimestamp).toEqual(new BigNumber(0))
      expect(proposal.state).toEqual(ExchangeProposalState.Proposed)
      expect(proposal.sellCelo).toEqual(true)
    })
  })
})
