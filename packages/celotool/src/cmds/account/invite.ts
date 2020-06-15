/* tslint:disable no-console */
import { newKit } from '@celo/contractkit'
import { BigNumber } from 'bignumber.js'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { execCmd } from 'src/lib/cmd-utils'
import { convertToContractDecimals } from 'src/lib/contract-utils'
import { portForwardAnd } from 'src/lib/port_forward'
import twilio from 'twilio'
import { Argv } from 'yargs'
import { AccountArgv } from '../account'

export const command = 'invite'

export const describe = 'command for sending an invite code to a phone number'

interface InviteArgv extends AccountArgv {
  phone: string
}

export const builder = (yargs: Argv) => {
  return yargs.option('phone', {
    type: 'string',
    description: 'Phone number to send invite code,',
    demand: 'Please specify phone number to send invite code',
  })
}

export const handler = async (argv: InviteArgv) => {
  await switchToClusterFromEnv()
  const phone = argv.phone

  console.log(`Sending invitation code to ${phone}`)

  // This key is only present in celo-testnet
  await execCmd('gcloud config set project celo-testnet')
  await execCmd(
    'gcloud kms decrypt --ciphertext-file=twilio-config.enc --plaintext-file=twilio-config.js \
    --key=github-key --keyring=celo-keyring --location=global'
  )
  const cb = async () => {
    const kit = newKit('http://localhost:8545')
    const account = (await kit.web3.eth.getAccounts())[0]
    console.log(`Using account: ${account}`)
    kit.defaultAccount = account

    // TODO(asa): This number was made up
    const attestationGasAmount = new BigNumber(10000000)
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
    const attestationFee = new BigNumber(
      await attestations.attestationRequestFees(stableToken.address)
    )
    const goldAmount = attestationGasAmount.times(gasPrice).toString()
    const stableTokenInviteAmount = attestationFee.times(10).toString()
    const stableTokenEscrowAmount = (await convertToContractDecimals(5, stableToken)).toString()

    const phoneHash: string = kit.web3.utils.soliditySha3({
      type: 'string',
      value: phone,
    })

    await stableToken.approve(escrow.address, stableTokenEscrowAmount).sendAndWaitForReceipt()
    const expirySeconds = 60 * 60 * 24 * 5 // 5 days

    console.log(
      `Transferring ${goldAmount} Gold, ${stableTokenInviteAmount} StableToken, and escrowing ${stableTokenEscrowAmount} StableToken`
    )
    await Promise.all([
      // TODO: remove if no one is paying for gas with gold
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
    const messageText = `Hi! I would like to invite you to join the Celo payments network. Your invite code is: ${inviteCode}`
    console.log('Sending SMS...')
    const twilioConfig = require('twilio-config')
    const twilioClient = twilio(twilioConfig.sid, twilioConfig.authToken)
    await twilioClient.messages.create({
      body: messageText,
      from: twilioConfig.phoneNumber,
      to: argv.phone,
    })
  }
  try {
    await portForwardAnd(argv.celoEnv, cb)
  } catch (error) {
    console.error(`Unable to send invitation code to ${argv.phone}`)
    console.error(error)
    process.exit(1)
  }
}
