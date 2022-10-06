import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { getParsedSignatureOfAddress } from '@celo/protocol/lib/signing-utils'
import { newKitFromWeb3 } from '../kit'
import { EscrowWrapper } from './Escrow'
import { FederatedAttestationsWrapper } from './FederatedAttestations'
import { StableTokenWrapper } from './StableTokenWrapper'

testWithGanache('Escrow Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  const TEN_CUSD = kit.web3.utils.toWei('10', 'ether')
  const TIMESTAMP = 1665080820

  let accounts: string[] = []
  let escrow: EscrowWrapper
  let federatedAttestations: FederatedAttestationsWrapper
  let stableTokenContract: StableTokenWrapper
  let identifier: string

  beforeAll(async () => {
    escrow = await kit.contracts.getEscrow()
    stableTokenContract = await kit.contracts.getStableToken()
    federatedAttestations = await kit.contracts.getFederatedAttestations()

    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]

    identifier = kit.web3.utils.soliditySha3({
      t: 'bytes32',
      v: kit.web3.eth.accounts.create().address,
    }) as string
  })

  it('transfer with trusted issuers should set TrustedIssuersPerPayment', async () => {
    const testPaymentId = kit.web3.eth.accounts.create().address
    await federatedAttestations
      .registerAttestationAsIssuer(identifier, kit.defaultAccount as string, TIMESTAMP)
      .send()

    const approveTx = await stableTokenContract.approve(escrow.address, TEN_CUSD).send()
    await approveTx.waitReceipt()
    await escrow
      .transferWithTrustedIssuers(
        identifier,
        stableTokenContract.address,
        TEN_CUSD,
        1000,
        testPaymentId,
        1,
        [kit.defaultAccount as string]
      )
      .send()

    const trustedIssuersPerPayment = await escrow.getTrustedIssuersPerPayment(testPaymentId)

    expect(trustedIssuersPerPayment[0]).toEqual(kit.defaultAccount)
  })
  it('withdraw should be successful after transferWithTrustedIssuers', async () => {
    const sender: string = accounts[1]
    const receiver: string = accounts[2]
    const withdrawKeyAddress: string = accounts[3]
    const oneDayInSecs: number = 86400
    const uniquePaymentIDWithdraw = withdrawKeyAddress
    const parsedSig = await getParsedSignatureOfAddress(web3, receiver, uniquePaymentIDWithdraw)

    await federatedAttestations.registerAttestationAsIssuer(identifier, receiver, TIMESTAMP).send()

    const senderBalanceBefore = await stableTokenContract.balanceOf(sender)
    const receiverBalanceBefore = await stableTokenContract.balanceOf(receiver)

    const approveTx = await stableTokenContract
      .approve(escrow.address, TEN_CUSD)
      .send({ from: sender })
    await approveTx.waitReceipt()

    await escrow
      .transferWithTrustedIssuers(
        identifier,
        stableTokenContract.address,
        TEN_CUSD,
        oneDayInSecs,
        uniquePaymentIDWithdraw,
        1,
        [kit.defaultAccount as string]
      )
      .send({ from: sender })

    await escrow
      .withdraw(uniquePaymentIDWithdraw, parsedSig.v, parsedSig.r, parsedSig.s)
      .send({ from: receiver })

    const senderBalanceAfter = await stableTokenContract.balanceOf(sender)
    const receiverBalanceAfter = await stableTokenContract.balanceOf(receiver)

    expect(senderBalanceBefore.minus(+TEN_CUSD)).toEqual(senderBalanceAfter)
    expect(receiverBalanceBefore.plus(+TEN_CUSD)).toEqual(receiverBalanceAfter)
  })
})
