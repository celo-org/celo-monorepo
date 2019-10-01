/* tslint:disable:no-console */
import {
  convertToContractDecimals,
  createInviteCode,
  getDeployedProxiedContract,
  sendEscrowedPayment,
} from '@celo/protocol/lib/web3-utils'
import BigNumber from 'bignumber.js'
import * as twilio from 'twilio'
import { AttestationsInstance, EscrowInstance, GoldTokenInstance, StableTokenInstance } from 'types'
import Web3 = require('web3')

const truffle = require('@celo/protocol/truffle')
const twilioConfig = require('@celo/protocol/twilio-config')

const start = Date.now()

/*
 * A simple script to send a payment and invite a user.
 *
 * Expects the following flags:
 * network: name of the network defined in truffle-config.js to deploy to
 * stableValue: amount of stable token to transfer
 * goldValue: amount of gold transfer
 * phone: phone number of user to invite
 *
 * Run using truffle exec, e.g.:
 * truffle exec scripts/truffle/invite.js --network development --phone +18005882300 \
 * --stableValue 40 --goldValue 10 \
 *
 */
module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['network', 'phone', 'goldValue', 'stableValue'],
    })
    const network = truffle.networks[argv.network]

    logTime('Getting web3 providers...')
    const provider = new Web3.providers.HttpProvider('http://' + network.host + ':' + network.port)
    const web3 = new Web3(provider)

    logTime('Getting attestations...')
    const attestationPromise = getDeployedProxiedContract<AttestationsInstance>(
      'Attestations',
      artifacts
    )

    logTime('Getting Gold token...')
    const goldTokenPromise = getDeployedProxiedContract<GoldTokenInstance>('GoldToken', artifacts)
    logTime('Getting stable token...')
    const stableTokenPromise = getDeployedProxiedContract<StableTokenInstance>(
      'StableToken',
      artifacts
    )
    logTime('Getting Escrow token...')
    const escrowPromise = getDeployedProxiedContract<EscrowInstance>('Escrow', artifacts)

    logTime('Waiting for contracts...')
    const attestations = await attestationPromise
    const goldToken = await goldTokenPromise
    const stableToken = await stableTokenPromise
    const escrow = await escrowPromise
    logTime('Contracts received')

    const stableTokenAmount = await convertToContractDecimals(argv.stableValue, stableToken)
    const verificationFee = new BigNumber(
      await attestations.getAttestationRequestFee(stableToken.address)
    )
    const invitationStableTokenAmount = verificationFee.times(10)

    logTime('Creating invite code...')
    const inviteCodeReturn = await createInviteCode(
      goldToken,
      stableToken,
      invitationStableTokenAmount,
      network.gasPrice,
      web3
    )

    const paymentID = inviteCodeReturn[0]
    const inviteCode = inviteCodeReturn[1]
    logTime(`Payment Id ${paymentID}`)
    logTime(`Invite Code: ${inviteCode}`)

    // @ts-ignore soliditySha3 can take an object
    const phoneHash: string = Web3.utils.soliditySha3({ type: 'string', value: argv.phone })

    logTime('Sending escrow payment...')
    await sendEscrowedPayment(stableToken, escrow, argv.phone, stableTokenAmount, paymentID)
    logTime('Creating twilio client...')
    const twilioClient = twilio(twilioConfig.sid, twilioConfig.authToken)
    const messageText = `Hi! I would like to invite you to join the Celo payments network. Your invite code is: ${inviteCode}`
    logTime('Sending SMS...')
    await twilioClient.messages.create({
      body: messageText,
      from: twilioConfig.phoneNumber,
      to: argv.phone,
    })
    callback()
  } catch (error) {
    callback(error)
  }
  logTime('Finish')
}

function logTime(msg: string) {
  const millis = Date.now() - start
  console.log(`${millis} ms: ${msg}`)
}
