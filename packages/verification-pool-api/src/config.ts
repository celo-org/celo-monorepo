import * as functions from 'firebase-functions'
import Nexmo from 'nexmo'
import twilio from 'twilio'
import Web3 from 'web3'
import Contract from 'web3/eth/contract'
import Attestations from '../contracts/Attestations'
import GoldToken from '../contracts/GoldToken'
import StableToken from '../contracts/StableToken'
import { CELO_ENV } from './celoEnv'
import { TokenType } from './types'

const functionConfig = functions.config()
export const poolAddress = functionConfig.shared['eth-address']
export const poolPrivateKey = functionConfig.shared['eth-private-key']
export const twilioPhoneNum = functionConfig.shared['twilio-phone-number']
export const alwaysUseTwilio = functionConfig.shared['always-use-twilio'] === 'true'
export const fcmKey = functionConfig.shared.fcmkey
export const networkid = functionConfig[CELO_ENV]['testnet-id']
export const appSignature = functionConfig[CELO_ENV]['app-signature']
export const smsAckTimeout = functionConfig[CELO_ENV]['sms-ack-timeout'] || 5000 // default 5 seconds

// @ts-ignore
export const web3 = new Web3(`https://${CELO_ENV}-infura.celo-testnet.org`)

let twilioClient: any
let nexmoClient: any

// Given Node.js single thread model, there shouldn't be any locks required here.
export function getTwilioClient() {
  if (twilioClient == null) {
    twilioClient = twilio(
      functionConfig.shared['twilio-sid'],
      functionConfig.shared['twilio-auth-token']
    )
  }
  return twilioClient
}

export function getNexmoClient() {
  if (nexmoClient == null) {
    nexmoClient = new Nexmo({
      apiKey: functionConfig.shared['nexmo-key'],
      apiSecret: functionConfig.shared['nexmo-secret'],
    })
  }
  return nexmoClient
}

export async function sendSmsWithNexmo(countryCode: string, phoneNumber: string, message: string) {
  const client = getNexmoClient()
  return new Promise((resolve, reject) => {
    client.message.sendSms(
      functionConfig.shared['nexmo-from-' + countryCode.toLowerCase()],
      phoneNumber,
      message,
      (err: Error, responseData: any) => {
        if (err) {
          reject(err)
        } else {
          if (responseData.messages[0].status === '0') {
            resolve(responseData.messages[0])
          } else {
            reject(responseData.messages[0]['error-text'])
          }
        }
      }
    )
  })
}

let attestations: Contract
export async function getAttestations() {
  if (attestations == null) {
    attestations = await Attestations(web3)
  }
  return attestations
}

let goldToken: Contract
export async function getGoldToken() {
  if (goldToken == null) {
    goldToken = await GoldToken(web3)
  }
  return goldToken
}

let stableToken: Contract
export async function getStableToken() {
  if (stableToken == null) {
    stableToken = await StableToken(web3)
  }
  return stableToken
}

export async function getTokenType(tokenAddress: string) {
  if (tokenAddress === (await getGoldToken()).options.address) {
    return TokenType.GOLD
  } else if (tokenAddress === (await getStableToken()).options.address) {
    return TokenType.DOLLAR
  } else {
    console.error(`Unexpected token type for address: ${tokenAddress}`)
    return null
  }
}

export async function getTokenContract(tokenType: TokenType) {
  switch (tokenType) {
    case TokenType.GOLD:
      return getGoldToken()
    case TokenType.DOLLAR:
      return getStableToken()
    default:
      console.error('Unexpected token type', tokenType)
      return null
  }
}
