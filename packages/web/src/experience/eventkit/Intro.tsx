import * as React from 'react'
import { Text, View } from 'react-native'
import { trackDownload, VOICE_DOC_TRACKING } from 'src/experience/brandkit/tracking'
import { brandStyles } from 'src/experience/common/constants'
import SectionTitle from 'src/experience/common/SectionTitle'
import Page, { ROOT } from 'src/experience/eventkit/Page'
import { H1, H4 } from 'src/fonts/Fonts'
import { NameSpaces, Trans, useTranslation } from 'src/i18n'
import InlineAnchor from 'src/shared/InlineAnchor'
import menuItems, { hashNav } from 'src/shared/menu-items'
import { fonts, standardStyles } from 'src/styles'

export default function Intro() {
  const { t } = useTranslation(NameSpaces.eventskit)
  return (
    <>
      <Page
        title="Home"
        path={ROOT}
        metaDescription={t('home.introduction')}
        sections={[
          { id: hashNav.eventsIntro.overview, children: <Overview /> },
          { id: hashNav.eventsIntro.brandVoice, children: <BrandVoice /> },
        ]}
      />
    </>
  )
}

function Overview() {
  const { t } = useTranslation(NameSpaces.eventskit)
  return (
    <View style={brandStyles.gap}>
      <H1 style={standardStyles.elementalMarginBottom}>{t('home.title')}</H1>
      <H4 style={standardStyles.blockMarginBottom}>{t('home.introduction')}</H4>

      <Text style={[fonts.h3, standardStyles.elementalMarginBottom]}>{t('home.useageTitle')}</Text>
      <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>{t('home.useageText')}</Text>

      <Text style={[fonts.h3, standardStyles.elementalMargin]}>{t('home.importantRemember')}</Text>
      <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>
        <Trans ns={NameSpaces.eventskit} i18nKey="home.importantRememberText">
          {/* TODO: Use correct link */}
          <InlineAnchor href={menuItems.CODE_OF_CONDUCT.link}>
            Community Code Of Conduct
          </InlineAnchor>
        </Trans>
      </Text>
    </View>
  )
}

function BrandVoice() {
  const { t } = useTranslation(NameSpaces.brand)

  const onPressVoice = React.useCallback(async () => {
    await trackDownload(VOICE_DOC_TRACKING)
  }, [])

  return (
    <View style={brandStyles.gap}>
      <SectionTitle>{t('home.brandVoice')}</SectionTitle>
      <Text style={fonts.p}>
        <Trans ns={NameSpaces.brand} i18nKey="home.brandVoiceText">
          <InlineAnchor
            target="_blank"
            onPress={onPressVoice}
            href={
              'https://docs.google.com/document/d/1Y1mfpBGad_8ZxSuIqwX52MWGEMfoWGt5HXc7sZp9h70/edit?usp=sharing'
            }
          >
            {}
          </InlineAnchor>
        </Trans>
      </Text>
    </View>
  )
}
