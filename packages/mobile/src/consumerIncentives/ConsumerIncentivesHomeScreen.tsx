import Button, { BtnSizes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import React, { Fragment } from 'react'
import { useAsync } from 'react-async-hook'
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CELO_REWARDS_LINK } from 'src/brandingConfig'
import { ContentType, fetchConsumerRewardsContent } from 'src/consumerIncentives/contentFetcher'
import i18n from 'src/i18n'
import { headerWithCloseButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useTypedSelector from 'src/redux/useSelector'

const useConsumerIncentivesContent = () => {
  const contentResult = useAsync<ContentType>(fetchConsumerRewardsContent, [])
  let texts
  if (contentResult.result) {
    const content: ContentType = contentResult.result
    const language = i18n.language.toLowerCase()
    texts = content[language] || content[language.slice(0, 2)]
    for (const key of Object.keys(texts)) {
      // This is needed for some reason for newlines to show properly.
      texts[key] = texts[key].replace(/\\n/g, '\n')
    }
  }
  return {
    content: texts,
    loading: contentResult.loading,
  }
}

const range = (n: number) => (n === 0 ? [] : [...Array(n).keys()].map((i) => i + 1))

type Props = StackScreenProps<StackParamList, Screens.ConsumerIncentivesHomeScreen>
export default function ConsumerIncentivesHomeScreen(props: Props) {
  const userIsVerified = useTypedSelector((state) => state.app.numberVerified)
  const { content, loading } = useConsumerIncentivesContent()

  // Content key names are formatted like subtitleN and bodyN 1-indexed.
  // This is to allow an arbitrary number of sections.
  const sectionCount = content
    ? Object.keys(content).reduce(
        (max, item) => Math.max(max, parseInt(item.slice(-1), 10) || 0),
        0
      )
    : 0

  const onPressCTA = () => {
    if (userIsVerified) {
      navigate(Screens.FiatExchangeOptions, { isAddFunds: true })
    } else {
      navigate(Screens.VerificationEducationScreen, { hideOnboardingStep: true })
    }
  }

  const onLearnMore = () => navigate(Screens.WebViewScreen, { uri: CELO_REWARDS_LINK })

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <SafeAreaView edges={['bottom']}>
        {loading && (
          <ActivityIndicator size="large" color={colors.greenBrand} style={styles.loading} />
        )}
        {content && (
          <>
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.body}>{content.description}</Text>
            {range(sectionCount).map((section) => (
              <Fragment key={`section${section}`}>
                <Text style={styles.subtitle}>{content[`subtitle${section}`]}</Text>
                <Text style={styles.body}>{content[`body${section}`]}</Text>
              </Fragment>
            ))}
            <Button
              style={styles.button}
              size={BtnSizes.FULL}
              text={
                userIsVerified
                  ? i18n.t('fiatExchangeFlow:addCusd')
                  : i18n.t('accountScreen10:confirmNumber')
              }
              onPress={onPressCTA}
              testID="ConsumerIncentives/CTA"
            />
            <TouchableOpacity onPress={onLearnMore} testID="ConsumerIncentives/learnMore">
              <Text style={styles.learnMore}>{i18n.t('global:learnMore')}</Text>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    </ScrollView>
  )
}

ConsumerIncentivesHomeScreen.navOptions = {
  ...headerWithCloseButton,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: variables.contentPadding,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  loading: {
    height: '100%',
  },
  title: {
    ...fontStyles.h2,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    ...fontStyles.regular500,
    marginTop: 16,
  },
  body: {
    ...fontStyles.small,
    marginTop: 8,
  },
  button: {
    marginTop: 20,
  },
  learnMore: {
    alignSelf: 'center',
    ...fontStyles.small500,
    marginTop: 24,
    color: colors.greenUI,
  },
})
