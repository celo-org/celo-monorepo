import CallToActionsBar, { CallToAction } from '@celo/react-components/components/CallToActionsBar'
import MessagingCard from '@celo/react-components/components/MessagingCard'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'

interface Props {
  text: string
  icon?: ImageSourcePropType | React.ReactNode
  darkMode?: boolean
  callToActions: CallToAction[]
  testID?: string
}

export default function SimpleMessagingCard({
  text,
  icon: iconProp,
  darkMode = false,
  callToActions,
  testID,
}: Props) {
  const icon = React.isValidElement(iconProp) ? (
    iconProp
  ) : (
    // @ts-ignore isValidElement check above ensures image is an image source type
    <Image source={iconProp} resizeMode="contain" />
  )

  return (
    <MessagingCard style={darkMode ? styles.darkModeContainer : styles.container} testID={testID}>
      <View style={styles.innerContainer}>
        <View style={styles.content}>
          <Text
            style={[styles.text, darkMode ? styles.darkModeText : {}]}
            testID={`${testID}/Text`}
          >
            {text}
          </Text>
          <CallToActionsBar
            callToActions={callToActions}
            darkMode={darkMode}
            testID={`${testID}/CallToActions`}
          />
        </View>
        <View style={styles.iconContainer}>{icon}</View>
      </View>
    </MessagingCard>
  )
}

const styles = StyleSheet.create({
  container: {},
  darkModeContainer: {
    backgroundColor: '#2C3D47',
  },
  innerContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  text: {
    ...fontStyles.large,
    marginRight: 12,
  },
  darkModeText: {
    color: colors.light,
  },
  iconContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
