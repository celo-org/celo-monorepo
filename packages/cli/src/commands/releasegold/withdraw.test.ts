import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { getContractFromEvent, testWithGanache, timeTravel } from '@celo/dev-utils/lib/ganache-test'
import { BigNumber } from 'bignumber.js'
import Web3 from 'web3'
import CreateAccount from './create-account'
import SetLiquidityProvision from './set-liquidity-provision'
import RGTransferDollars from './transfer-dollars'
import Withdraw from './withdraw'

process.env.NO_SYNCCHECK = 'true'

testWithGanache('releasegold:withdraw cmd', (web3: Web3) => {
  let contractAddress: string
  let kit: ContractKit

  beforeEach(async () => {
    contractAddress = await getContractFromEvent(
      'ReleaseGoldInstanceCreated(address,address)',
      web3
    )
    kit = newKitFromWeb3(web3)
    await CreateAccount.run(['--contract', contractAddress])
  })

  test('can withdraw released gold to beneficiary', async () => {
    await SetLiquidityProvision.run(['--contract', contractAddress, '--yesreally'])
    // ReleasePeriod of default contract
    await timeTravel(100000000, web3)
    const releaseGoldWrapper = new ReleaseGoldWrapper(
      kit.connection,
      newReleaseGold(web3, contractAddress),
      kit.contracts
    )
    const beneficiary = await releaseGoldWrapper.getBeneficiary()
    const balanceBefore = (await kit.getTotalBalance(beneficiary)).CELO!
    // Use a value which would lose precision if converted to a normal javascript number
    const withdrawalAmount = '10000000000000000000005'
    await Withdraw.run(['--contract', contractAddress, '--value', withdrawalAmount])
    const balanceAfter = (await kit.getTotalBalance(beneficiary)).CELO!
    const difference = balanceAfter.minus(balanceBefore)
    expect(difference).toEqBigNumber(new BigNumber(withdrawalAmount))
  })

  test("can't withdraw the whole balance if there is a cUSD balance", async () => {
    await SetLiquidityProvision.run(['--contract', contractAddress, '--yesreally'])
    // ReleasePeriod of default contract
    await timeTravel(100000000, web3)
    const releaseGoldWrapper = new ReleaseGoldWrapper(
      kit.connection,
      newReleaseGold(web3, contractAddress),
      kit.contracts
    )
    const beneficiary = await releaseGoldWrapper.getBeneficiary()
    const balanceBefore = await kit.getTotalBalance(beneficiary)
    const remainingBalance = await releaseGoldWrapper.getRemainingUnlockedBalance()

    const stableToken = await kit.contracts.getStableToken()

    await stableToken.transfer(contractAddress, 100).sendAndWaitForReceipt({ from: beneficiary })

    // Can't withdraw since there is cUSD balance still
    await expect(
      Withdraw.run(['--contract', contractAddress, '--value', remainingBalance.toString()])
    ).rejects.toThrow()

    // Move out the cUSD balance
    await await RGTransferDollars.run([
      '--contract',
      contractAddress,
      '--to',
      beneficiary,
      '--value',
      '100',
    ])

    await Withdraw.run(['--contract', contractAddress, '--value', remainingBalance.toString()])
    const balanceAfter = await kit.getTotalBalance(beneficiary)
    expect(balanceBefore.CELO!.toNumber()).toBeLessThan(balanceAfter.CELO!.toNumber())

    // Contract should self-destruct now
    await expect(releaseGoldWrapper.getRemainingUnlockedBalance()).rejects.toThrow()
  })
})
