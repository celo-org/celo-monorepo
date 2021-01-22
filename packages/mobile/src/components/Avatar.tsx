import PhoneNumberWithFlag from '@celo/react-components/components/PhoneNumberWithFlag'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, TextStyle, View } from 'react-native'
import { useSelector } from 'react-redux'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import ContactCircle from 'src/components/ContactCircle'
import { formatShortenedAddress } from 'src/components/ShortenedAddress'
import { Namespaces, withTranslation } from 'src/i18n'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'

const DEFAULT_ICON_SIZE = 40

interface OwnProps {
  recipient?: Recipient
  e164Number?: string
  address?: string
  iconSize?: number
  displayNameStyle?: TextStyle
}

type Props = OwnProps & WithTranslation

// When redesigning, consider using getDisplayName from recipient.ts
function getDisplayName({ recipient, e164Number, address, t }: Props) {
  if (recipient && recipient.displayName) {
    return recipient.displayName
  }
  if (getE164Number(e164Number, recipient)) {
    return t('mobileNumber')
  }
  if (address) {
    return t('walletAddress')
  }
  // Rare but possible, such as when a user skips onboarding flow (in dev mode) and then views their own avatar
  return t('global:unknown')
}

export function getE164Number(e164Number?: string, recipient?: Recipient) {
  return e164Number || (recipient && recipient.e164PhoneNumber)
}

export function Avatar(props: Props) {
  const defaultCountryCode = useSelector(defaultCountryCodeSelector) ?? undefined
  const { address, recipient, e164Number, iconSize = DEFAULT_ICON_SIZE, displayNameStyle } = props

  const name = getDisplayName(props)
  const e164NumberToShow = getE164Number(e164Number, recipient)
  const thumbnailPath = getRecipientThumbnail(recipient)

  return (
    <View style={styles.container}>
      <ContactCircle thumbnailPath={thumbnailPath} name={name} address={address} size={iconSize} />
      <Text
        style={[displayNameStyle || fontStyles.small500, styles.contactName]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {name}
      </Text>
      {e164NumberToShow && (
        <PhoneNumberWithFlag
          e164PhoneNumber={e164NumberToShow}
          defaultCountryCode={defaultCountryCode}
        />
      )}
      {!e164NumberToShow && address && (
        <Text style={[fontStyles.small, styles.contactName]} numberOfLines={1} ellipsizeMode="tail">
          {formatShortenedAddress(address)}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactName: {
    paddingTop: 6,
    marginHorizontal: 20,
    textAlign: 'center',
  },
})

export default withTranslation<Props>(Namespaces.sendFlow7)(Avatar)
