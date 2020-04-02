import * as React from 'react'
import LazyLoadFadin from 'react-lazyload-fadein'
import { Image, ImageURISource, StyleSheet, Text, View } from 'react-native'
import { Contributor } from 'src/about/Contributor'
import { I18nProps, withNamespaces } from 'src/i18n'
import BookLayout from 'src/layout/BookLayout'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import AspectRatio from 'src/shared/AspectRatio'
import Outbound from 'src/shared/Outbound'
import Responsive from 'src/shared/Responsive'
import { fonts, standardStyles, textStyles } from 'src/styles'
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
                    preview={{ uri: person.preview }}
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
  preview: ImageURISource
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
  preview,
  purpose,
  url,
}: PortraitProps) {
  return (
    <>
      <Responsive medium={styles.mediumPerson} large={styles.largePerson}>
        <View style={styles.person}>
          <ContributorPlaceHolder uri={preview.uri} />
          <View style={styles.realImageContainer}>
            <LazyLoadFadin>
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
          </View>

          <View style={standardStyles.row}>
            <Text style={[fonts.p, textStyles.heavy, styles.name]}>{name}</Text>
            {url && (
              <View style={styles.outLink}>
                <Outbound url={url} />
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

function ContributorPlaceHolder({ uri }) {
  return (
    <AspectRatio ratio={1}>
      <Image source={{ uri }} style={styles.imagePreview} />
    </AspectRatio>
  )
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
  realImageContainer: { position: 'absolute', height: '100%', width: '100%' },
  imagePreview: {
    opacity: 0.5,
    filter: `blur(20px)`,
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
