import { BtnTypes } from '@celo/react-components/components/Button.v2'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import Education from 'src/account/Education'
import { AnalyticsEvents } from 'src/analytics/Events'
import { Namespaces } from 'src/i18n'
import { accountKey1, accountKey2, accountKey3, accountKey4 } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type Props = StackScreenProps<StackParamList, Screens.AccountKeyEducation>

export default function AccountKeyEducation(props: Props) {
  function onComplete() {
    if (props.route.params?.nextScreen) {
      navigate(props.route.params?.nextScreen)
    } else {
      navigate(Screens.BackupPhrase)
    }
  }

  const { t } = useTranslation(Namespaces.backupKeyFlow6)

  const steps = useSteps()

  return (
    <Education
      isClosable={true}
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
          image: accountKey1,
          cancelEvent: AnalyticsEvents.backup_educate_1_cancel,
          progressEvent: AnalyticsEvents.backup_educate_1_next,
          screenName: 'AccountKeyEducation',
        },
        {
          image: accountKey2,
          cancelEvent: AnalyticsEvents.backup_educate_2_cancel,
          progressEvent: AnalyticsEvents.backup_educate_2_next,
          screenName: 'AccountKeyEducation',
        },
        {
          image: accountKey3,
          cancelEvent: AnalyticsEvents.backup_educate_3_cancel,
          progressEvent: AnalyticsEvents.backup_educate_3_next,
          screenName: 'AccountKeyEducation',
        },
        {
          image: accountKey4,
          cancelEvent: AnalyticsEvents.backup_educate_4_cancel,
          progressEvent: AnalyticsEvents.backup_educate_4_next,
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
