import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const { contentPadding } = variables

interface Props {
  icon?: React.ReactNode
  title: string
  children: React.ReactNode
  callout?: React.ReactNode
  roundedBorders?: boolean
}

// just used by notifications for now, useful for out pattern of [icon | title / body | optionalCol]
export default function BaseListItem({ icon, title, children, callout, roundedBorders }: Props) {
  return (
    <View style={[styles.container, roundedBorders && componentStyles.roundedBorder]}>
      {icon && <View style={styles.iconArea}>{icon}</View>}
      <View style={styles.contentArea}>
        <Text style={fontStyles.bodySmallBold}>{title}</Text>
        <View>{children}</View>
      </View>
      {callout && <View style={styles.callout}>{callout}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: contentPadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  iconArea: {
    paddingRight: contentPadding,
    flexDirection: 'column',
    alignItems: 'center',
  },
  contentArea: {
    justifyContent: 'space-between',
    flex: 1,
  },
  callout: {
    paddingLeft: contentPadding,
  },
})
