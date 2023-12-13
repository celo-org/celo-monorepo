import { newReleaseGold } from '@celo/abis/web3/ReleaseGold'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { getContractFromEvent, testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import { testLocally } from '../../test-utils/cliUtils'
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

  test('can refund celo', async () => {
    await testLocally(Revoke, ['--contract', contractAddress, '--yesreally'])
    const releaseGoldWrapper = new ReleaseGoldWrapper(
      kit.connection,
      newReleaseGold(web3, contractAddress),
      kit.contracts
    )
    const refundAddress = await releaseGoldWrapper.getRefundAddress()
    const balanceBefore = await kit.getTotalBalance(refundAddress)
    await testLocally(RefundAndFinalize, ['--contract', contractAddress])
    const balanceAfter = await kit.getTotalBalance(refundAddress)
    expect(balanceBefore.CELO!.toNumber()).toBeLessThan(balanceAfter.CELO!.toNumber())
  })

  test('can finalize the contract', async () => {
    await testLocally(Revoke, ['--contract', contractAddress, '--yesreally'])
    await testLocally(RefundAndFinalize, ['--contract', contractAddress])
    await expect(testLocally(Show, ['--contract', contractAddress])).rejects.toThrow()
  })
})
