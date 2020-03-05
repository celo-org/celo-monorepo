import { mineBlocks, testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import AccountRegister from '../account/register'
import Lock from '../lockedgold/lock'
import Commission from './commission'
import ValidatorGroupRegister from './register'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('validatorgroup:comission cmd', (web3: Web3) => {
  async function registerValidatorGroup() {
    const accounts = await web3.eth.getAccounts()

    await AccountRegister.run(['--from', accounts[0]])
    await Lock.run(['--from', accounts[0], '--value', '10000000000000000000000'])
    await ValidatorGroupRegister.run(['--from', accounts[0], '--commission', '0.1', '--yes'])
  }

  test('can queue update', async () => {
    const accounts = await web3.eth.getAccounts()
    await registerValidatorGroup()
    await Commission.run(['--from', accounts[0], '--queue-update', '0.2'])
  })
  test('can apply update', async () => {
    const accounts = await web3.eth.getAccounts()
    await registerValidatorGroup()
    await Commission.run(['--from', accounts[0], '--queue-update', '0.2'])
    await mineBlocks(3, web3)
    await Commission.run(['--from', accounts[0], '--apply'])
  })
})
