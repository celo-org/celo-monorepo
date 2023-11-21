import { getParsedSignatureOfAddress } from '@celo/contractkit/lib/utils/getParsedSignatureOfAddress'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { newKitFromWeb3 } from '../kit'
import { EscrowWrapper } from './Escrow'
import { FederatedAttestationsWrapper } from './FederatedAttestations'
import { StableTokenWrapper } from './StableTokenWrapper'

testWithGanache('Escrow Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  const TEN_CUSD = kit.web3.utils.toWei('10', 'ether')
  const TIMESTAMP = 1665080820

  function getParsedSignatureOfAddressForTest(address, signer) {
    return getParsedSignatureOfAddress(
      web3.utils.soliditySha3,
      kit.connection.sign,
      address,
      signer
    )
  }

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
      .sendAndWaitForReceipt()

    await stableTokenContract.approve(escrow.address, TEN_CUSD).sendAndWaitForReceipt()

    await escrow
      .transferWithTrustedIssuers(
        identifier,
        stableTokenContract.address,
        TEN_CUSD,
        1000,
        testPaymentId,
        1,
        accounts
      )
      .sendAndWaitForReceipt()

    const trustedIssuersPerPayment = await escrow.getTrustedIssuersPerPayment(testPaymentId)

    expect(trustedIssuersPerPayment[0]).toEqual(kit.defaultAccount)
  })
  it('withdraw should be successful after transferWithTrustedIssuers', async () => {
    const sender: string = accounts[1]
    const receiver: string = accounts[2]
    const withdrawKeyAddress: string = accounts[3]
    const oneDayInSecs: number = 86400
    const parsedSig = await getParsedSignatureOfAddressForTest(receiver, withdrawKeyAddress)

    await federatedAttestations
      .registerAttestationAsIssuer(identifier, receiver, TIMESTAMP)
      .sendAndWaitForReceipt()

    const senderBalanceBefore = await stableTokenContract.balanceOf(sender)
    const receiverBalanceBefore = await stableTokenContract.balanceOf(receiver)

    await stableTokenContract
      .approve(escrow.address, TEN_CUSD)
      .sendAndWaitForReceipt({ from: sender })

    await escrow
      .transferWithTrustedIssuers(
        identifier,
        stableTokenContract.address,
        TEN_CUSD,
        oneDayInSecs,
        withdrawKeyAddress,
        1,
        accounts
      )
      .sendAndWaitForReceipt({ from: sender })

    await escrow
      .withdraw(withdrawKeyAddress, parsedSig.v, parsedSig.r, parsedSig.s)
      .sendAndWaitForReceipt({ from: receiver })

    const senderBalanceAfter = await stableTokenContract.balanceOf(sender)
    const receiverBalanceAfter = await stableTokenContract.balanceOf(receiver)

    expect(senderBalanceBefore.minus(+TEN_CUSD)).toEqual(senderBalanceAfter)
    expect(receiverBalanceBefore.plus(+TEN_CUSD)).toEqual(receiverBalanceAfter)
  })
  it('withdraw should revert if attestation is not registered', async () => {
    const sender: string = accounts[1]
    const receiver: string = accounts[2]
    const withdrawKeyAddress: string = accounts[3]
    const oneDayInSecs: number = 86400
    const parsedSig = await getParsedSignatureOfAddressForTest(receiver, withdrawKeyAddress)

    await stableTokenContract
      .approve(escrow.address, TEN_CUSD)
      .sendAndWaitForReceipt({ from: sender })

    await escrow
      .transferWithTrustedIssuers(
        identifier,
        stableTokenContract.address,
        TEN_CUSD,
        oneDayInSecs,
        withdrawKeyAddress,
        1,
        accounts
      )
      .sendAndWaitForReceipt({ from: sender })

    await expect(
      escrow
        .withdraw(withdrawKeyAddress, parsedSig.v, parsedSig.r, parsedSig.s)
        .sendAndWaitForReceipt()
    ).rejects.toThrow()
  })
  it('withdraw should revert if attestation is registered by issuer not on the trusted issuers list', async () => {
    const sender: string = accounts[1]
    const receiver: string = accounts[2]
    const withdrawKeyAddress: string = accounts[3]
    const oneDayInSecs: number = 86400
    const parsedSig = await getParsedSignatureOfAddressForTest(receiver, withdrawKeyAddress)

    await federatedAttestations
      .registerAttestationAsIssuer(identifier, receiver, TIMESTAMP)
      .sendAndWaitForReceipt()

    await stableTokenContract
      .approve(escrow.address, TEN_CUSD)
      .sendAndWaitForReceipt({ from: sender })

    await escrow
      .transferWithTrustedIssuers(
        identifier,
        stableTokenContract.address,
        TEN_CUSD,
        oneDayInSecs,
        withdrawKeyAddress,
        1,
        [accounts[5]]
      )
      .sendAndWaitForReceipt({ from: sender })

    await expect(
      escrow
        .withdraw(withdrawKeyAddress, parsedSig.v, parsedSig.r, parsedSig.s)
        .sendAndWaitForReceipt()
    ).rejects.toThrow()
  })
})
