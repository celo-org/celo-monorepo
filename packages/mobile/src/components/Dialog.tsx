import Modal from 'src/components/Modal'
import * as React from 'react'
import { StyleSheet, Text, ScrollView, View } from 'react-native'
import TextButton from '@celo/react-components/components/TextButton.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import colorsV2 from '@celo/react-components/styles/colors.v2'

interface Action {
  text: string
  onPress: () => void
}

interface Props {
  image?: React.ReactNode
  title: string
  children: React.ReactNode
  action: Action
  secondaryAction?: Action
}

export default function Dialog({ title, children, action, secondaryAction, image }: Props) {
  return (
    <Modal isVisible={true} style={styles.root}>
      <ScrollView>
        {image && <View style={styles.imageContainer}>{image}</View>}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{children}</Text>
      </ScrollView>
      <View style={styles.actions}>
        {secondaryAction && (
          <TextButton style={styles.secondary} onPress={secondaryAction.onPress}>
            {secondaryAction.text}
          </TextButton>
        )}
        <TextButton style={styles.primary} onPress={action.onPress}>
          {action.text}
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
    paddingTop: 16,
    flexDirection: 'row',
  },
  secondary: {
    color: colorsV2.gray4,
    marginLeft: 24,
    marginRight: 40,
  },
  primary: {
    marginHorizontal: 16,
  },
  imageContainer: {
    marginBottom: 12,
  },
})
