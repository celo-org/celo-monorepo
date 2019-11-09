/* tslint:disable no-console */
import { newKit } from '@celo/contractkit'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { BigNumber } from 'bignumber.js'
import { portForwardAnd } from 'src/lib/port_forward'
import { Argv } from 'yargs'
import { AccountArgv } from '../account'

export const command = 'invite'

export const describe = 'command for sending an invite code to a phone number'

interface InviteArgv extends AccountArgv {
  phone: string
  fast: boolean
}

export const builder = (yargs: Argv) => {
  return yargs.option('phone', {
    type: 'string',
    description: 'Phone number to send invite code,',
    demand: 'Please specify phone number to send invite code',
  })
}

export async function convertToContractDecimals(
  value: number | BigNumber,
  contract: StableTokenWrapper
) {
  const decimals = new BigNumber(await contract.decimals())
  const one = new BigNumber(10).pow(decimals.toNumber())
  return one.times(value)
}

export const handler = async (argv: InviteArgv) => {
  const phone = argv.phone

  console.log(`Sending invitation code to ${phone}`)
  const cb = async () => {
    const kit = newKit('http://localhost:8545')
    const account = (await kit.web3.eth.getAccounts())[0]
    console.log(`Using account: ${account}`)
    kit.defaultAccount = account

    // TODO(asa): This number was made up
    const verificationGasAmount = new BigNumber(10000000)
    // TODO: this default gas price might not be accurate
    const gasPrice = 100000000000

    const temporaryWalletAccount = await kit.web3.eth.accounts.create()
    const temporaryAddress = temporaryWalletAccount.address
    // Buffer.from doesn't expect a 0x for hex input
    const privateKeyHex = temporaryWalletAccount.privateKey.substring(2)
    const inviteCode = Buffer.from(privateKeyHex, 'hex').toString('base64')

    const [goldToken, stableToken, attestations, escrow] = await Promise.all([
      kit.contracts.getGoldToken(),
      kit.contracts.getStableToken(),
      kit.contracts.getAttestations(),
      kit.contracts.getEscrow(),
    ])
    const verificationFee = new BigNumber(
      await attestations.attestationRequestFees(stableToken.address)
    )
    const goldAmount = verificationGasAmount.times(gasPrice).toString()
    const stableTokenInviteAmount = verificationFee.times(10).toString()
    const stableTokenEscrowAmount = (await convertToContractDecimals(5, stableToken)).toString()

    const phoneHash: string = kit.web3.utils.soliditySha3({
      type: 'string',
      value: phone,
    })

    await stableToken.approve(escrow.address, stableTokenEscrowAmount).sendAndWaitForReceipt()
    const expirySeconds = 60 * 60 * 24 * 5 // 5 days

    console.log(
      `Transferring ${goldAmount} Gold, ${stableTokenInviteAmount} StableToken, and escrowing ${stableTokenEscrowAmount}`
    )
    await Promise.all([
      goldToken.transfer(temporaryAddress, goldAmount).sendAndWaitForReceipt(),
      stableToken.transfer(temporaryAddress, stableTokenInviteAmount).sendAndWaitForReceipt(),
      escrow
        .transfer(
          phoneHash,
          stableToken.address,
          stableTokenEscrowAmount,
          expirySeconds,
          temporaryAddress,
          0
        )
        .sendAndWaitForReceipt(),
    ])
    console.log(`Temp address: ${temporaryAddress}`)
    console.log(`Invite code: ${inviteCode}`)
  }
  try {
    await portForwardAnd(argv.celoEnv, cb)
  } catch (error) {
    console.error(`Unable to send invitation code to ${argv.phone}`)
    console.error(error)
    process.exit(1)
  }
}
