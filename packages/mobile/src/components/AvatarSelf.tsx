import * as React from 'react'
import { e164NumberSelector, nameSelector, userContactDetailsSelector } from 'src/account/selectors'
import Avatar from 'src/components/Avatar'
import { Recipient, RecipientKind } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { currentAccountSelector } from 'src/web3/selectors'

// An avatar for the wallet user themselves
export function AvatarSelf() {
  const displayName = useSelector(nameSelector)
  const e164PhoneNumber = useSelector(e164NumberSelector)
  const contactDetails = useSelector(userContactDetailsSelector)
  const account = useSelector(currentAccountSelector)

  // Recipient refering to the wallet user, used for the avatar
  let recipient: Recipient | undefined
  if (displayName && e164PhoneNumber) {
    recipient = {
      kind: RecipientKind.Contact,
      contactId: contactDetails.contactId || 'none',
      thumbnailPath: contactDetails.thumbnailPath || undefined,
      displayName,
      e164PhoneNumber,
    }
  } else if (account) {
    recipient = {
      kind: RecipientKind.Address,
      address: account,
      displayName: account,
    }
  }

  return <Avatar recipient={recipient} />
}
