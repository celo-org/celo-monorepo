import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import Authorize from './authorize'
import Deauthorize from './deauthorize'
import Register from './register'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('account:deauthorize cmd', (web3: Web3) => {
  test('can deauthorize attestation signer', async () => {
    const accounts = await web3.eth.getAccounts()
    await Register.run(['--from', accounts[0]])
    await Authorize.run([
      '--from',
      accounts[0],
      '--role',
      'attestation',
      '--signer',
      accounts[1],
      '--signature',
      '0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
    ])
    await Deauthorize.run(['--from', accounts[0], '--role', 'attestation', '--signer', accounts[1]])
  })

  test('cannot deauthorize role other than attestation', async () => {
    const accounts = await web3.eth.getAccounts()
    await Register.run(['--from', accounts[0]])
    await Authorize.run([
      '--from',
      accounts[0],
      '--role',
      'vote',
      '--signer',
      accounts[1],
      '--signature',
      '0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
    ])
    await expect(
      Deauthorize.run(['--from', accounts[0], '--role', 'vote', '--signer', accounts[1]])
    ).rejects.toThrow()
  })
})
