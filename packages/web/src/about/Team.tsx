import * as React from 'react'
import LazyLoadFadin from 'react-lazyload-fadein'
import { Image, ImageURISource, StyleSheet, Text, View } from 'react-native'
import shuffleSeed from 'shuffle-seed'
import { Contributor } from 'src/about/Contributor'
import Fetch from 'src/brandkit/common/Fetch'
import { H1 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import External from 'src/icons/External'
import BookLayout from 'src/layout/BookLayout'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import AspectRatio from 'src/shared/AspectRatio'
import Responsive from 'src/shared/Responsive'
import Spinner from 'src/shared/Spinner'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
interface Props {
  randomSeed: number
}

export class Team extends React.Component<Props & I18nProps & ScreenProps> {
  render() {
    const { t, randomSeed, screen } = this.props
    const isTablet = screen === ScreenSizes.TABLET
    const isMobile = screen === ScreenSizes.MOBILE
    return (
      <>
        <BookLayout label={t('teamTitle')} startBlock={true}>
          <H1>{t('teamAlternateTitle')}</H1>
          <Text
            style={[
              fonts.p,
              standardStyles.elementalMarginTop,
              standardStyles.sectionMarginBottomMobile,
            ]}
          >
            {t('teamCopy')}{' '}
          </Text>
        </BookLayout>
        <GridRow>
          <Cell span={Spans.full} tabletSpan={Spans.full}>
            <View
              style={[
                styles.photoList,
                isMobile ? styles.photoListAuxMobile : isTablet && styles.photoListAuxTablet,
              ]}
            >
              <Fetch query="/api/contributors">
                {({ data, loading, error }) => {
                  if (loading) {
                    return <Spinner size="medium" color={colors.dark} />
                  }
                  if (error) {
                    return null
                  }
                  const shuffledTeamList = shuffleSeed.shuffle(data, randomSeed)
                  return shuffledTeamList.map((person: Contributor) => (
                    <React.Fragment key={person.name}>
                      <LazyLoadFadin>
                        {(onLoad: () => void) => (
                          <Portrait
                            name={person.name}
                            url={person.url}
                            team={person.team}
                            company={person.company}
                            purpose={person.purpose}
                            source={{ uri: person.photo }}
                            onLoad={onLoad}
                          />
                        )}
                      </LazyLoadFadin>
                    </React.Fragment>
                  ))
                }}
              </Fetch>
            </View>
          </Cell>
        </GridRow>
      </>
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
  onLoad?: () => void
}

const Portrait = React.memo(function _Portrait({
  source,
  onLoad,
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
          <AspectRatio ratio={1}>
            <Image source={source} onLoad={onLoad} style={styles.photo} />
          </AspectRatio>
          <Text
            style={[
              fonts.p,
              textStyles.italic,
              styles.purposeText,
              standardStyles.elementalMarginTop,
            ]}
          >
            {purpose}
          </Text>
          <View style={[standardStyles.row, standardStyles.elementalMarginTop]}>
            <Text style={[fonts.p, textStyles.heavy, styles.name]}>{name}</Text>
            {url && (
              <a href={url}>
                <External size={12} color={colors.dark} />
              </a>
            )}
          </View>

          <Text style={fonts.p}>
            {company} – {team}
          </Text>
        </View>
      </Responsive>
    </>
  )
})

// @ts-ignore
const styles = StyleSheet.create({
  purposeText: { fontSize: 26, lineHeight: 28, minHeight: 60 },
  photoListAuxMobile: {
    justifyContent: 'flex-start',
    minHeight: '80vh',
  },
  photoListAuxTablet: { justifyContent: 'space-around' },
  photo: {
    height: '100%',
    width: '100%',
  },
  name: {
    marginRight: 5,
  },
  photoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: '50vh',
  },
  person: {
    flexDirection: 'column',
    margin: 5,
    marginBottom: 30,
    width: '80vw',
    minWidth: 200,
    maxWidth: 300,
  },
  mediumPerson: {
    flexDirection: 'column',
    marginBottom: 30,
    width: 245,
    paddingHorizontal: 10,
  },
  largePerson: {
    flexDirection: 'column',
    marginBottom: 30,
    width: 275,
  },
})

export default withScreenSize(withNamespaces('about')(Team))
