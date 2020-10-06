import ContactCircle from '@celo/react-components/components/ContactCircle'
import * as React from 'react'
import { ViewStyle } from 'react-native'
import { useSelector } from 'react-redux'
import { nameSelector, userContactDetailsSelector } from 'src/account/selectors'

interface Props {
  style?: ViewStyle
  size: number
}

// A contact circle for the wallet user themselves
export default function ContactCircleSelf({ style, size }: Props) {
  const displayName = useSelector(nameSelector)
  const contactDetails = useSelector(userContactDetailsSelector)

  return (
    <ContactCircle
      style={style}
      thumbnailPath={contactDetails.thumbnailPath}
      name={displayName}
      size={size}
    />
  )
}
