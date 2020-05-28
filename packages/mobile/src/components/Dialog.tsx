import TextButton from '@celo/react-components/components/TextButton.v2'
import colorsV2 from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import { Image, ImageSourcePropType, ScrollView, StyleSheet, Text, View } from 'react-native'
import Modal from 'src/components/Modal'

interface Props {
  image?: ImageSourcePropType
  title: string
  children: React.ReactNode
  actionText: string
  actionPress: () => void
  secondaryActionText?: string
  secondaryActionPress?: () => void
  isVisible: boolean
}

export default function Dialog({
  title,
  children,
  actionPress,
  actionText,
  secondaryActionText,
  secondaryActionPress,
  image,
  isVisible,
}: Props) {
  return (
    <Modal isVisible={isVisible}>
      <ScrollView contentContainerStyle={styles.root}>
        {image && <Image style={styles.imageContainer} source={image} resizeMode="contain" />}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{children}</Text>
      </ScrollView>
      <View style={styles.actions}>
        {secondaryActionText && (
          <TextButton style={styles.secondary} onPress={secondaryActionPress}>
            {secondaryActionText}
          </TextButton>
        )}
        <TextButton style={styles.primary} onPress={actionPress}>
          {actionText}
        </TextButton>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    ...fontStyles.h2,
  },
  body: {
    textAlign: 'center',
    ...fontStyles.regular,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    maxWidth: '100%',
    flexWrap: 'wrap',
  },
  secondary: {
    color: colorsV2.gray4,
    paddingTop: 16,
  },
  primary: {
    paddingTop: 16,
  },
  imageContainer: {
    marginBottom: 12,
    width: 100,
    height: 100,
  },
})
