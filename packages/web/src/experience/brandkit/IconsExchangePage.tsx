import frontMatter from 'front-matter'
import { NextPage } from 'next'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Page, { ICONS_PATH } from 'src/experience/brandkit/common/Page'
import data from 'src/experience/brandkit/content/exchange-icons.md'
import {
  AssetTypes,
  EXCHANGE_ICONS_PKG_TRACKING,
  trackDownload,
} from 'src/experience/brandkit/tracking'
import CCLicense from 'src/experience/common/CCLicense'
import { brandStyles, GAP } from 'src/experience/common/constants'
import IconShowcase from 'src/experience/common/Showcase'
import Markdown, { Attributes } from 'src/experience/Markdown'
import { NameSpaces, useTranslation } from 'src/i18n'
import Button, { BTN } from 'src/shared/Button.3'
import { hashNav } from 'src/shared/menu-items'
import { standardStyles } from 'src/styles'

const icons = [
  {
    name: 'cUSD Exchange Icon',
    description: 'Full Color\n',
    preview: '/images/marketplace-icons/icon-celo-dollar-color-f.svg',
    uri: '/assets/marketplace-icons/icon-celo-dollar-full-color.zip',
  },
  {
    name: 'CELO Exchange Icon',
    description: 'Full Color\n',
    preview: '/images/marketplace-icons/icon-celo-CELO-color-f.svg',
    uri: '/assets/marketplace-icons/icon-CELO-color.zip',
  },
  null,
  {
    name: 'cUSD Exchange Icon',
    description: 'Monochrome\n',
    preview: '/images/marketplace-icons/icon-celo-dollar-mono-f.svg',
    uri: '/assets/marketplace-icons/icon-celo-dollar-monochrome.zip',
    variant: 'circle-white',
  },
  {
    name: 'CELO Exchange Icon',
    description: 'Monochrome\n',
    preview: '/images/marketplace-icons/icon-celo-CELO-mono-f.svg',
    uri: '/assets/marketplace-icons/icon-CELO-monochrome.zip',
    variant: 'circle-white',
  },
  {
    name: 'cUSD Exchange Icon',
    description: 'Reverse Monochrome\n',
    preview: '/images/marketplace-icons/icon-celo-dollar-reverse-f.svg',
    uri: '/assets/marketplace-icons/icon-celo-dollar-reverse-monochrome.zip',
    variant: 'circle-black',
  },
  {
    name: 'CELO Exchange Icon',
    description: 'Reverse Monochrome\n',
    preview: '/images/marketplace-icons/icon-celo-CELO-reverse-f.svg',
    uri: '/assets/marketplace-icons/icon-CELO-reverse-monochrome.zip',
    variant: 'circle-black',
  },
]

const info = frontMatter<Attributes>(data)

const IconExchangePage: NextPage = React.memo(() => {
  return (
    <Page
      title={info.attributes.title}
      metaDescription={info.attributes.description}
      path={ICONS_PATH}
      sections={[{ id: hashNav.brandIcons.overview, children: <Overview /> }]}
    />
  )
})

export default IconExchangePage

export interface IconData {
  description: string
  name: string
  preview: string
  uri: string
  tags: string[]
  id: string
}

function Overview() {
  const { t } = useTranslation(NameSpaces.brand)

  const onPressDownload = React.useCallback(async () => {
    await trackDownload(EXCHANGE_ICONS_PKG_TRACKING)
  }, [])

  return (
    <View style={styles.container}>
      <View style={brandStyles.gap}>
        <Markdown source={info.body} />
        <Button
          kind={BTN.PRIMARY}
          text={t('logo.overviewBtn')}
          style={standardStyles.elementalMarginTop}
          onPress={onPressDownload}
          href="/assets/marketplace-icons/CeloMarketplaceIcons.zip"
        />
      </View>
      <CCLicense textI18nKey="exchangeIcons.license" />

      <View style={styles.root}>
        <View style={brandStyles.tiling}>
          {icons.map((icon, i) =>
            icon === null ? (
              <View key={i} style={styles.break} />
            ) : (
              <View key={i}>
                <IconShowcase
                  key={i}
                  ratio={1}
                  variant={(icon.variant || 'circle') as any}
                  description={icon.description}
                  name={icon.name}
                  preview={icon.preview}
                  uri={icon.uri}
                  loading={false}
                  assetType={AssetTypes.icon}
                  size={160}
                />
              </View>
            )
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: GAP },
  root: { minHeight: '75vh' },
  break: {
    width: '100%',
    display: 'block',
  },
})
