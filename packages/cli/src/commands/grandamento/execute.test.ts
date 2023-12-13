import { Address } from '@celo/base/lib/address'
import { newKitFromWeb3 } from '@celo/contractkit'
import { assumeOwnership } from '@celo/contractkit/lib/test-utils/transferownership'
import { GrandaMentoWrapper } from '@celo/contractkit/lib/wrappers/GrandaMento'
import { testWithGanache, timeTravel } from '@celo/dev-utils/lib/ganache-test'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { testLocally } from '../../test-utils/cliUtils'
import Execute from './execute'
import Propose from './propose'

testWithGanache('grandamento:execute cmd', (web3: Web3) => {
  const kit = newKitFromWeb3(web3)
  let grandaMento: GrandaMentoWrapper
  const newLimitMin = new BigNumber('1000')
  const newLimitMax = new BigNumber('1000000000000')
  let accounts: Address[] = []
  const dateNowOriginal = Date.now
  let originalNoSyncCheck: string | undefined

  const increaseLimits = () => {
    return grandaMento
      .setStableTokenExchangeLimits('StableToken', newLimitMin.toString(), newLimitMax.toString())
      .sendAndWaitForReceipt()
  }

  const createExchangeProposal = () => {
    // create mock proposal
    return testLocally(Propose, [
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

  const timeTravelDateAndChain = async (seconds: number) => {
    await timeTravel(seconds, web3)
    jest.useFakeTimers().setSystemTime(dateNowOriginal() + seconds * 1000)
    // Otherwise contractkit complains there is a difference between Date.now()
    // and the timestamp of the last block
    process.env.NO_SYNCCHECK = 'true'
  }

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    grandaMento = await kit.contracts.getGrandaMento()
    originalNoSyncCheck = process.env.NO_SYNCCHECK
  })

  afterEach(() => {
    process.env.NO_SYNCCHECK = originalNoSyncCheck
  })

  beforeEach(async () => {
    await assumeOwnership(web3, accounts[0])
    await increaseLimits()
    await createExchangeProposal()
    // Approve it
    await approveExchangeProposal(1)
    // Wait the veto period plus some extra time to be safe
    await timeTravelDateAndChain((await grandaMento.vetoPeriodSeconds()).toNumber() + 1000)
  })

  describe('execute', () => {
    it('executes the proposal', async () => {
      await testLocally(Execute, ['--from', accounts[0], '--proposalID', '1'])
      const activeProposals = await grandaMento.getActiveProposalIds()
      expect(activeProposals).toEqual([])
    })

    it('fails if the exchange proposal is not executable', async () => {
      // Create a proposal with proposalID 2, but don't wait the veto period
      await createExchangeProposal()
      await approveExchangeProposal(2)
      await expect(
        testLocally(Execute, ['--from', accounts[0], '--proposalID', '2'])
      ).rejects.toThrow()
    })
  })
})
