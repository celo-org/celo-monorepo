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
import { setEducationCompleted } from 'src/stableToken/actions'

interface DispatchProps {
  setEducationCompleted: typeof setEducationCompleted
}

type Props = DispatchProps

export default function AccountKeyEducation({}: Props) {
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
      buttonText={t('understand')}
      lastStepButtonType={BtnTypes.PRIMARY}
    />
  )
}

// TODO event and screen names
function useSteps() {
  const { t } = useTranslation(Namespaces.backupKeyFlow6)
  return React.useMemo(
    () =>
      [
        {
          image: stabilityScale,
          cancelEvent: CustomEventNames.dollar_cancel1,
          screenName: 'Dollar_Nux_1',
        },
        {
          image: sendFee,
          cancelEvent: CustomEventNames.dollar_cancel2,
          screenName: 'Dollar_Nux_2',
        },
        {
          image: sendBetweenPhones,
          cancelEvent: CustomEventNames.dollar_cancel3,
          screenName: 'Dollar_Nux_3',
        },
        {
          image: sendBetweenPhones,
          cancelEvent: CustomEventNames.dollar_cancel3,
          screenName: 'Dollar_Nux_4',
        },
      ].map((step, index) => {
        return {
          ...step,
          title: t(`guide.${0}.title`),
          text: t(`guide.${0}.text`),
        }
      }),
    []
  )
}
