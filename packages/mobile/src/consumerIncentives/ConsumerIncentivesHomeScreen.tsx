import Button, { BtnSizes } from '@celo/react-components/components/Button'
import Touchable from '@celo/react-components/components/Touchable'
import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import React, { Fragment } from 'react'
import { useAsync } from 'react-async-hook'
import { Trans, useTranslation } from 'react-i18next'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { CELO_REWARDS_LINK } from 'src/brandingConfig'
import {
  ConsumerIncentivesData,
  fetchConsumerRewardsContent,
} from 'src/consumerIncentives/contentFetcher'
import { Namespaces } from 'src/i18n'
import { consumerIncentives, leaves } from 'src/images/Images'
import { noHeader } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useTypedSelector from 'src/redux/useSelector'
import { getContentForCurrentLang } from 'src/utils/contentTranslations'
import Logger from 'src/utils/Logger'

const TAG = 'ConsumerIncentivesHomeScreen'

const useConsumerIncentivesContent = () => {
  const contentResult = useAsync<ConsumerIncentivesData>(fetchConsumerRewardsContent, [])
  let texts
  if (contentResult.result) {
    texts = getContentForCurrentLang(contentResult.result.content)
  }
  return {
    content: texts,
    tiers: contentResult.result?.tiers,
    loading: contentResult.loading,
    error: contentResult.error,
  }
}

type Props = StackScreenProps<StackParamList, Screens.ConsumerIncentivesHomeScreen>
export default function ConsumerIncentivesHomeScreen(props: Props) {
  const { t } = useTranslation(Namespaces.consumerIncentives)
  const userIsVerified = useTypedSelector((state) => state.app.numberVerified)
  const { content, tiers, loading, error } = useConsumerIncentivesContent()
  const insets = useSafeAreaInsets()
  const dispatch = useDispatch()

  if (!loading && error) {
    Logger.error(TAG, 'Error while loading remote texts from Firebase', error)
    dispatch(showError(ErrorMessages.FIREBASE_FETCH_FAILED))
    navigateBack()
    return null
  }

  const onPressCTA = () => {
    if (userIsVerified) {
      navigate(Screens.FiatExchangeOptions, { isCashIn: true })
    } else {
      navigate(Screens.VerificationEducationScreen, { hideOnboardingStep: true })
    }
  }

  const onLearnMore = () => navigate(Screens.WebViewScreen, { uri: CELO_REWARDS_LINK })

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <Image source={leaves} style={styles.backgroundImage} resizeMode={'stretch'} />
      <SafeAreaView edges={['bottom']} style={styles.contentContainer}>
        <Touchable
          style={[styles.closeButton, { marginTop: insets.top + 20 }]}
          onPress={navigateBack}
          borderless={true}
          hitSlop={variables.iconHitslop}
        >
          <Times />
        </Touchable>
        {loading && (
          <ActivityIndicator
            size="large"
            color={colors.greenBrand}
            style={styles.loading}
            testID="ConsumerIncentives/Loading"
          />
        )}
        {content && (
          <>
            <Image source={consumerIncentives} />
            <Text style={styles.title}>{t('title')}</Text>
            <Text style={[styles.body, styles.description]}>{t('description')}</Text>
            {tiers &&
              tiers.map((tier, index) => (
                <Fragment key={`tier${tier.celoReward}`}>
                  {index > 0 && (
                    <LinearGradient
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      colors={[colors.light, colors.dark, colors.light]}
                      style={styles.separator}
                    />
                  )}
                  <Text style={[styles.body, styles.tier]}>
                    <Trans
                      i18nKey={'getCeloRewards'}
                      ns={Namespaces.consumerIncentives}
                      tOptions={{ reward: tier.celoReward, minBalance: tier.minBalanceCusd }}
                    >
                      <Text style={styles.bold} />
                      <Text style={styles.bold} />
                    </Trans>
                  </Text>
                </Fragment>
              ))}
            {content.extraSubtitle && <Text style={styles.subtitle}>{content.extraSubtitle}</Text>}
            {content.extraBody && <Text style={styles.body}>{content.extraBody}</Text>}
            {!userIsVerified && (
              <>
                <Text style={styles.subtitle}>{content.unverifiedSubtitle}</Text>
                <Text style={styles.body}>{content.unverifiedBody}</Text>
              </>
            )}
            <View style={styles.buttonContainer}>
              <Button
                size={BtnSizes.FULL}
                text={userIsVerified ? t('addCusd') : t('accountScreen10:confirmNumber')}
                onPress={onPressCTA}
                testID="ConsumerIncentives/CTA"
              />
            </View>
            <TouchableOpacity onPress={onLearnMore} testID="ConsumerIncentives/learnMore">
              <Text style={styles.learnMore}>{t('global:learnMore')}</Text>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    </ScrollView>
  )
}

ConsumerIncentivesHomeScreen.navOptions = noHeader

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 24,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    top: 0,
    left: 0,
    right: 0,
  },
  closeButton: {
    alignSelf: 'flex-start',
  },
  loading: {
    height: '100%',
  },
  title: {
    ...fontStyles.h2,
    marginTop: 16,
    textAlign: 'center',
  },
  description: {
    marginBottom: 36,
    marginTop: 10,
  },
  subtitle: {
    ...fontStyles.h2,
    fontSize: 20,
    marginTop: 40,
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    ...fontStyles.regular,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    width: '100%',
    opacity: 0.3,
    marginVertical: 18,
  },
  tier: {
    marginBottom: 4,
    paddingHorizontal: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  perMonth: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  buttonContainer: {
    marginTop: 36,
    width: '100%',
  },
  learnMore: {
    ...fontStyles.notificationHeadline,
    fontSize: 17,
    alignSelf: 'center',
    marginVertical: 24,
    color: colors.greenUI,
  },
})
