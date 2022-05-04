import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { getContractFromEvent, testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import RefundAndFinalize from './refund-and-finalize'
import Revoke from './revoke'
import Show from './show'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('releasegold:refund-and-finalize cmd', (web3: Web3) => {
  let contractAddress: any
  let kit: ContractKit

  beforeEach(async () => {
    contractAddress = await getContractFromEvent(
      'ReleaseGoldInstanceCreated(address,address)',
      web3,
      { index: 1 } // revocable = true
    )
    kit = newKitFromWeb3(web3)
  })

  test('can refund gold', async () => {
    await Revoke.run(['--contract', contractAddress, '--yesreally'])
    const releaseGoldWrapper = new ReleaseGoldWrapper(
      kit.connection,
      newReleaseGold(web3, contractAddress),
      kit.contracts
    )
    const refundAddress = await releaseGoldWrapper.getRefundAddress()
    const balanceBefore = await kit.getTotalBalance(refundAddress)
    await RefundAndFinalize.run(['--contract', contractAddress])
    const balanceAfter = await kit.getTotalBalance(refundAddress)
    expect(balanceBefore.CELO!.toNumber()).toBeLessThan(balanceAfter.CELO!.toNumber())
  })

  test('can finalize the contract', async () => {
    await Revoke.run(['--contract', contractAddress, '--yesreally'])
    await RefundAndFinalize.run(['--contract', contractAddress])
    await expect(Show.run(['--contract', contractAddress])).rejects.toThrow()
  })
})
