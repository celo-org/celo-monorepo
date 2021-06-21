import { Address } from '@celo/base/lib/address'
import { NetworkConfig, testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import { newKitFromWeb3 } from '../kit'
import { GrandaMentoWrapper } from './GrandaMento'

const expConfig = NetworkConfig.governance // replace me

testWithGanache('GrandaMento Wrapper', (web3: Web3) => {
  // const ONE_SEC = 1000
  const kit = newKitFromWeb3(web3)
  const minDeposit = web3.utils.toWei(expConfig.minDeposit.toString(), 'ether')
  // const ONE_CGLD = web3.utils.toWei('1', 'ether')

  let accounts: Address[] = []
  let grandaMento: GrandaMentoWrapper
  // let governanceApproverMultiSig: MultiSigWrapper
  // let lockedGold: LockedGoldWrapper
  // let accountWrapper: AccountsWrapper
  // let registry: Registry

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    grandaMento = await kit.contracts.getGrandaMento()

    describe('lallala', async () => {})
  })

  it('#getConfig', async () => {
    const config = await grandaMento.getConfig()
    expect(config.approver).toEqBigNumber(expConfig.concurrentProposals)
    expect(config.spread).toEqBigNumber(expConfig.dequeueFrequency)
    expect(config.vetoPeriodSeconds).toEqBigNumber(minDeposit)
    // stableTokenExchangeLimits
    // exchangeProposals
  })
})
