import CallToActionsBar, { CallToAction } from '@celo/react-components/components/CallToActionsBar'
import MessagingCard from '@celo/react-components/components/MessagingCard'
import colors from '@celo/react-components/styles/colors'
import fonts from '@celo/react-components/styles/fonts.v2'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  title: string
  amount: string | React.ReactNode
  details?: string
  icon: React.ReactNode
  callToActions: CallToAction[]
  testID?: string
}

export default function RequestMessagingCard({
  title,
  amount,
  details,
  icon,
  callToActions,
  testID,
}: Props) {
  return (
    <MessagingCard style={styles.container} testID={testID}>
      <View style={styles.innerContainer}>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2} testID={`${testID}/Title`}>
            {title}
          </Text>
          <Text style={styles.amount} numberOfLines={1} testID={`${testID}/Amount`}>
            {amount}
          </Text>
          <Text style={styles.details} testID={`${testID}/Details`}>
            {details}
          </Text>
        </View>
        <View style={styles.iconContainer}>{icon}</View>
      </View>
      <CallToActionsBar callToActions={callToActions} testID={`${testID}/CallToActions`} />
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
    marginRight: 16,
  },
  title: {
    ...fonts.small,
    fontSize: 13,
    lineHeight: 16,
    color: colors.gray4,
    marginBottom: 4,
  },
  amount: {
    // TODO: font should be bold
    ...fonts.large600,
    fontSize: 24,
    lineHeight: 28,
    marginBottom: 2,
  },
  details: {
    ...fonts.small,
  },
  iconContainer: {},
})
