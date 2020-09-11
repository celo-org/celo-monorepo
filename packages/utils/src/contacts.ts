import { MinimalContact } from '@celo/base/lib/contacts'
import * as Web3Utils from 'web3-utils'

// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
export {
  ContactPhoneNumber,
  getContactPhoneNumber,
  isContact,
  MinimalContact,
} from '@celo/base/lib/contacts'

export const getContactNameHash = (contact: MinimalContact) => {
  if (!contact) {
    throw new Error('Invalid contact')
  }

  return Web3Utils.keccak256(contact.displayName || '')
}
