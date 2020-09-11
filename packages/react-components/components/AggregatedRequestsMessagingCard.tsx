import CallToActionsBar, { CallToAction } from '@celo/react-components/components/CallToActionsBar'
import MessagingCard from '@celo/react-components/components/MessagingCard'
import colors from '@celo/react-components/styles/colors'
import fonts from '@celo/react-components/styles/fonts.v2'
import React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'

interface Props {
  title: string
  details: string | React.ReactNode
  icon: ImageSourcePropType | React.ReactNode
  callToActions: CallToAction[]
  testID?: string
}

export default function AggregatedRequestsMessagingCard({
  title,
  details,
  icon: iconProp,
  callToActions,
  testID,
}: Props) {
  const icon = React.isValidElement(iconProp) ? (
    iconProp
  ) : (
    // @ts-ignore isValidElement check above ensures image is an image source type
    <Image source={iconProp} style={styles.image} resizeMode="contain" />
  )

  return (
    <MessagingCard style={styles.container} testID={testID}>
      <View style={styles.innerContainer}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.content}>
          <Text style={styles.title} testID={`${testID}/Title`}>
            {title}
          </Text>
          <Text style={styles.details} numberOfLines={3} testID={`${testID}/Details`}>
            {details}
          </Text>
          <CallToActionsBar callToActions={callToActions} testID={`${testID}/CallToActions`} />
        </View>
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
    marginLeft: 16,
  },
  title: {
    ...fonts.notificationHeadline,
    marginBottom: 4,
  },
  details: {
    flex: 1,
    ...fonts.small,
    color: colors.gray5,
  },
  iconContainer: {
    width: 40,
  },
  image: {
    width: 30,
    height: 30,
  },
})
