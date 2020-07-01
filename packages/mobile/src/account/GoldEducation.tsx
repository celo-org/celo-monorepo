import { BtnTypes } from '@celo/react-components/components/Button.v2'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import Education from 'src/account/Education'
import { AnalyticsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { setEducationCompleted } from 'src/goldToken/actions'
import { Namespaces } from 'src/i18n'
import { exchangeIcon, goldValue, shinyGold } from 'src/images/Images'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'

export default function GoldEducation() {
  const { t } = useTranslation(Namespaces.global)

  const dispatch = useDispatch()

  const isCeloEducationComplete = useSelector((state) => state.goldToken.educationCompleted)

  const onFinish = () => {
    ValoraAnalytics.track(AnalyticsEvents.exchange_gold_nux)

    if (isCeloEducationComplete) {
      navigateBack()
    } else {
      navigate(Screens.ExchangeHomeScreen)
      dispatch(setEducationCompleted())
    }
  }

  const stepInfo = useStep()

  return (
    <Education
      isClosable={isCeloEducationComplete}
      stepInfo={stepInfo}
      onFinish={onFinish}
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
        cancelEvent: AnalyticsEvents.gold_cancel1,
        progressEvent: AnalyticsEvents.gold_educate_1_next,
        screenName: 'Gold_Nux_1',
      },
      {
        image: goldValue,
        cancelEvent: AnalyticsEvents.gold_cancel2,
        progressEvent: AnalyticsEvents.gold_educate_2_next,
        screenName: 'Gold_Nux_2',
      },
      {
        image: exchangeIcon,
        cancelEvent: AnalyticsEvents.gold_cancel3,
        progressEvent: AnalyticsEvents.gold_educate_3_next,
        screenName: 'Gold_Nux_3',
      },
      {
        image: exchangeIcon, // Placeholder Image
        cancelEvent: AnalyticsEvents.gold_cancel4,
        progressEvent: AnalyticsEvents.gold_educate_4_next,
        screenName: 'Gold_Nux_4',
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
