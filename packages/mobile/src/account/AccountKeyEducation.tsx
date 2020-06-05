import { BtnTypes } from '@celo/react-components/components/Button.v2'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import Education from 'src/account/Education'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { Namespaces } from 'src/i18n'
import { sendBetweenPhones, sendFee, stabilityScale } from 'src/images/Images'
import { navigateProtected } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

export default function AccountKeyEducation() {
  const onComplete = React.useCallback(() => {
    CeloAnalytics.track(CustomEventNames.backup_error) // TODO the right event
    navigateProtected(Screens.BackupPhrase)
  }, [])
  const { t } = useTranslation(Namespaces.backupKeyFlow6)

  const steps = useSteps()

  return (
    <Education
      stepInfo={steps}
      onFinish={onComplete}
      finalButtonText={t('completeEducation')}
      buttonText={t('global:next')}
      finalButtonType={BtnTypes.PRIMARY}
    />
  )
}

function useSteps() {
  const { t } = useTranslation(Namespaces.backupKeyFlow6)
  return React.useMemo(
    () =>
      [
        {
          image: stabilityScale,
          cancelEvent: CustomEventNames.backup_educate_1_cancel,
          progressEvent: CustomEventNames.backup_educate_1_next,
          screenName: 'AccountKeyEducation',
        },
        {
          image: sendFee,
          cancelEvent: CustomEventNames.backup_educate_2_cancel,
          progressEvent: CustomEventNames.backup_educate_2_next,
          screenName: 'AccountKeyEducation',
        },
        {
          image: sendBetweenPhones,
          cancelEvent: CustomEventNames.backup_educate_3_cancel,
          progressEvent: CustomEventNames.backup_educate_3_next,
          screenName: 'AccountKeyEducation',
        },
        {
          image: sendBetweenPhones,
          cancelEvent: CustomEventNames.backup_educate_4_cancel,
          progressEvent: CustomEventNames.backup_educate_4_next,
          screenName: 'AccountKeyEducation',
        },
      ].map((step, index) => {
        return {
          ...step,
          title: t(`guide.${index}.title`),
          text: t(`guide.${index}.text`),
        }
      }),
    []
  )
}
