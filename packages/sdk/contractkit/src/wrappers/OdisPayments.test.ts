import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { newKitFromWeb3 } from '../kit'
import { OdisPaymentsWrapper } from './OdisPayments'

testWithGanache('OdisPayments Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let odisPayments: OdisPaymentsWrapper

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
  })

  it('balance should increment after sending funds (todo rename)', async () => {
    odisPayments = await kit.contracts.getOdisPayments()
    const balanceBefore = await odisPayments.totalPaidCUSD(kit.defaultAccount as string)
    const stableTokenContract = await kit.contracts.getStableToken()
    const oneCUSD = kit.web3.utils.toWei('1', 'ether')

    const approveTx = await stableTokenContract
      .approve(odisPayments.address as string, oneCUSD)
      .send()
    await approveTx.waitReceipt()
    await odisPayments.payInCUSD(kit.defaultAccount as string, oneCUSD).send()

    const balanceAfter = await odisPayments.totalPaidCUSD(kit.defaultAccount as string)

    expect(balanceAfter).toEqual((+oneCUSD + +balanceBefore).toString())
  })
})
