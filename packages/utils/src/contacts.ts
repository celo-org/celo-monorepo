import * as Web3Utils from 'web3-utils'

export interface ContactPhoneNumber {
  label?: string
  number?: string
}

export interface MinimalContact {
  recordID: string
  displayName?: string
  phoneNumbers?: ContactPhoneNumber[]
  thumbnailPath?: string
}

export const getContactPhoneNumber = (contact: MinimalContact) => {
  if (!contact) {
    throw new Error('Invalid contact')
  }

  if (!contact.phoneNumbers || !contact.phoneNumbers.length) {
    return null
  }

  // TODO(Rossy) find the right phone number based on the address
  return contact.phoneNumbers[0].number
}

export const getContactNameHash = (contact: MinimalContact) => {
  if (!contact) {
    throw new Error('Invalid contact')
  }

  return Web3Utils.keccak256(contact.displayName || '')
}

export function isContact(contactOrNumber: any): contactOrNumber is MinimalContact {
  if (typeof contactOrNumber === 'object') {
    return 'recordID' in contactOrNumber
  }
  return false
}
