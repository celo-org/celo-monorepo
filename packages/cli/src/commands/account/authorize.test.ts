import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { addressToPublicKey } from '@celo/utils/lib/signatureUtils'
import Web3 from 'web3'
import Lock from '../lockedgold/lock'
import ValidatorRegister from '../validator/register'
import Authorize from './authorize'
import Register from './register'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('account:authorize cmd', (web3: Web3) => {
  test('can authorize vote signer', async () => {
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
  })

  test('can authorize attestation signer', async () => {
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
  })

  test('can authorize validator signer before validator is registered', async () => {
    const accounts = await web3.eth.getAccounts()
    await Register.run(['--from', accounts[0]])
    await Authorize.run([
      '--from',
      accounts[0],
      '--role',
      'validator',
      '--signer',
      accounts[1],
      '--signature',
      '0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
    ])
  })

  test('can authorize validator signer after validator is registered', async () => {
    const accounts = await web3.eth.getAccounts()
    const newBlsPublicKey = web3.utils.randomHex(96)
    const newBlsPoP = web3.utils.randomHex(48)
    const ecdsaPublicKey = await addressToPublicKey(accounts[0], web3.eth.sign)
    await Register.run(['--from', accounts[0]])
    await Lock.run(['--from', accounts[0], '--value', '10000000000000000000000'])
    await ValidatorRegister.run([
      '--from',
      accounts[0],
      '--ecdsaKey',
      ecdsaPublicKey,
      '--blsKey',
      '0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00',
      '--blsSignature',
      '0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900',
      '--yes',
    ])
    await Authorize.run([
      '--from',
      accounts[0],
      '--role',
      'validator',
      '--signer',
      accounts[1],
      '--signature',
      '0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
      '--blsKey',
      newBlsPublicKey,
      '--blsPop',
      newBlsPoP,
    ])
  })

  test('cannot authorize validator signer without BLS after validator is registered', async () => {
    const accounts = await web3.eth.getAccounts()
    const ecdsaPublicKey = await addressToPublicKey(accounts[0], web3.eth.sign)
    await Register.run(['--from', accounts[0]])
    await Lock.run(['--from', accounts[0], '--value', '10000000000000000000000'])
    await ValidatorRegister.run([
      '--from',
      accounts[0],
      '--ecdsaKey',
      ecdsaPublicKey,
      '--blsKey',
      '0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00',
      '--blsSignature',
      '0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900',
      '--yes',
    ])
    await expect(
      Authorize.run([
        '--from',
        accounts[0],
        '--role',
        'validator',
        '--signer',
        accounts[1],
        '--signature',
        '0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
      ])
    ).rejects.toThrow()
  })

  test('can force authorize validator signer without BLS after validator is registered', async () => {
    const accounts = await web3.eth.getAccounts()
    const ecdsaPublicKey = await addressToPublicKey(accounts[0], web3.eth.sign)
    await Register.run(['--from', accounts[0]])
    await Lock.run(['--from', accounts[0], '--value', '10000000000000000000000'])
    await ValidatorRegister.run([
      '--from',
      accounts[0],
      '--ecdsaKey',
      ecdsaPublicKey,
      '--blsKey',
      '0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00',
      '--blsSignature',
      '0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900',
      '--yes',
    ])
    await Authorize.run([
      '--from',
      accounts[0],
      '--role',
      'validator',
      '--signer',
      accounts[1],
      '--signature',
      '0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
      '--force',
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
        '--signature',
        '0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
      ])
    ).rejects.toThrow()
  })
})
