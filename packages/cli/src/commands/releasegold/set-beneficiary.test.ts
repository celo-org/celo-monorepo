import { newReleaseGold } from '@celo/abis/web3/ReleaseGold'
import { newKitFromWeb3 } from '@celo/contractkit'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { getContractFromEvent, testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import { testLocally } from '../../test-utils/cliUtils'
import SetBeneficiary from './set-beneficiary'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('releasegold:set-beneficiary cmd', (web3: Web3) => {
  let contractAddress: any
  let kit: any
  let releaseGoldWrapper: ReleaseGoldWrapper
  let releaseGoldMultiSig: any
  let releaseOwner: string
  let beneficiary: string
  let newBeneficiary: string
  let otherAccount: string

  beforeEach(async () => {
    const accounts = await web3.eth.getAccounts()
    releaseOwner = accounts[0]
    newBeneficiary = accounts[2]
    otherAccount = accounts[3]
    contractAddress = await getContractFromEvent(
      'ReleaseGoldInstanceCreated(address,address)',
      web3,
      { index: 1 } // canValidate = false
    )
    kit = newKitFromWeb3(web3)
    releaseGoldWrapper = new ReleaseGoldWrapper(
      kit.connection,
      newReleaseGold(web3, contractAddress),
      kit.contracts
    )
    beneficiary = await releaseGoldWrapper.getBeneficiary()
    const owner = await releaseGoldWrapper.getOwner()
    releaseGoldMultiSig = await kit.contracts.getMultiSig(owner)
  })

  test('can change beneficiary', async () => {
    // First submit the tx from the release owner (accounts[0])
    await testLocally(SetBeneficiary, [
      '--contract',
      contractAddress,
      '--from',
      releaseOwner,
      '--beneficiary',
      newBeneficiary,
      '--yesreally',
    ])
    // The multisig tx should not confirm until both parties submit
    expect(await releaseGoldWrapper.getBeneficiary()).toEqual(beneficiary)
    await testLocally(SetBeneficiary, [
      '--contract',
      contractAddress,
      '--from',
      beneficiary,
      '--beneficiary',
      newBeneficiary,
      '--yesreally',
    ])
    expect(await releaseGoldWrapper.getBeneficiary()).toEqual(newBeneficiary)
    // It should also update the multisig owners
    expect(await releaseGoldMultiSig.getOwners()).toEqual([releaseOwner, newBeneficiary])
  })

  test('if called by a different account, it should fail', async () => {
    await expect(
      testLocally(SetBeneficiary, [
        '--contract',
        contractAddress,
        '--from',
        otherAccount,
        '--beneficiary',
        newBeneficiary,
        '--yesreally',
      ])
    ).rejects.toThrow()
  })

  test('if the owners submit different txs, nothing on the ReleaseGold contract should change', async () => {
    // ReleaseOwner tries to change the beneficiary to `newBeneficiary` while the beneficiary
    // tries to change to `otherAccount`. Nothing should change on the RG contract.
    await testLocally(SetBeneficiary, [
      '--contract',
      contractAddress,
      '--from',
      releaseOwner,
      '--beneficiary',
      newBeneficiary,
      '--yesreally',
    ])
    await testLocally(SetBeneficiary, [
      '--contract',
      contractAddress,
      '--from',
      beneficiary,
      '--beneficiary',
      otherAccount,
      '--yesreally',
    ])
    expect(await releaseGoldWrapper.getBeneficiary()).toEqual(beneficiary)
    expect(await releaseGoldMultiSig.getOwners()).toEqual([releaseOwner, beneficiary])
  })
})
