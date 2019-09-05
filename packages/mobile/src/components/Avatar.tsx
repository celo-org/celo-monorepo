/**
 * Essentially the same as @celo/react-components/components/Avatar but
 * retrieves the defaultCountryCode from redux and a fallback to an unknown user
 * icon.  Must be in mobile since redux & images are in the mobile package.
 */

import { Avatar as BaseAvatar } from '@celo/react-components/components/Avatar'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Image, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { Namespaces } from 'src/i18n'
import { unknownUserIcon } from 'src/images/Images'
import { getRecipientThumbnail, Recipient, RecipientKind } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'

const DEFAULT_ICON_SIZE = 40

interface Props {
  recipient?: Recipient
  e164Number?: string
  name?: string
  address?: string
  defaultCountryCode: string
  iconSize?: number
}

interface StateProps {
  defaultCountryCode: string
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    defaultCountryCode: state.account.defaultCountryCode,
  }
}

type AvatarProps = Props & StateProps & WithNamespaces

export class Avatar extends React.PureComponent<AvatarProps> {
  render() {
    const { t, recipient, address, e164Number, iconSize = DEFAULT_ICON_SIZE } = this.props

    let { name } = this.props

    if (!recipient && !name) {
      // TransferFeedItem does not specify what kind of recipient was used, so
      // here we assume if the address is missing, then it is a mobile # and
      // if the phone number is missing, then it is an address.  Since
      // blockchain-api responds only addresses and the recipient is fetched
      // during navigation, then it (should) be only address & contact recipients
      if (!address) {
        name = t('mobileNumber')
      }

      if (!e164Number) {
        name = t('walletAddress')
      }
    }

    if (recipient && recipient.kind === RecipientKind.Contact) {
      return (
        <BaseAvatar
          {...this.props}
          name={recipient.displayName}
          thumbnailPath={getRecipientThumbnail(recipient)}
          e164Number={recipient.e164PhoneNumber}
          iconSize={iconSize}
        />
      )
    }

    return (
      <BaseAvatar
        {...this.props}
        name={recipient ? recipient.displayName : name}
        iconSize={iconSize}
      >
        <Image
          source={unknownUserIcon}
          style={[style.defaultIcon, { height: iconSize, width: iconSize }]}
        />
      </BaseAvatar>
    )
  }
}

const style = StyleSheet.create({
  defaultIcon: {
    alignSelf: 'center',
    margin: 'auto',
  },
})

// TODO(Rossy + Jean) simplify this file with useSelector
export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(
  withNamespaces(Namespaces.sendFlow7)(Avatar)
)
