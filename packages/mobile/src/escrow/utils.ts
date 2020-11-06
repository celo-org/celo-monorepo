import { ensureLeading0x, trimLeading0x } from '@celo/base'
import { ContractKit } from '@celo/contractkit'

export const splitSignature = (contractKit: ContractKit, signature: string) => {
  const sig = trimLeading0x(signature)
  const r = `0x${sig.slice(0, 64)}`
  const s = `0x${sig.slice(64, 128)}`
  const v = contractKit.web3.utils.hexToNumber(ensureLeading0x(sig.slice(128, 130)))
  return { r, s, v }
}

function* formEscrowWithdrawTx(
  contractKit: ContractKit,
  escrowWrapper: EscrowWrapper,
  paymentId: string,
  pepper: string,
  msgHash: string,
  addressIndex: number
) {
  if (features.ESCROW_WITHOUT_CODE) {
    const { privateKey } = generateDeterministicInviteCode(pepper, i)
    const signature: string = (yield contractKit.web3.eth.accounts.sign(msgHash, privateKey))
      .signature
    Logger.debug(
      TAG + '@withdrawFromEscrowViaKomenci',
      `Signed message hash signature is ${signature}`
    )

    const { r, s, v } = splitSignature(contractKit, signature)
    const withdrawTx = escrowWrapper.withdraw(paymentId, v, r, s)
    return withdrawTx
  }
}
