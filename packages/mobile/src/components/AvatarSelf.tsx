import * as React from 'react'
import { useSelector } from 'react-redux'
import { e164NumberSelector, nameSelector, userContactDetailsSelector } from 'src/account/selectors'
import Avatar from 'src/components/Avatar'
import { RecipientKind, RecipientWithContact } from 'src/recipients/recipient'

// An avatar for the wallet user themselves
export function AvatarSelf() {
  const displayName = useSelector(nameSelector)
  const e164PhoneNumber = useSelector(e164NumberSelector)
  const contactDetails = useSelector(userContactDetailsSelector)

  // Recipient refering to the wallet user, used for the avatar
  const recipient: RecipientWithContact = {
    kind: RecipientKind.Contact,
    contactId: contactDetails.contactId || 'none',
    thumbnailPath: contactDetails.thumbnailPath || undefined,
    displayName,
    e164PhoneNumber,
  }

  return <Avatar recipient={recipient} />
}
