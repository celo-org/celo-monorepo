import * as base from '@celo/base/lib/contacts'
import * as Web3Utils from 'web3-utils'

// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
export import ContactPhoneNumber = base.ContactPhoneNumber
export import MinimalContact = base.MinimalContact
export import getContactPhoneNumber = base.getContactPhoneNumber
export import isContact = base.isContact

export const getContactNameHash = (contact: MinimalContact) => {
  if (!contact) {
    throw new Error('Invalid contact')
  }

  return Web3Utils.keccak256(contact.displayName || '')
}
