// Utilities for interacting with the Phone Number Privacy Service service (aka PGPNP)

import { ContractKit } from '@celo/contractkit'
import { ErrorMessages } from 'src/app/ErrorMessages'
import networkConfig from 'src/geth/networkConfig'
import Logger from 'src/utils/Logger'

const TAG = 'identity/phoneNumPrivacyService'

export async function postToPhoneNumPrivacyService<ResponseType>(
  account: string,
  contractKit: ContractKit,
  body: object,
  endpoint: string
) {
  Logger.debug(`${TAG}@postToPGPNP`, `Posting to ${endpoint}`)

  // Sign payload using account privkey
  const bodyString = JSON.stringify(body)
  const authHeader = await contractKit.web3.eth.sign(bodyString, account)
  const { pgpnpUrl } = networkConfig
  const res = await fetch(pgpnpUrl + endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: bodyString,
  })

  if (!res.ok) {
    handleFailure(res)
  }

  Logger.debug(`${TAG}@postToPGPNP`, 'Response ok. Parsing.')
  const response = await res.json()
  return response as ResponseType
}

function handleFailure(res: Response) {
  Logger.error(`${TAG}@handleFailure`, `Response not okay. Status ${res.status}`)
  switch (res.status) {
    case 403:
      throw new Error(ErrorMessages.SALT_QUOTA_EXCEEDED)
    default:
      throw new Error('Unknown failure')
  }
}
