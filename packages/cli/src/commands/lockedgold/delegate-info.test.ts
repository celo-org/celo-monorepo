import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import { testLocally } from '../../test-utils/cliUtils'
import Register from '../account/register'
import Delegate from './delegate'
import DelegateInfo from './delegate-info'
import Lock from './lock'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('lockedgold:delegate-info cmd', (web3: Web3) => {
  test('gets the info', async () => {
    const accounts = await web3.eth.getAccounts()
    const account = accounts[0]
    const account2 = accounts[1]
    await testLocally(Register, ['--from', account])
    await testLocally(Register, ['--from', account2])
    await testLocally(Lock, ['--from', account, '--value', '200'])

    await testLocally(Delegate, ['--from', account, '--to', account2, '--percent', '100'])

    await testLocally(DelegateInfo, ['--account', account])
  })
})
