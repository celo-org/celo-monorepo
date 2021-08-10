import { Address } from '@celo/base/lib/address'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { StableToken } from '../celo-tokens'
import { newKitFromWeb3 } from '../kit'
import { GoldTokenWrapper } from './GoldTokenWrapper'
import { GrandaMentoWrapper } from './GrandaMento'
import { StableTokenWrapper } from './StableTokenWrapper'

testWithGanache('governance:approve cmd', (web3: Web3) => {
  const kit = newKitFromWeb3(web3)
  let accounts: Address[] = []
  let grandaMento: GrandaMentoWrapper
  let celoToken: GoldTokenWrapper
  let stableToken: StableTokenWrapper
  const newLimitMin = new BigNumber('1000')
  const newLimitMax = new BigNumber('1000000000000')
  let sellAmount: BigNumber

  // TOOD make this function reusable
  const increaseLimits = async () => {
    await (
      await grandaMento.setStableTokenExchangeLimits(
        'StableToken',
        newLimitMin.toString(),
        newLimitMax.toString()
      )
    ).sendAndWaitForReceipt()
  }

  beforeEach(async () => {
    // increase limits
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    grandaMento = await kit.contracts.getGrandaMento()

    stableToken = await kit.contracts.getStableToken(StableToken.cUSD)
    celoToken = await kit.contracts.getGoldToken()

    await increaseLimits()
  })
})
