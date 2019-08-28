/**
 * Essentially the same as @celo/react-components/components/Avatar but with
 * a fallback to an unknown user icon.  Must be in mobile since the images are
 * in the mobile package.
 */

import { Avatar as PlainAvatar } from '@celo/react-components/components/Avatar'
import * as React from 'react'
import { Image, StyleSheet } from 'react-native'
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

export default class Avatar extends React.PureComponent<Props> {
  render() {
    const {
      recipient,
      name,
      address,
      e164PhoneNumber,
      defaultCountryCode,
      iconSize = 40,
    } = this.props

    return recipient && recipient.kind === RecipientKind.Contact ? (
      <PlainAvatar
        name={recipient.displayName}
        thumbnailPath={getRecipientThumbnail(recipient)}
        address={address}
        e164Number={recipient.e164PhoneNumber}
        defaultCountryCode={defaultCountryCode}
        iconSize={iconSize}
      />
    ) : (
      <PlainAvatar
        name={name}
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
