import { newKitFromWeb3 } from '@celo/contractkit'
import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { getContractFromEvent, testWithGanache, timeTravel } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import CreateAccount from './create-account'
import SetLiquidityProvision from './set-liquidity-provision'
import Withdraw from './withdraw'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('releasegold:withdraw cmd', (web3: Web3) => {
  let contractAddress: string
  let kit: any

  beforeEach(async () => {
    const contractCanValidate = true
    contractAddress = await getContractFromEvent(
      'ReleaseGoldInstanceCreated(address,address)',
      web3,
      contractCanValidate
    )
    kit = newKitFromWeb3(web3)
    await CreateAccount.run(['--contract', contractAddress])
  })

  test('can withdraw released gold to beneficiary', async () => {
    await SetLiquidityProvision.run(['--contract', contractAddress, '--yesreally'])
    // ReleasePeriod of default contract
    await timeTravel(100000000, web3)
    const releaseGoldWrapper = new ReleaseGoldWrapper(kit, newReleaseGold(web3, contractAddress))
    const beneficiary = await releaseGoldWrapper.getBeneficiary()
    const balanceBefore = await kit.getTotalBalance(beneficiary)
    await Withdraw.run(['--contract', contractAddress, '--value', '10000000000000000000000'])
    const balanceAfter = await kit.getTotalBalance(beneficiary)
    await expect(balanceBefore.gold.toNumber()).toBeLessThan(balanceAfter.gold.toNumber())
  })
})
