import { newKitFromWeb3 } from '@celo/contractkit'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import { testLocally } from '../../test-utils/cliUtils'
import Register from '../account/register'
import Delegate from './delegate'
import Lock from './lock'
import RevokeDelegate from './revoke-delegate'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('lockedgold:revoke-delegate cmd', (web3: Web3) => {
  test('can revoke delegate', async () => {
    const accounts = await web3.eth.getAccounts()
    const account = accounts[0]
    const account2 = accounts[1]
    const kit = newKitFromWeb3(web3)
    const lockedGold = await kit.contracts.getLockedGold()
    await testLocally(Register, ['--from', account])
    await testLocally(Register, ['--from', account2])
    await testLocally(Lock, ['--from', account, '--value', '200'])

    await testLocally(Delegate, ['--from', account, '--to', account2, '--percent', '100'])

    const account2VotingPower = await lockedGold.getAccountTotalGovernanceVotingPower(account2)
    expect(account2VotingPower.toFixed()).toBe('200')

    await testLocally(RevokeDelegate, ['--from', account, '--to', account2, '--percent', '100'])

    const account2VotingPowerAfterRevoke = await lockedGold.getAccountTotalGovernanceVotingPower(
      account2
    )
    expect(account2VotingPowerAfterRevoke.toFixed()).toBe('0')
  })
})
