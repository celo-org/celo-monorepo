import BaseListItem from '@celo/react-components/components/BaseListItem'
import Link from '@celo/react-components/components/Link'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'

interface Props {
  icon?: React.ReactNode
  title: string
  children: React.ReactNode
  callout?: React.ReactNode
  ctas: CTA[]
  roundedBorders?: boolean
}

export interface CTA {
  onPress: () => unknown
  text: string
}

// For use in Notification Center and Payment Request Screen
export default function BaseNotification(props: Props) {
  return (
    <BaseListItem {...props}>
      <View style={styles.body}>
        {props.children}
        <View style={styles.ctas}>
          {props.ctas.map((cta, j) => {
            return (
              <Link key={j} style={styles.action} onPress={cta.onPress}>
                {cta.text}
              </Link>
            )
          })}
        </View>
      </View>
    </BaseListItem>
  )
}

const styles = StyleSheet.create({
  ctas: {
    flexDirection: 'row',
    marginTop: 15,
  },
  action: {
    paddingEnd: 15,
  },
  body: {
    minHeight: 70,
    justifyContent: 'space-between',
  },
})
