import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { MinimalContact } from 'react-native-contacts'
import { useSelector } from 'react-redux'
import DefaultAvatar from 'src/icons/DefaultAvatar'
import { addressToDisplayNameSelector } from 'src/identity/reducer'

interface Props {
  style?: ViewStyle
  contact?: MinimalContact
  name: string | null // Requiring a value so we need to be explicit if we dont have it
  address?: string
  size?: number
  thumbnailPath?: string | null
}

const DEFAULT_ICON_SIZE = 40

const getAddressBackgroundColor = (address: string) =>
  `hsl(${parseInt(address.substring(0, 5), 16) % 360}, 53%, 93%)`
const getAddressForegroundColor = (address: string) =>
  `hsl(${parseInt(address.substring(0, 5), 16) % 360}, 67%, 24%)`
const getContactInitial = (contact: MinimalContact) => getNameInitial(contact.displayName)
const getNameInitial = (name: string) => name.charAt(0).toLocaleUpperCase()

function ContactCircle({ contact, size, thumbnailPath, name, address, style }: Props) {
  const addressToDisplayName = useSelector(addressToDisplayNameSelector)
  const addressInfo = address ? addressToDisplayName[address] : undefined
  const displayName = name || addressInfo?.name
  const iconSize = size || DEFAULT_ICON_SIZE
  const iconBackgroundColor = getAddressBackgroundColor(address || '0x0')

  const getInitials = () =>
    (contact && getContactInitial(contact)) || (displayName && getNameInitial(displayName)) || '#'

  const renderThumbnail = () => {
    const resolvedThumbnail =
      thumbnailPath || (contact && contact.thumbnailPath) || addressInfo?.imageUrl

    if (resolvedThumbnail) {
      return (
        <Image
          source={{ uri: resolvedThumbnail }}
          style={[
            styles.image,
            { height: iconSize, width: iconSize, borderRadius: iconSize / 2.0 },
          ]}
          resizeMode={'cover'}
        />
      )
    }

    const fontColor = getAddressForegroundColor(address || '0x0')
    // Mobile # is what default display name when contact isn't saved
    if (displayName && displayName !== 'Mobile #') {
      const initials = getInitials()
      return (
        <Text style={[fontStyles.iconText, { fontSize: iconSize / 2.0, color: fontColor }]}>
          {initials.toLocaleUpperCase()}
        </Text>
      )
    }

    return <DefaultAvatar foregroundColor={fontColor} backgroundColor={iconBackgroundColor} />
  }

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.icon,
          {
            backgroundColor: iconBackgroundColor,
            height: iconSize,
            width: iconSize,
            borderRadius: iconSize / 2,
          },
        ]}
      >
        {renderThumbnail()}
      </View>
    </View>
  )
}

export default ContactCircle

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    margin: 'auto',
    alignSelf: 'center',
  },
})
