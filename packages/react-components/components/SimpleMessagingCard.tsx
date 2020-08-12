import CallToActionsBar, { CallToAction } from '@celo/react-components/components/CallToActionsBar'
import MessagingCard from '@celo/react-components/components/MessagingCard'
import fonts from '@celo/react-components/styles/fonts.v2'
import React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'

interface Props {
  text: string
  icon?: ImageSourcePropType | React.ReactNode
  callToActions: CallToAction[]
  testID?: string
}

export default function SimpleMessagingCard({
  text,
  icon: iconProp,
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
    <MessagingCard style={styles.container} testID={testID}>
      <View style={styles.innerContainer}>
        <View style={styles.content}>
          <Text style={styles.text} testID={`${testID}/Text`}>
            {text}
          </Text>
          <CallToActionsBar callToActions={callToActions} testID={`${testID}/CallToActions`} />
        </View>
        <View style={styles.iconContainer}>{icon}</View>
      </View>
    </MessagingCard>
  )
}

const styles = StyleSheet.create({
  container: {},
  innerContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  text: {
    ...fonts.large,
    marginRight: 12,
  },
  iconContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
