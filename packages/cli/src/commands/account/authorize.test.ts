import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import Authorize from './authorize'
import Register from './register'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('account:authorize cmd', (web3: Web3) => {
  test('can authorize account', async () => {
    const accounts = await web3.eth.getAccounts()
    await Register.run(['--from', accounts[0]])
    await Authorize.run([
      '--from',
      accounts[0],
      '--role',
      'validator',
      '--signer',
      accounts[1],
      '--pop',
      '0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
    ])
  })

  test('fails if from is not an account', async () => {
    const accounts = await web3.eth.getAccounts()
    await expect(
      Authorize.run([
        '--from',
        accounts[0],
        '--role',
        'validator',
        '--signer',
        accounts[1],
        '--pop',
        '0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
      ])
    ).rejects.toThrow()
  })
})
