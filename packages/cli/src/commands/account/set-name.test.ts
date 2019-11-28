import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import Register from '../account/register'
import SetName from './set-name'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('account:set-name cmd', (web3: Web3) => {
  test('can set the name of an account', async () => {
    const accounts = await web3.eth.getAccounts()
    await Register.run(['--from', accounts[0]])
    await SetName.run(['--account', accounts[0], '--name', 'TestName'])
  })

  test('fails if account is not registered', async () => {
    const accounts = await web3.eth.getAccounts()

    await expect(SetName.run(['--account', accounts[0], '--name', 'TestName'])).rejects.toThrow(
      "Some checks didn't pass!"
    )
  })

  test('fails if account is not provided', async () => {
    await expect(SetName.run(['--name', 'TestName'])).rejects.toThrow('Missing required flag')
  })

  test('fails if name is not provided', async () => {
    const accounts = await web3.eth.getAccounts()

    await expect(SetName.run(['--account', accounts[0]])).rejects.toThrow('Missing required flag')
  })
})
