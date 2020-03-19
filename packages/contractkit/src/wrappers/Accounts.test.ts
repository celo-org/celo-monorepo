import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { addressToPublicKey, parseSignature } from '@celo/utils/lib/signatureUtils'
import Web3 from 'web3'
import { newKitFromWeb3 } from '../kit'
import { AccountsWrapper } from './Accounts'
import { LockedGoldWrapper } from './LockedGold'
import { ValidatorsWrapper } from './Validators'

jest.setTimeout(10 * 1000)

/*
TEST NOTES:
- In migrations: The only account that has cUSD is accounts[0]
*/

const minLockedGoldValue = Web3.utils.toWei('10000', 'ether') // 10k gold

// Random hex strings
const blsPublicKey =
  '0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00'
const blsPoP =
  '0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900'

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
    await registerAccountWithLockedGold(validatorAccount)
    const ecdsaPublicKey = await addressToPublicKey(validatorAccount, kit.web3.eth.sign)
    await validators
      // @ts-ignore
      .registerValidator(ecdsaPublicKey, blsPublicKey, blsPoP)
      .sendAndWaitForReceipt({
        from: validatorAccount,
      })
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

  test('SBAT authorize validator key and change BLS key atomically', async () => {
    const newBlsPublicKey = web3.utils.randomHex(96)
    const newBlsPoP = web3.utils.randomHex(48)
    const account = accounts[0]
    const signer = accounts[1]
    await accountsInstance.createAccount()
    await setupValidator(account)
    const sig = await getParsedSignatureOfAddress(account, signer)
    await accountsInstance.authorizeValidatorSignerAndBls(signer, sig, newBlsPublicKey, newBlsPoP)
  })

  test('SBAT set the wallet address to the caller', async () => {
    await accountsInstance.createAccount()
    await accountsInstance.setWalletAddress(accounts[0])
  })

  test('SBAT set the wallet address to a different wallet address', async () => {
    await accountsInstance.createAccount()
    const signature = await accountsInstance.generateProofOfKeyPossession(accounts[0], accounts[1])
    await accountsInstance.setWalletAddress(accounts[1], signature)
  })

  test('SNBAT to set to a different wallet address without a signature', async () => {
    await expect(accountsInstance.setWalletAddress(accounts[1])).rejects
  })
})
