import { newKitFromWeb3 } from '@celo/contractkit'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import Lock from './lock'
import Unlock from './unlock'
import Register from '../account/register'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('lockedgold:lock cmd', (web3: Web3) => {
  test('can lock with pending withdrawals', async () => {
    const accounts = await web3.eth.getAccounts()
    const account = accounts[0]
    const kit = newKitFromWeb3(web3)
    const lockedGold = await kit.contracts.getLockedGold()
    await Register.run(['--from', account])
    await Lock.run(['--from', account, '--value', '100'])
    await Unlock.run(['--from', account, '--value', '50'])
    await Lock.run(['--from', account, '--value', '75'])
    const pendingWithdrawalsTotalValue = await lockedGold.getPendingWithdrawalsTotalValue(account)
    expect(pendingWithdrawalsTotalValue).toEqBigNumber('0')
  })
})
