import * as React from 'react'
import { TextStyle } from 'react-native'
import { e164NumberSelector, nameSelector, userContactDetailsSelector } from 'src/account/selectors'
import Avatar from 'src/components/Avatar'
import { Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { currentAccountSelector } from 'src/web3/selectors'

interface Props {
  iconSize?: number
  displayNameStyle?: TextStyle
}

// An avatar for the wallet user themselves
export function AvatarSelf({ iconSize, displayNameStyle }: Props) {
  const displayName = useSelector(nameSelector)
  const e164PhoneNumber = useSelector(e164NumberSelector) ?? undefined
  const contactDetails = useSelector(userContactDetailsSelector)
  const account = useSelector(currentAccountSelector)

  // Recipient refering to the wallet user, used for the avatar
  let recipient: Recipient
  if (displayName && e164PhoneNumber) {
    recipient = {
      contactId: contactDetails.contactId || 'none',
      thumbnailPath: contactDetails.thumbnailPath || undefined,
      name: displayName,
      e164PhoneNumber,
      address: account!,
    }
  } else {
    recipient = {
      address: account!,
    }
  }

  return <Avatar recipient={recipient} iconSize={iconSize} displayNameStyle={displayNameStyle} />
}
