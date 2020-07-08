import { BtnTypes } from '@celo/react-components/components/Button.v2'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Education, { EducationTopic, EmbeddedNavBar } from 'src/account/Education'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Namespaces } from 'src/i18n'
import { accountKey1, accountKey2, accountKey3, accountKey4 } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type Props = StackScreenProps<StackParamList, Screens.AccountKeyEducation>

export default function AccountKeyEducation(props: Props) {
  function onComplete() {
    ValoraAnalytics.track(OnboardingEvents.backup_education_complete)
    if (props.route.params?.nextScreen) {
      navigate(props.route.params?.nextScreen)
    } else {
      navigate(Screens.BackupPhrase)
    }
  }

  const { t } = useTranslation(Namespaces.backupKeyFlow6)

  const steps = useSteps()

  useEffect(() => {
    ValoraAnalytics.track(OnboardingEvents.backup_education_start)
  }, [])

  return (
    <Education
      embeddedNavBar={EmbeddedNavBar.Close}
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
        { image: accountKey1, topic: EducationTopic.backup },
        { image: accountKey2, topic: EducationTopic.backup },
        { image: accountKey3, topic: EducationTopic.backup },
        { image: accountKey4, topic: EducationTopic.backup },
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
