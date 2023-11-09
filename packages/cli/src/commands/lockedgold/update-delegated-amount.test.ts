import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import { testLocally } from '../../test-utils/cliUtils'
import Register from '../account/register'
import Delegate from './delegate'
import Lock from './lock'
import UpdateDelegatedAmount from './update-delegated-amount'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('lockedgold:update-delegated-amount cmd', (web3: Web3) => {
  test('can update delegated amount', async () => {
    const accounts = await web3.eth.getAccounts()
    const account = accounts[0]
    const account2 = accounts[1]
    await testLocally(Register, ['--from', account])
    await testLocally(Register, ['--from', account2])
    await testLocally(Lock, ['--from', account, '--value', '200'])
    await testLocally(Delegate, ['--from', account, '--to', account2, '--percent', '100'])

    await testLocally(UpdateDelegatedAmount, ['--from', account, '--to', account2])
  })
})
