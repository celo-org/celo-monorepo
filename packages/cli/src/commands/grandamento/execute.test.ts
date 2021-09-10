import { Address } from '@celo/base/lib/address'
import { newKitFromWeb3 } from '@celo/contractkit'
import { assumeOwnership } from '@celo/contractkit/lib/test-utils/transferownership'
import { GrandaMentoWrapper } from '@celo/contractkit/lib/wrappers/GrandaMento'
import { testWithGanache, timeTravel } from '@celo/dev-utils/lib/ganache-test'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import Execute from './execute'
import Propose from './propose'

testWithGanache('grandamento:execute cmd', (web3: Web3) => {
  const kit = newKitFromWeb3(web3)
  let grandaMento: GrandaMentoWrapper
  const proposalID = 1
  const newLimitMin = new BigNumber('1000')
  const newLimitMax = new BigNumber('1000000000000')
  let accounts: Address[] = []

  const increaseLimits = async () => {
    await grandaMento
      .setStableTokenExchangeLimits('StableToken', newLimitMin.toString(), newLimitMax.toString())
      .sendAndWaitForReceipt()
  }

  const createExchangeProposal = () => {
    // create mock proposal
    return Propose.run([
      '--from',
      accounts[0],
      '--sellCelo',
      'true',
      '--stableToken',
      'cUSD',
      '--value',
      '10000',
    ])
  }

  const approveExchangeProposal = async (proposalID: number | string) => {
    await grandaMento.setApprover(accounts[0]).sendAndWaitForReceipt()
    await grandaMento.approveExchangeProposal(proposalID).sendAndWaitForReceipt()
  }

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    grandaMento = await kit.contracts.getGrandaMento()
  })

  beforeEach(async () => {
    await assumeOwnership(web3, accounts[0])
    await increaseLimits()

    // create mock proposal
    await createExchangeProposal()
    // Approve it
    await approveExchangeProposal(proposalID)
    // Wait the veto period
    await timeTravel((await grandaMento.vetoPeriodSeconds()).toNumber(), web3)
  })

  describe('execute', () => {
    it('executes the proposal', async () => {
      await Execute.run(['--from', accounts[0], '--proposalID', proposalID.toString()])
      const activeProposals = await grandaMento.getActiveProposalIds()
      expect(activeProposals).toEqual([])
    })

    it('fails if the exchange proposal is not executable', async () => {
      // Create a proposal with proposalID 2, but don't wait the veto period
      await createExchangeProposal()
      await approveExchangeProposal(proposalID)

      await expect(Execute.run(['--from', accounts[0], '--proposalID', '2'])).rejects.toThrow()
    })
  })
})
