import { BtnTypes } from '@celo/react-components/components/Button.v2'
import { navigate } from '@react-navigation/compat/lib/typescript/src/NavigationActions'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Education from 'src/account/Education'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { setEducationCompleted } from 'src/goldToken/actions'
import { Namespaces } from 'src/i18n'
import { exchangeIcon, goldValue, shinyGold } from 'src/images/Images'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

export default function GoldEducation() {
  const { t } = useTranslation(Namespaces.global)

  const dispatch = useDispatch()

  const isCeloEducationComplete = useSelector<RootState, boolean>(
    (state) => state.goldToken.educationCompleted
  )

  const goToExchange = React.useCallback(() => {
    CeloAnalytics.track(CustomEventNames.exchange_gold_nux)

    // TODO should Education.Guides just be full screen modals? it would solve the issue that by design they should pop up and the issue of navigation.
    if (isCeloEducationComplete) {
      navigateBack()
    } else {
      navigate(Screens.ExchangeTradeScreen)
    }

    dispatch(setEducationCompleted())
  }, [])

  const stepInfo = useStep()

  return (
    <Education
      isClosable={isCeloEducationComplete}
      stepInfo={stepInfo}
      onFinish={goToExchange}
      finalButtonType={BtnTypes.TERTIARY}
      finalButtonText={t('global:done')}
      buttonText={t('global:next')}
    />
  )
}

function useStep() {
  const { t } = useTranslation(Namespaces.goldEducation)

  return React.useMemo(() => {
    return [
      {
        image: shinyGold,
        cancelEvent: CustomEventNames.gold_cancel1,
        progressEvent: CustomEventNames.gold_educate_1_next,
        screenName: 'Gold_Nux_1',
      },
      {
        image: goldValue,
        cancelEvent: CustomEventNames.gold_cancel2,
        progressEvent: CustomEventNames.gold_educate_2_next,
        screenName: 'Gold_Nux_2',
      },
      {
        image: exchangeIcon,
        cancelEvent: CustomEventNames.gold_cancel3,
        progressEvent: CustomEventNames.gold_educate_3_next,
        screenName: 'Gold_Nux_3',
      },
    ].map((step, index) => {
      return {
        ...step,
        title: t(`steps.${index}.title`),
        text: t(`steps.${index}.text`),
      }
    })
  }, [])
}
