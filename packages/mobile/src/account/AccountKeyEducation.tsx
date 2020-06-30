import { BtnTypes } from '@celo/react-components/components/Button.v2'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import Education from 'src/account/Education'
import { CustomEventNames } from 'src/analytics/constants'
import { Namespaces } from 'src/i18n'
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
          image: null,
          cancelEvent: CustomEventNames.backup_educate_1_cancel,
          progressEvent: CustomEventNames.backup_educate_1_next,
          screenName: 'AccountKeyEducation',
        },
        {
          image: null,
          cancelEvent: CustomEventNames.backup_educate_2_cancel,
          progressEvent: CustomEventNames.backup_educate_2_next,
          screenName: 'AccountKeyEducation',
        },
        {
          image: null,
          cancelEvent: CustomEventNames.backup_educate_3_cancel,
          progressEvent: CustomEventNames.backup_educate_3_next,
          screenName: 'AccountKeyEducation',
        },
        {
          image: null,
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
