/**
 * Essentially the same as @celo/react-components/components/Avatar but with
 * a fallback to an unknown user icon.  Must be in mobile since the images are
 * in the mobile package.
 */

import { Avatar as PlainAvatar } from '@celo/react-components/components/Avatar'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Image, StyleSheet } from 'react-native'
import { Namespaces } from 'src/i18n'
import { unknownUserIcon } from 'src/images/Images'
import { getRecipientThumbnail, Recipient, RecipientKind } from 'src/recipients/recipient'

interface Props {
  recipient?: Recipient
  name?: string
  address?: string
  e164PhoneNumber?: string
  defaultCountryCode: string
  iconSize?: number
}

type AvatarProps = Props & WithNamespaces

export class Avatar extends React.PureComponent<AvatarProps> {
  render() {
    const { t, recipient, address, e164PhoneNumber, defaultCountryCode, iconSize = 40 } = this.props

    let { name } = this.props

    if (!recipient && !name) {
      if (!address) {
        name = t('mobileNumber')
      }

      if (!e164PhoneNumber) {
        name = t('walletAddress')
      }
    }

    if (recipient && recipient.kind === RecipientKind.Contact) {
      return (
        <PlainAvatar
          name={recipient.displayName}
          thumbnailPath={getRecipientThumbnail(recipient)}
          address={address}
          e164Number={recipient.e164PhoneNumber}
          defaultCountryCode={defaultCountryCode}
          iconSize={iconSize}
        />
      )
    }

    return (
      <PlainAvatar
        name={recipient ? recipient.displayName : name}
        address={address}
        e164Number={e164PhoneNumber}
        defaultCountryCode={defaultCountryCode}
        iconSize={iconSize}
      >
        <Image
          source={unknownUserIcon}
          style={[style.defaultIcon, { height: iconSize, width: iconSize }]}
        />
      </PlainAvatar>
    )
  }
}

const style = StyleSheet.create({
  defaultIcon: {
    alignSelf: 'center',
    margin: 'auto',
  },
})

export default withNamespaces(Namespaces.sendFlow7)(Avatar)
