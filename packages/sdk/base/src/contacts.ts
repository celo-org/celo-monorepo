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

export function isContact(contactOrNumber: any): contactOrNumber is MinimalContact {
  if (typeof contactOrNumber === 'object') {
    return 'recordID' in contactOrNumber
  }
  return false
}
