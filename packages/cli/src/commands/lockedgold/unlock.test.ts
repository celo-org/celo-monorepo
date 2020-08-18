import { newKitFromWeb3 } from '@celo/contractkit'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { addressToPublicKey } from '@celo/utils/lib/signatureUtils'
import Web3 from 'web3'
import Register from '../account/register'
import Vote from '../election/vote'
import ValidatorAffiliate from '../validator/affiliate'
import ValidatorRegister from '../validator/register'
import ValidatorGroupMember from '../validatorgroup/member'
import ValidatorGroupRegister from '../validatorgroup/register'
import Lock from './lock'
import Unlock from './unlock'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('lockedgold:unlock cmd', (web3: Web3) => {
  test('can unlock correctly from registered validator group', async () => {
    const accounts = await web3.eth.getAccounts()
    const account = accounts[0]
    const validator = accounts[1]
    const kit = newKitFromWeb3(web3)
    const lockedGold = await kit.contracts.getLockedGold()
    await Register.run(['--from', account])
    await Lock.run(['--from', account, '--value', '20000000000000000000000'])
    await ValidatorGroupRegister.run(['--from', account, '--commission', '0', '--yes'])
    await Register.run(['--from', validator])
    await Lock.run(['--from', validator, '--value', '20000000000000000000000'])
    const ecdsaPublicKey = await addressToPublicKey(validator, web3.eth.sign)
    await ValidatorRegister.run([
      '--from',
      validator,
      '--ecdsaKey',
      ecdsaPublicKey,
      '--blsKey',
      '0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00',
      '--blsSignature',
      '0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900',
      '--yes',
    ])
    await ValidatorAffiliate.run(['--yes', '--from', validator, account])
    await ValidatorGroupMember.run(['--yes', '--from', account, '--accept', validator])
    await Vote.run(['--from', account, '--for', account, '--value', '10000000000000000000000'])
    await Unlock.run(['--from', account, '--value', '10000000000000000000000'])
    const pendingWithdrawalsTotalValue = await lockedGold.getPendingWithdrawalsTotalValue(account)
    expect(pendingWithdrawalsTotalValue.toFixed()).toBe('10000000000000000000000')
  })
})
