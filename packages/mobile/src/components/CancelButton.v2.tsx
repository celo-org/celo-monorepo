import * as React from 'react'
import { useTranslation } from 'react-i18next'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { Namespaces } from 'src/i18n'
import { navigateBack } from 'src/navigator/NavigationService'
import TopBarButton from 'src/navigator/TopBarButton.v2'

interface Props {
  eventName?: CustomEventNames
  onCancel?: () => void
}

export default function CancelButton({ eventName, onCancel }: Props) {
  const onPressCancel = React.useCallback(() => {
    if (eventName) {
      CeloAnalytics.track(eventName)
    }

    if (onCancel) {
      onCancel()
    } else {
      navigateBack()
    }
  }, [eventName, onCancel])

  const { t } = useTranslation(Namespaces.global)

  return (
    <TopBarButton testID="CancelButton" onPress={onPressCancel}>
      {t('cancel')}
    </TopBarButton>
  )
}
