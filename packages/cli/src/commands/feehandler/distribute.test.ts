import { newKitFromWeb3 } from '@celo/contractkit'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { testLocally } from '../../test-utils/cliUtils'
import Distribute from './distribute'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('feehandler:distribute cmd', (web3: Web3) => {
  const kit = newKitFromWeb3(web3)

  test('can distribute token', async () => {
    const accounts = await web3.eth.getAccounts()
    const initialBalanceRecipient = new BigNumber(await kit.connection.getBalance(accounts[1]))
    await testLocally(Distribute, ['--from', accounts[0], '--to', accounts[1]])

    const finalBalanceRecipient = new BigNumber(await kit.connection.getBalance(accounts[1]))
    expect(finalBalanceRecipient.isGreaterThan(initialBalanceRecipient)).toBe(true)
  })
})
