import * as React from 'react'
import { Text, View } from 'react-native'
import { brandStyles } from 'src/experienceKits/common/constants'
import Page, { ROOT } from 'src/experienceKits/eventkit/Page'
import { H1, Li, Ul } from 'src/fonts/Fonts'
import { NameSpaces, Trans, useTranslation } from 'src/i18n'
import { hashNav } from 'src/shared/menu-items'
import { fonts, standardStyles } from 'src/styles'

export default function Flavor() {
  const { t } = useTranslation(NameSpaces.eventskit)
  return (
    <>
      <Page
        title="Home"
        path={ROOT}
        metaDescription={t('flavor.introduction')}
        sections={[{ id: hashNav.eventsIntro.overview, children: <Overview /> }]}
      />
    </>
  )
}

function Overview() {
  const { t } = useTranslation(NameSpaces.eventskit)
  return (
    <View style={brandStyles.gap}>
      <H1 style={standardStyles.elementalMarginBottom}>{t('flavor.title')}</H1>

      <Text style={fonts.p}>{t('flavor.introduction')}</Text>
      <Text style={fonts.p}>
        {t('flavor.introductionP2')}
        <Ul>
          <Trans ns={NameSpaces.brand} i18nKey={'flavor.introductionBullets'}>
            <Li>{}</Li>
            <Ul>
              <Li>{}</Li>
              <Li>{}</Li>
            </Ul>
            <Li>{}</Li>
            <Li>{}</Li>
            <Li>{}</Li>
          </Trans>
        </Ul>
      </Text>
    </View>
  )
}
