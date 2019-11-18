import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { addressToPublicKey, parseSignature } from '@celo/utils/lib/signatureUtils'
import Web3 from 'web3'
import { newKitFromWeb3 } from '../kit'
import { AccountsWrapper } from './Accounts'
import { LockedGoldWrapper } from './LockedGold'
import { ValidatorsWrapper } from './Validators'

/*
TEST NOTES:
- In migrations: The only account that has cUSD is accounts[0]
*/

const minLockedGoldValue = Web3.utils.toWei('10', 'ether') // 10 gold

// Random hex strings
const blsPublicKey =
  '0x4d23d8cd06f30b1fa7cf368e2f5399ab04bb6846c682f493a98a607d3dfb7e53a712bb79b475c57b0ac2785460f91301'
const blsPoP =
  '0x9d3e1d8f49f6b0d8e9a03d80ca07b1d24cf1cc0557bdcc04f5e17a46e35d02d0d411d956dbd5d2d2464eebd7b74ae30005d223780d785d2abc5644fac7ac29fb0e302bdc80c81a5d45018b68b1045068a4b3a4861c93037685fd0d252d740501'

testWithGanache('Accounts Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let accountsInstance: AccountsWrapper
  let validators: ValidatorsWrapper
  let lockedGold: LockedGoldWrapper

  const registerAccountWithLockedGold = async (account: string) => {
    if (!(await accountsInstance.isAccount(account))) {
      await accountsInstance.createAccount().sendAndWaitForReceipt({ from: account })
    }
    await lockedGold.lock().sendAndWaitForReceipt({ from: account, value: minLockedGoldValue })
  }

  const getParsedSignatureOfAddress = async (address: string, signer: string) => {
    const addressHash = web3.utils.soliditySha3({ type: 'address', value: address })
    const signature = await web3.eth.sign(addressHash, signer)
    return parseSignature(addressHash, signature, signer)
  }

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    validators = await kit.contracts.getValidators()
    lockedGold = await kit.contracts.getLockedGold()
    accountsInstance = await kit.contracts.getAccounts()
  })

  const setupValidator = async (validatorAccount: string) => {
    const publicKey = await addressToPublicKey(validatorAccount, web3.eth.sign)
    await registerAccountWithLockedGold(validatorAccount)
    await validators
      // @ts-ignore
      .registerValidator(publicKey, blsPublicKey, blsPoP)
      .sendAndWaitForReceipt({ from: validatorAccount })
  }

  test('SBAT authorize validator key when not a validator', async () => {
    const account = accounts[0]
    const signer = accounts[1]
    await accountsInstance.createAccount()
    const sig = await getParsedSignatureOfAddress(account, signer)
    await accountsInstance.authorizeValidatorSigner(signer, sig)
  })

  test('SBAT authorize validator key when a validator', async () => {
    const account = accounts[0]
    const signer = accounts[1]
    await accountsInstance.createAccount()
    await setupValidator(account)
    const sig = await getParsedSignatureOfAddress(account, signer)
    await accountsInstance.authorizeValidatorSigner(signer, sig)
  })
})
