import * as React from 'react'
import { ViewStyle } from 'react-native'
import { useSelector } from 'react-redux'
import { nameSelector, pictureSelector, userContactDetailsSelector } from 'src/account/selectors'
import ContactCircle from 'src/components/ContactCircle'
import { currentAccountSelector } from 'src/web3/selectors'
interface Props {
  style?: ViewStyle
  size?: number
}

// A contact circle for the wallet user themselves
export default function ContactCircleSelf({ style, size }: Props) {
  const displayName = useSelector(nameSelector)
  const pictureUri = useSelector(pictureSelector)
  const address = useSelector(currentAccountSelector)
  const contactDetails = useSelector(userContactDetailsSelector)

  return (
    <ContactCircle
      style={style}
      address={address || undefined}
      thumbnailPath={pictureUri || contactDetails.thumbnailPath}
      name={displayName}
      size={size}
    />
  )
}
