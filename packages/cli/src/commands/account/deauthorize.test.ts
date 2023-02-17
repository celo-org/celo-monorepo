import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import { testLocally } from '../../test-utils/cliUtils'
import Authorize from './authorize'
import Deauthorize from './deauthorize'
import Register from './register'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('account:deauthorize cmd', (web3: Web3) => {
  test('can deauthorize attestation signer', async () => {
    const accounts = await web3.eth.getAccounts()
    await testLocally(Register, ['--from', accounts[0]])
    await testLocally(Authorize, [
      '--from',
      accounts[0],
      '--role',
      'attestation',
      '--signer',
      accounts[1],
      '--signature',
      '0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
    ])
    await testLocally(Deauthorize, [
      '--from',
      accounts[0],
      '--role',
      'attestation',
      '--signer',
      accounts[1],
    ])
  })

  test('cannot deauthorize a non-authorized signer', async () => {
    const accounts = await web3.eth.getAccounts()
    await testLocally(Register, ['--from', accounts[0]])

    await expect(
      testLocally(Deauthorize, [
        '--from',
        accounts[0],
        '--role',
        'attestation',
        '--signer',
        accounts[1],
      ])
    ).rejects.toThrow()
  })
})
