import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import Register from '../account/register'
import Lock from '../lockedgold/lock'
import ValidatorRegister from './register'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('validator:register', (web3: Web3) => {
  let account: string

  beforeEach(async () => {
    const accounts = await web3.eth.getAccounts()
    account = accounts[0]
    await Register.run(['--from', account])
    await Lock.run(['--from', account, '--value', '10000000000000000000000'])
  })

  test('can register validator with 0x prefix', async () => {
    await ValidatorRegister.run([
      '--from',
      account,
      '--blsKey',
      '0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00',
      '--blsPop',
      '0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900',
    ])
  })

  test('can register validator without 0x prefix', async () => {
    await ValidatorRegister.run([
      '--from',
      account,
      '--blsKey',
      '4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00',
      '--blsPop',
      'cdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900',
    ])
  })
})
