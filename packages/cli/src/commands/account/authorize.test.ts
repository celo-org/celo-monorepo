import Web3 from 'web3'
import { testWithGanache } from '../../test-utils/ganache-test'
import Authorize from './authorize'
import Register from './register'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('account:authorize cmd', (web3: Web3) => {
  test('can authorize account', async () => {
    const accounts = await web3.eth.getAccounts()
    await Register.run(['--from', accounts[0], '--name', 'Chapulin Colorado'])
    await Authorize.run(['--from', accounts[0], '--role', 'validation', '--to', accounts[1]])
  })

  test('fails if from is not an account', async () => {
    const accounts = await web3.eth.getAccounts()
    await expect(
      Authorize.run(['--from', accounts[0], '--role', 'validation', '--to', accounts[1]])
    ).rejects.toThrow()
  })
})
