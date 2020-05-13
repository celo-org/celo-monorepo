import * as functions from 'firebase-functions'
import twilio, { Twilio } from 'twilio'

export interface NetworkConfig {
  nodeUrl: string
  faucetGoldAmount: string
  faucetDollarAmount: string
  inviteGoldAmount: string
  inviteDollarAmount: string
  escrowDollarAmount: string
  expirySeconds: number
  minAttestations: number
  twilioPhoneNumber: string
  twilioClient: Twilio | null
}

let twilioClient: Twilio
// Given Node.js single thread model, there shouldn't be any locks required here.
function getTwilioClient(sid?: string, authToken?: string) {
  if (sid && authToken) {
    if (twilioClient == null) {
      twilioClient = twilio(sid, authToken)
    }
    return twilioClient
  }
  return null
}

export function getNetworkConfig(net: string): NetworkConfig {
  const allconfig = functions.config()
  const config = allconfig.faucet

  if (config[net] == null) {
    throw new Error('No Config for: ' + net)
  }

  return {
    nodeUrl: config[net].node_url,
    faucetGoldAmount: config[net].faucet_gold_amount,
    faucetDollarAmount: config[net].faucet_dollar_amount,
    inviteGoldAmount: config[net].invite_gold_amount,
    inviteDollarAmount: config[net].invite_dollar_amount,
    escrowDollarAmount: config[net].escrow_dollar_amount,
    expirySeconds: Number(config[net].expiry_seconds),
    minAttestations: Number(config[net].min_attestations),
    twilioPhoneNumber: config[net].twilio_phone_number,
    twilioClient: getTwilioClient(config[net].twilio_sid, config[net].twilio_auth_token),
  }
}
