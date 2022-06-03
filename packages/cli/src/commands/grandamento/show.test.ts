import { Address } from '@celo/base/lib/address'
import { newKitFromWeb3 } from '@celo/contractkit'
import { StableToken } from '@celo/contractkit/lib/celo-tokens'
import { assumeOwnership } from '@celo/contractkit/lib/test-utils/transferownership'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { GrandaMentoWrapper } from '@celo/contractkit/lib/wrappers/GrandaMento'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { setGrandaMentoLimits } from '../../test-utils/grandaMento'
import Show from './show'

testWithGanache('grandamento:show cmd', (web3: Web3) => {
  const kit = newKitFromWeb3(web3)
  let grandaMento: GrandaMentoWrapper
  let accounts: Address[] = []
  let celoToken: GoldTokenWrapper

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    grandaMento = await kit.contracts.getGrandaMento()

    celoToken = await kit.contracts.getGoldToken()
  })

  beforeEach(async () => {
    await assumeOwnership(web3, accounts[0])
    await setGrandaMentoLimits(grandaMento)
  })

  it('shows proposals', async () => {
    // create mock proposal
    const sellAmount = new BigNumber('100000000')
    await celoToken.increaseAllowance(grandaMento.address, sellAmount).sendAndWaitForReceipt()

    await (
      await grandaMento.createExchangeProposal(
        kit.celoTokens.getContract(StableToken.cUSD),
        sellAmount,
        true
      )
    ).sendAndWaitForReceipt()

    await Show.run(['--proposalID', '1'])
  })
})
