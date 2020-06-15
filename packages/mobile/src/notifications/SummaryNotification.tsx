import AggregatedRequestsMessagingCard from '@celo/react-components/components/AggregatedRequestsMessagingCard'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Namespaces } from 'src/i18n'

interface Props<T> {
  title: string
  detailsI18nKey: string
  icon: React.ReactNode
  onReview: () => void
  itemRenderer: (item: T, key: number) => React.ReactNode
  items: T[]
}

// If changing this, you probably also need to update the translation files
// which use it via detailsI18nKey
const PREVIEW_SIZE = 2

function getContext(count: number) {
  if (count === 2) {
    return 'exactly2Items'
  }
  if (count === 3) {
    return 'exactly3Items'
  }

  return 'moreThan3Items'
}

// Summary notification for the notification center on home screen
export default function SummaryNotification<T>(props: Props<T>) {
  const { t } = useTranslation(Namespaces.walletFlow5)
  const { items, title, detailsI18nKey, icon, onReview, itemRenderer } = props

  return (
    <AggregatedRequestsMessagingCard
      title={title}
      details={
        <Trans
          i18nKey={detailsI18nKey}
          tOptions={{ context: getContext(items.length) }}
          components={items.slice(0, PREVIEW_SIZE).map(itemRenderer)}
        />
      }
      icon={icon}
      callToActions={[
        {
          text: t('viewAll'),
          onPress: onReview,
        },
      ]}
    />
  )
}
