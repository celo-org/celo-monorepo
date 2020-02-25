import * as React from 'react'
import LazyLoadFadin from 'react-lazyload-fadein'
import { Image, ImageURISource, StyleSheet, Text, View } from 'react-native'
import { Contributor } from 'src/about/Contributor'
import { I18nProps, withNamespaces } from 'src/i18n'
import External from 'src/icons/External'
import BookLayout from 'src/layout/BookLayout'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import AspectRatio from 'src/shared/AspectRatio'
import Responsive from 'src/shared/Responsive'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
interface Props {
  contributors: Contributor[]
}

export class Team extends React.Component<Props & I18nProps & ScreenProps> {
  render() {
    const { t, screen, contributors } = this.props
    const isTablet = screen === ScreenSizes.TABLET
    const isMobile = screen === ScreenSizes.MOBILE

    return (
      <View nativeID="contributors">
        <BookLayout label={t('teamTitle')} startBlock={true}>
          <Text style={[fonts.p, standardStyles.sectionMarginBottomMobile]}>{t('teamCopy')} </Text>
        </BookLayout>
        <GridRow>
          <Cell span={Spans.full} tabletSpan={Spans.full} style={standardStyles.centered}>
            <View
              style={[
                styles.photoList,
                isMobile ? styles.photoListAuxMobile : isTablet && styles.photoListAuxTablet,
              ]}
            >
              {contributors.map((person: Contributor) => (
                <React.Fragment key={person.name}>
                  <Portrait
                    name={person.name}
                    url={person.url}
                    team={person.team}
                    company={person.company}
                    purpose={person.purpose}
                    source={{ uri: person.photo }}
                  />
                </React.Fragment>
              ))}
            </View>
          </Cell>
        </GridRow>
      </View>
    )
  }
}

interface PortraitProps {
  source: ImageURISource
  name: string
  purpose: string
  team?: string
  company: string
  url?: string
}

const Portrait = React.memo(function _Portrait({
  source,
  name,
  team,
  company,
  purpose,
  url,
}: PortraitProps) {
  return (
    <>
      <Responsive medium={styles.mediumPerson} large={styles.largePerson}>
        <View style={styles.person}>
          <LazyLoadFadin placeholder={<ContributorPlaceHolder />}>
            {(onLoad) => (
              <AspectRatio ratio={1}>
                <Image
                  accessibilityLabel={`Photo of ${name}`}
                  source={source}
                  onLoad={onLoad}
                  style={styles.photo}
                />
              </AspectRatio>
            )}
          </LazyLoadFadin>

          <View style={standardStyles.row}>
            <Text style={[fonts.p, textStyles.heavy, styles.name]}>{name}</Text>
            {url && (
              <View style={styles.outLink}>
                <a href={externalize(url)} target="_blank">
                  <External size={12} color={colors.dark} />
                </a>
              </View>
            )}
          </View>

          <Text style={fonts.legal}>
            {company.trim()}
            {team && `, ${team.trim()}`}
          </Text>
          <Text style={[fonts.p, textStyles.italic, styles.purposeText]}>{purpose}</Text>
        </View>
      </Responsive>
    </>
  )
})

function ContributorPlaceHolder() {
  return (
    <AspectRatio ratio={1}>
      <Image
        accessibilityLabel={`Placeholder`}
        source={{
          uri:
            'https://dl.airtable.com/.attachmentThumbnails/1a9a0eb9124b3d5ef15091b9a50ddbd1/dda3632d',
        }}
        style={styles.photo}
      />
    </AspectRatio>
  )
}

function externalize(url: string) {
  try {
    const uri = new URL(url)
    return uri.href
  } catch {
    return `//${url}`
  }
}

// @ts-ignore
const styles = StyleSheet.create({
  name: {
    marginTop: 8,
    marginRight: 5,
  },
  outLink: {
    paddingBottom: 1,
    justifyContent: 'flex-end',
  },
  purposeText: { fontSize: 26, lineHeight: 28, marginTop: 8 },
  photoListAuxMobile: {
    display: 'flex',
    justifyContent: 'center',
    minHeight: '80vh',
  },
  photoListAuxTablet: {
    display: 'grid',
    gridTemplateColumns: `repeat(2, 1fr)`,
  },
  photo: {
    height: '100%',
    width: '100%',
  },
  photoList: {
    display: 'grid',
    gridRowGap: 55,
    gridColumnGap: 40,
    gridTemplateColumns: `repeat(3, 1fr)`,
    minHeight: '50vh',
  },
  person: {
    flexDirection: 'column',
    margin: 5,
    marginBottom: 50,
    width: '90vw',
    minWidth: 250,
    maxWidth: 300,
  },
  mediumPerson: {
    flexDirection: 'column',
    minWidth: 250,
    maxWidth: 300,
  },
  largePerson: {
    flexDirection: 'column',
  },
})

export default withScreenSize(withNamespaces('about')(Team))
