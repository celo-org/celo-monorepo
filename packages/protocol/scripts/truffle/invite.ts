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

    const provider = new Web3.providers.HttpProvider('http://' + network.host + ':' + network.port)
    const web3 = new Web3(provider)

    const attestations = await getDeployedProxiedContract<AttestationsInstance>(
      'Attestations',
      artifacts
    )
    const goldToken = await getDeployedProxiedContract<GoldTokenInstance>('GoldToken', artifacts)
    const stableToken = await getDeployedProxiedContract<StableTokenInstance>(
      'StableToken',
      artifacts
    )
    const escrow = await getDeployedProxiedContract<EscrowInstance>('Escrow', artifacts)

    const stableTokenAmount = await convertToContractDecimals(argv.stableValue, stableToken)
    const verificationFee = new BigNumber(
      await attestations.getAttestationRequestFee(stableToken.address)
    )
    const invitationStableTokenAmount = verificationFee.times(10)

    const inviteCodeReturn = await createInviteCode(
      goldToken,
      stableToken,
      invitationStableTokenAmount,
      network.gasPrice,
      web3
    )

    const paymentID = inviteCodeReturn[0]
    const inviteCode = inviteCodeReturn[1]
    console.log('Payment Id', paymentID)
    console.log('Invite Code:', inviteCode)

    // @ts-ignore soliditySha3 can take an object
    const phoneHash: string = Web3.utils.soliditySha3({ type: 'string', value: argv.phone })

    await sendEscrowedPayment(stableToken, escrow, argv.phone, stableTokenAmount, paymentID)

    const twilioClient = twilio(twilioConfig.sid, twilioConfig.authToken)
    const messageText = `Hi! I would like to invite you to join the Celo payments network. Your invite code is: ${inviteCode}`
    await twilioClient.messages.create({
      body: messageText,
      from: twilioConfig.phoneNumber,
      to: argv.phone,
    })
    callback()
  } catch (error) {
    callback(error)
  }
}
