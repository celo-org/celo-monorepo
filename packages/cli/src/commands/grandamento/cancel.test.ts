import { Address } from '@celo/base/lib/address'
import { newKitFromWeb3 } from '@celo/contractkit'
import { assumeOwnership } from '@celo/contractkit/lib/test-utils/transferownership'
import { GrandaMentoWrapper } from '@celo/contractkit/lib/wrappers/GrandaMento'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { testLocally } from '../../test-utils/cliUtils'
import Cancel from './cancel'
import Propose from './propose'

testWithGanache('grandamento:cancel cmd', (web3: Web3) => {
  const kit = newKitFromWeb3(web3)
  let grandaMento: GrandaMentoWrapper
  const newLimitMin = new BigNumber('1000')
  const newLimitMax = new BigNumber('1000000000000')
  let accounts: Address[] = []

  const increaseLimits = async () => {
    await grandaMento
      .setStableTokenExchangeLimits('StableToken', newLimitMin.toString(), newLimitMax.toString())
      .sendAndWaitForReceipt()
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
    await testLocally(Propose, [
      '--from',
      accounts[0],
      '--sellCelo',
      'true',
      '--stableToken',
      'cUSD',
      '--value',
      '10000',
    ])
  })

  describe('cancel', () => {
    it('left no proposal', async () => {
      await testLocally(Cancel, ['--from', accounts[0], '--proposalID', '1'])
      const activeProposals = await grandaMento.getActiveProposalIds()
      expect(activeProposals).toEqual([])
    })
  })
})
