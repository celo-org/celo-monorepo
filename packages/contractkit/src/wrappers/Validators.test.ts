import Web3 from 'web3'
import { newKitFromWeb3 } from '../kit'
import { testWithGanache } from '../test-utils/ganache-test'
import { LockedGoldWrapper } from './LockedGold'
import { ValidatorsWrapper } from './Validators'

/*
TEST NOTES:
- In migrations: The only account that has cUSD is accounts[0]
*/

const minLockedGoldValue = Web3.utils.toWei('100', 'ether') // 1 gold
const minLockedGoldNoticePeriod = 120 * 24 * 60 * 60 // 120 days

// A random 64 byte hex string.
const publicKey =
  'ea0733ad275e2b9e05541341a97ee82678c58932464fad26164657a111a7e37a9fa0300266fb90e2135a1f1512350cb4e985488a88809b14e3cbe415e76e82b2'
const blsPublicKey =
  '4d23d8cd06f30b1fa7cf368e2f5399ab04bb6846c682f493a98a607d3dfb7e53a712bb79b475c57b0ac2785460f91301'
const blsPoP =
  '9d3e1d8f49f6b0d8e9a03d80ca07b1d24cf1cc0557bdcc04f5e17a46e35d02d0d411d956dbd5d2d2464eebd7b74ae30005d223780d785d2abc5644fac7ac29fb0e302bdc80c81a5d45018b68b1045068a4b3a4861c93037685fd0d252d740501'

const publicKeysData = '0x' + publicKey + blsPublicKey + blsPoP

testWithGanache('Validators Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let validators: ValidatorsWrapper
  let lockedGold: LockedGoldWrapper

  const registerAccountWithCommitment = async (account: string) => {
    // console.log('isAccount', )
    // console.log('isDelegate', await lockedGold.isDelegate(account))

    if (!(await lockedGold.isAccount(account))) {
      await lockedGold.createAccount().sendAndWaitForReceipt({ from: account })
    }
    await lockedGold
      .newCommitment(minLockedGoldNoticePeriod)
      .sendAndWaitForReceipt({ from: account, value: minLockedGoldValue })
  }

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    validators = await kit.contracts.getValidators()
    lockedGold = await kit.contracts.getLockedGold()
  })

  const setupGroup = async (groupAccount: string) => {
    await registerAccountWithCommitment(groupAccount)
    await validators
      .registerValidatorGroup('thegroup', 'The Group', 'thegroup.com', [minLockedGoldNoticePeriod])
      .sendAndWaitForReceipt({ from: groupAccount })
  }

  const setupValidator = async (validatorAccount: string) => {
    await registerAccountWithCommitment(validatorAccount)
    // set account1 as the validator
    await validators
      .registerValidator(
        'goodoldvalidator',
        'Good old validator',
        'goodold.com',
        // @ts-ignore
        publicKeysData,
        [minLockedGoldNoticePeriod]
      )
      .sendAndWaitForReceipt({ from: validatorAccount })
  }

  test('SBAT registerValidatorGroup', async () => {
    const groupAccount = accounts[0]
    await setupGroup(groupAccount)
    await expect(validators.isValidatorGroup(groupAccount)).resolves.toBe(true)
  })

  test('SBAT registerValidator', async () => {
    const validatorAccount = accounts[1]
    await setupValidator(validatorAccount)
    await expect(validators.isValidator(validatorAccount)).resolves.toBe(true)
  })

  test('SBAT addMember', async () => {
    const groupAccount = accounts[0]
    const validatorAccount = accounts[1]
    await setupGroup(groupAccount)
    await setupValidator(validatorAccount)
    await validators.affiliate(groupAccount).sendAndWaitForReceipt({ from: validatorAccount })
    await validators.addMember(validatorAccount).sendAndWaitForReceipt({ from: groupAccount })

    const members = await validators.getValidatorGroup(groupAccount).then((group) => group.members)
    expect(members).toContain(validatorAccount)
  })

  describe('SBAT reorderMember', () => {
    let groupAccount: string, validator1: string, validator2: string

    beforeEach(async () => {
      groupAccount = accounts[0]
      await setupGroup(groupAccount)

      validator1 = accounts[1]
      validator2 = accounts[2]

      for (const validator of [validator1, validator2]) {
        await setupValidator(validator)
        await validators.affiliate(groupAccount).sendAndWaitForReceipt({ from: validator })
        await validators.addMember(validator).sendAndWaitForReceipt({ from: groupAccount })
      }

      const members = await validators
        .getValidatorGroup(groupAccount)
        .then((group) => group.members)
      expect(members).toEqual([validator1, validator2])
    })

    test('move last to first', async () => {
      await validators
        .reorderMember(groupAccount, validator2, 0)
        .then((x) => x.sendAndWaitForReceipt())

      const membersAfter = await validators
        .getValidatorGroup(groupAccount)
        .then((group) => group.members)
      expect(membersAfter).toEqual([validator2, validator1])
    })

    test('move first to last', async () => {
      await validators
        .reorderMember(groupAccount, validator1, 1)
        .then((x) => x.sendAndWaitForReceipt())

      const membersAfter = await validators
        .getValidatorGroup(groupAccount)
        .then((group) => group.members)
      expect(membersAfter).toEqual([validator2, validator1])
    })
  })
})
