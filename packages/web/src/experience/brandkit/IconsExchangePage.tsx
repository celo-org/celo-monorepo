import { NextPage } from 'next'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Page, { ICONS_PATH } from 'src/experience/brandkit/common/Page'
import {
  AssetTypes,
  EXCHANGE_ICONS_PKG_TRACKING,
  trackDownload,
} from 'src/experience/brandkit/tracking'
import CCLicense from 'src/experience/common/CCLicense'
import { brandStyles, GAP } from 'src/experience/common/constants'
import PageHeadline from 'src/experience/common/PageHeadline'
import IconShowcase from 'src/experience/common/Showcase'
import { NameSpaces, useTranslation } from 'src/i18n'
import Button, { BTN } from 'src/shared/Button.3'
import { hashNav } from 'src/shared/menu-items'

const icons = [
  {
    name: 'cUSD Exchange Icon',
    description: 'Full Color\n',
    preview: '/images/marketplace-icons/icon-celo-dollar-color-f.svg',
    uri: '/assets/marketplace-icons/icon-celo-dollar-color.zip',
  },
  {
    name: 'cGLD Exchange Icon',
    description: 'Full Color\n',
    preview: '/images/marketplace-icons/icon-celo-gold-color-f.svg',
    uri: '/assets/marketplace-icons/icon-celo-gold-color.zip',
  },
  null,
  {
    name: 'cUSD Exchange Icon',
    description: 'Monochrome\n',
    preview: '/images/marketplace-icons/icon-celo-dollar-black-f.svg',
    uri: '/assets/marketplace-icons/icon-celo-dollar-black.zip',
    variant: 'circle-white',
  },
  {
    name: 'cGLD Exchange Icon',
    description: 'Monochrome\n',
    preview: '/images/marketplace-icons/icon-celo-gold-black-f.svg',
    uri: '/assets/marketplace-icons/icon-celo-gold-black.zip',
    variant: 'circle-white',
  },
  {
    name: 'cUSD Exchange Icon',
    description: 'Reverse Monochrome\n',
    preview: '/images/marketplace-icons/icon-celo-dollar-white-f.svg',
    uri: '/assets/marketplace-icons/icon-celo-dollar-white.zip',
    variant: 'circle-black',
  },
  {
    name: 'cGLD Exchange Icon',
    description: 'Reverse Monochrome\n',
    preview: '/images/marketplace-icons/icon-celo-gold-white-f.svg',
    uri: '/assets/marketplace-icons/icon-celo-gold-white.zip',
    variant: 'circle-black',
  },
]

const IconExchangePage: NextPage = React.memo(() => {
  const { t } = useTranslation(NameSpaces.brand)
  return (
    <Page
      title={t('exchangeIcons.title')}
      metaDescription={t('exchangeIcons.headline')}
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
      <PageHeadline title={t('exchangeIcons.title')} headline={t('exchangeIcons.headline')} />

      <Button
        kind={BTN.PRIMARY}
        text={t('logo.overviewBtn')}
        style={styles.download}
        onPress={onPressDownload}
        href="/assets/CeloMarketplaceIcons.zip"
      />

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
  download: {
    marginLeft: 10,
  },
})
