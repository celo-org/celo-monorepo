import SummaryNotification from '@celo/react-components/components/SummaryNotification'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import i18n from 'src/i18n'

import { StyleSheet, Text, View } from 'react-native'

interface OwnProps<T> {
  title: string
  icon: JSX.Element
  onReview: () => void
  itemRenderer: (item: T, key: number) => JSX.Element
  items: T[]
}

type Props<T> = OwnProps<T>

const PREVIEW_SIZE = 2

function getAdditionalItemsCount<T>(items: T[]) {
  const total = items.length
  if (total - PREVIEW_SIZE > 0) {
    return (
      <View>
        <Text style={styles.moreWithCountText}>
          {i18n.t('global:moreWithCount', { count: total - PREVIEW_SIZE + 1 })}
        </Text>
      </View>
    )
  }
}

// Payment Request notification for the notification center on home screen
function PaymentsSummaryNotification<T>(props: Props<T>) {
  const { items, title, icon, onReview, itemRenderer } = props

  return (
    <SummaryNotification
      title={title}
      icon={icon}
      reviewCTA={{
        text: i18n.t('walletFlow5:review'),
        onPress: onReview,
      }}
    >
      <View style={styles.body}>
        <View style={styles.items}>
          {items
            .slice(0, props.items.length > PREVIEW_SIZE ? PREVIEW_SIZE - 1 : PREVIEW_SIZE)
            .map(itemRenderer)}
          {getAdditionalItemsCount(items)}
        </View>
      </View>
    </SummaryNotification>
  )
}

const styles = StyleSheet.create({
  body: {
    marginTop: 5,
    flexDirection: 'row',
  },
  items: {
    flex: 1,
  },
  moreWithCountText: fontStyles.subSmall,
})

export default PaymentsSummaryNotification
