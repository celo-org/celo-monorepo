import { Address } from '@celo/base/lib/address'
import { newKitFromWeb3 } from '@celo/contractkit'
import { setGrandaMentoLimits } from '@celo/contractkit/lib/test-utils/grandaMento'
import { assumeOwnership } from '@celo/contractkit/lib/test-utils/transferownership'
import {
  ExchangeProposalState,
  GrandaMentoWrapper,
} from '@celo/contractkit/lib/wrappers/GrandaMento'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
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
    await Propose.run([
      '--from',
      accounts[0],
      '--sellCelo',
      '--stableToken',
      'cUSD',
      '--value',
      '10000',
    ])
  })

  describe('proposes', () => {
    it('created the right proposal', async () => {
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
  })
})
