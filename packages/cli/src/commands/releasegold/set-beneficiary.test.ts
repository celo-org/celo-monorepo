import { newKitFromWeb3 } from '@celo/contractkit'
import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { MultiSigWrapper } from '@celo/contractkit/lib/wrappers/MultiSig'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { getContractFromEvent, testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('releasegold:set-beneficiary cmd', (web3: Web3) => {
  let contractAddress: any
  let accounts: string[] = []
  let kit: any
  let releaseGoldMultiSig: MultiSigWrapper
  let releaseGoldWrapper: ReleaseGoldWrapper

  beforeEach(async () => {
    accounts = await web3.eth.getAccounts()
    const contractCanValidate = false
    contractAddress = await getContractFromEvent(
      'ReleaseGoldInstanceCreated(address,address)',
      web3,
      contractCanValidate
    )
    releaseGoldWrapper = new ReleaseGoldWrapper(kit, newReleaseGold(web3, contractAddress))
    kit = newKitFromWeb3(web3)
    const owner = await releaseGoldWrapper.getOwner()
    releaseGoldMultiSig = await kit.contracts.getMultiSig(owner)
  })

  test('can change beneficiary', async () => {
    const beneficiary = await releaseGoldWrapper.getBeneficiary()
    const newBeneficiary = accounts[2]
    const tx = releaseGoldWrapper.setBeneficiary(newBeneficiary)
    const multiSigTxReleaseOwner = await releaseGoldMultiSig.submitOrConfirmTransaction(
      contractAddress,
      tx.txo
    )
    kit.defaultAccount = accounts[0]
    await multiSigTxReleaseOwner.sendAndWaitForReceipt()
    const multiSigTxBeneficiary = await releaseGoldMultiSig.submitOrConfirmTransaction(
      contractAddress,
      tx.txo
    )
    kit.defaultAccount = beneficiary
    await multiSigTxBeneficiary.sendAndWaitForReceipt()
    expect(await releaseGoldWrapper.getBeneficiary()).toEqual(newBeneficiary)
  })
})
