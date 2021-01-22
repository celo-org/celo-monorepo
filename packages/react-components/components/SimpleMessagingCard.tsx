import CallToActionsBar, { CallToAction } from '@celo/react-components/components/CallToActionsBar'
import MessagingCard from '@celo/react-components/components/MessagingCard'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'

export interface Props {
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
  const icon = iconProp ? (
    React.isValidElement(iconProp) ? (
      iconProp
    ) : (
      <Image
        // @ts-ignore isValidElement check above ensures image is an image source type
        source={iconProp}
        resizeMode="contain"
        style={
          Object.prototype.hasOwnProperty.call(iconProp, 'uri') ? styles.remoteIcon : undefined
        }
        testID={`${testID}/Icon`}
      />
    )
  ) : (
    undefined
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
        {!!icon && <View style={styles.iconContainer}>{icon}</View>}
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
  },
  darkModeText: {
    color: colors.light,
  },
  iconContainer: {
    marginLeft: 12,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remoteIcon: {
    width: '100%',
    height: '100%',
  },
})
