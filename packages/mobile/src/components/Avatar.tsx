/**
 * Essentially the same as @celo/react-components/components/Avatar but
 * retrieves the defaultCountryCode from redux and a fallback to an unknown user
 * icon.  Must be in mobile since redux & images are in the mobile package.
 */

import { Avatar as BaseAvatar } from '@celo/react-components/components/Avatar'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Image, StyleSheet } from 'react-native'
import { useSelector } from 'react-redux'
import { defaultCountryCodeSelector } from 'src/account/reducer'
import { Namespaces } from 'src/i18n'
import { unknownUserIcon } from 'src/images/Images'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'

const DEFAULT_ICON_SIZE = 40

interface OwnProps {
  recipient?: Recipient
  e164Number?: string
  name?: string
  address?: string
  iconSize?: number
}

type Props = OwnProps & WithNamespaces

function getDisplayName({ name, recipient, e164Number, address, t }: Props) {
  if (name) {
    return name
  }
  if (recipient && recipient.displayName) {
    return recipient.displayName
  }
  if (e164Number) {
    return t('mobileNumber')
  }
  if (address) {
    return t('walletAddress')
  }
  // Rare but possible, such as when a user skips onboarding flow (in dev mode) and then views their own avatar
  return t('unknown')
}

export function Avatar(props: Props) {
  const defaultCountryCode = useSelector(defaultCountryCodeSelector)
  const { recipient, e164Number, iconSize = DEFAULT_ICON_SIZE } = props

  return (
    <BaseAvatar
      {...props}
      defaultCountryCode={defaultCountryCode}
      name={getDisplayName(props)}
      e164Number={e164Number}
      iconSize={iconSize}
      thumbnailPath={getRecipientThumbnail(recipient)}
    >
      <Image
        source={unknownUserIcon}
        style={[style.defaultIcon, { height: iconSize, width: iconSize }]}
      />
    </BaseAvatar>
  )
}

const style = StyleSheet.create({
  defaultIcon: {
    alignSelf: 'center',
    margin: 'auto',
  },
})

export default withNamespaces(Namespaces.sendFlow7)(Avatar)
