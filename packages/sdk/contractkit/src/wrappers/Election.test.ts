import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { addressToPublicKey, parseSignature } from '@celo/utils/lib/signatureUtils'
import Web3 from 'web3'
import { newKitFromWeb3 } from '../kit'
import { AccountsWrapper } from './Accounts'
import { ElectionWrapper } from './Election'
import { LockedGoldWrapper } from './LockedGold'
import { ValidatorsWrapper } from './Validators'

const minLockedGoldValue = Web3.utils.toWei('10000', 'ether') // 10k gold

testWithGanache('Election Wrapper', (web3) => {
  const ONE_GOLD = web3.utils.toWei('1', 'ether')

  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let election: ElectionWrapper
  let accountsInstance: AccountsWrapper
  let validators: ValidatorsWrapper
  let lockedGold: LockedGoldWrapper

  beforeAll(async () => {
    // accounts = await web3.eth.getAccounts()
    accounts = await kit.connection.getAccounts()
    kit.defaultAccount = accounts[0]
    election = await kit.contracts.getElection()
    validators = await kit.contracts.getValidators()
    lockedGold = await kit.contracts.getLockedGold()
    accountsInstance = await kit.contracts.getAccounts()
  })

  afterAll(async () => {
    kit.connection.stop()
  })

  const registerAccountWithLockedGold = async (account: string) => {
    if (!(await accountsInstance.isAccount(account))) {
      await accountsInstance.createAccount().sendAndWaitForReceipt({ from: account })
    }
    await lockedGold.lock().sendAndWaitForReceipt({ from: account, value: minLockedGoldValue })
  }

  const getParsedSignatureOfAddress = async (address: string, signer: string) => {
    const addressHash = web3.utils.soliditySha3({ type: 'address', value: address })!
    const signature = await kit.connection.sign(addressHash, signer)
    return parseSignature(addressHash, signature, signer)
  }

  const setupValidator = async (validatorAccount: string) => {
    await registerAccountWithLockedGold(validatorAccount)
    const ecdsaPublicKey = await addressToPublicKey(validatorAccount, kit.connection.sign)
    await validators
      // @ts-ignore
      .registerValidator(ecdsaPublicKey, blsPublicKey, blsPoP)
      .sendAndWaitForReceipt({
        from: validatorAccount,
      })
  }

  test('SBAT activate vote', async () => {
    const account = accounts[0]
    const signer = accounts[1]
    await accountsInstance.createAccount().sendAndWaitForReceipt({ from: account })
    const votes = await election.getValidatorGroupsVotes()
    console.log(votes)
  })
  //TODO:
  //getElectabilityThreshold
  // getElectableValidators
  // Activate test
  // active for account
  // has activatable pending votes
  // vote test
  // revoke ative
  // revoke pending
  // revoke
})
