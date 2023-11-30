import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { newKitFromWeb3 } from '../kit'
import { AccountsWrapper } from './Accounts'
import { LockedGoldWrapper } from './LockedGold'

testWithGanache('LockedGold Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  let accounts: AccountsWrapper
  let lockedGold: LockedGoldWrapper

  // Arbitrary value.
  const value = 120938732980
  let account: string
  beforeAll(async () => {
    account = (await web3.eth.getAccounts())[0]
    kit.defaultAccount = account
    lockedGold = await kit.contracts.getLockedGold()
    accounts = await kit.contracts.getAccounts()
    if (!(await accounts.isAccount(account))) {
      await accounts.createAccount().sendAndWaitForReceipt({ from: account })
    }
  })

  test('SBAT lock gold', async () => {
    await lockedGold.lock().sendAndWaitForReceipt({ value })
  })

  test('SBAT unlock gold', async () => {
    await lockedGold.lock().sendAndWaitForReceipt({ value })
    await lockedGold.unlock(value).sendAndWaitForReceipt()
  })

  test('SBAT relock gold', async () => {
    // Make 5 pending withdrawals.
    await lockedGold.lock().sendAndWaitForReceipt({ value: value * 5 })
    await lockedGold.unlock(value).sendAndWaitForReceipt()
    await lockedGold.unlock(value).sendAndWaitForReceipt()
    await lockedGold.unlock(value).sendAndWaitForReceipt()
    await lockedGold.unlock(value).sendAndWaitForReceipt()
    await lockedGold.unlock(value).sendAndWaitForReceipt()
    // Re-lock 2.5 of them
    const txos = await lockedGold.relock(account, value * 2.5)
    await Promise.all(txos.map((txo) => txo.sendAndWaitForReceipt()))
    //
  })
  // when this fails the 2 tests below should pass.
  test('getTotalPendingWithdrawalsCount throws when version is below minimum', async () => {
    expect(lockedGold.getTotalPendingWithdrawalsCount(account)).rejects.toThrowError(
      'getTotalPendingWithdrawalsCount not implemented for LockedGold version (1.1.3.0) deployed to this chain'
    )
  })
  test.failing('should return the count of pending withdrawals', async () => {
    await lockedGold.lock().sendAndWaitForReceipt({ value: value * 2 })
    await lockedGold.unlock(value).sendAndWaitForReceipt()
    await lockedGold.unlock(value).sendAndWaitForReceipt()

    const count = await lockedGold.getTotalPendingWithdrawalsCount(account)
    expect(count).toEqBigNumber(2)
  })

  test.failing('should return zero when there are no pending withdrawals', async () => {
    const count = await lockedGold.getTotalPendingWithdrawalsCount(account)
    expect(count).toEqBigNumber(0)
  })

  test('should return the pending withdrawal at a given index', async () => {
    await lockedGold.lock().sendAndWaitForReceipt({ value: value * 2 })
    await lockedGold.unlock(value).sendAndWaitForReceipt()
    const pendingWithdrawal = await lockedGold.getPendingWithdrawal(account, 0)

    expect(pendingWithdrawal.value).toEqBigNumber(value)
  })

  test('should throw an error for an invalid index', async () => {
    await expect(lockedGold.getPendingWithdrawal(account, 999)).rejects.toThrow(
      'Bad pending withdrawal index'
    )
  })
})
