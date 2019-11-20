import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import Register from './register'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('account:register cmd', (web3: Web3) => {
  test('can register account', async () => {
    const accounts = await web3.eth.getAccounts()

    await Register.run(['--from', accounts[0], '--name', 'Chapulin Colorado'])
  })

  test('fails if from is missing', async () => {
    // const accounts = await web3.eth.getAccounts()

    await expect(Register.run([])).rejects.toThrow('Missing required flag')
  })
})
