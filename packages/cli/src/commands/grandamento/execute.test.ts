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
  const newLimitMin = new BigNumber('1000')
  const newLimitMax = new BigNumber('1000000000000')
  let accounts: Address[] = []
  let dateNowSpy: jest.SpyInstance | undefined
  let dateNowOriginal = Date.now
  let originalNoSyncCheck: string | undefined

  const increaseLimits = () => {
    return grandaMento
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

  const timeTravelDateAndChain = async (seconds: number) => {
    await timeTravel(seconds, web3)
    // dateNowSpy = jest
    //   .spyOn(Date, 'now')
    //   .mockImplementation(() => dateNowOriginal() + seconds * 1000)
    jest.useFakeTimers('modern').setSystemTime(dateNowOriginal() + seconds * 1000)
    originalNoSyncCheck = 'true'
  }

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    grandaMento = await kit.contracts.getGrandaMento()
    originalNoSyncCheck = process.env.NO_SYNCCHECK
  })

  afterEach(() => {
    if (dateNowSpy) {
      dateNowSpy.mockRestore()
      dateNowSpy = undefined
    }
    process.env.NO_SYNCCHECK = originalNoSyncCheck
  })

  beforeEach(async () => {
    console.log('a')
    await assumeOwnership(web3, accounts[0])
    console.log('b')
    await increaseLimits()
    console.log('c')

    // create mock proposal
    // await Propose.run([
    //   '--from',
    //   accounts[0],
    //   '--sellCelo',
    //   'true',
    //   '--stableToken',
    //   'cUSD',
    //   '--value',
    //   '10000',
    // ])
    await createExchangeProposal()
    console.log('d')
    // Approve it
    await approveExchangeProposal(1)
    console.log('e')

    console.log('before', await web3.eth.getBlock('latest'), Date.now(), dateNowOriginal())
    // Wait the veto period plus some extra time to be safe
    await timeTravelDateAndChain((await grandaMento.vetoPeriodSeconds()).toNumber() + 1000)
    // Send a dummy transaction to have ganache mine a new block with the new
    // time, therefore causing the check in Execute that the veto period has elapsed
    // to pass.
    // await web3.eth.sendTransaction({
    //   from: accounts[0],
    //   to: accounts[0],
    //   value: '1',
    // })
    console.log('f', Date.now(), dateNowOriginal())
    console.log(
      'await grandaMento.vetoPeriodSeconds().toNumber()',
      (await grandaMento.vetoPeriodSeconds()).toNumber()
    )
    console.log(
      '(await grandaMento.vetoPeriodSeconds()).toNumber() + 10',
      (await grandaMento.vetoPeriodSeconds()).toNumber() + 10
    )
  })

  describe('execute', () => {
    it('executes the proposal', async () => {
      console.log('g', Date.now(), dateNowOriginal())
      await Execute.run(['--from', accounts[0], '--proposalID', '1'])
      console.log('h')
      const activeProposals = await grandaMento.getActiveProposalIds()
      console.log('i')
      expect(activeProposals).toEqual([])
      console.log('j')
    })

    it('fails if the exchange proposal is not executable', async () => {
      // Create a proposal with proposalID 2, but don't wait the veto period
      console.log('ey')
      await createExchangeProposal()
      console.log('bee')
      await approveExchangeProposal(2)
      console.log('see')

      await expect(Execute.run(['--from', accounts[0], '--proposalID', '2'])).rejects.toThrow()
      console.log('dee')
    })
  })
})
