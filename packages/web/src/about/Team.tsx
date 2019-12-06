import * as React from 'react'
import LazyLoadFadin from 'react-lazyload-fadein'
import { Image, ImageURISource, StyleSheet, Text, View } from 'react-native'
import shuffleSeed from 'shuffle-seed'
import teamList, { Person } from 'src/about/team/team-list'
import { H1, H4 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import BookLayout from 'src/layout/BookLayout'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import AspectRatio from 'src/shared/AspectRatio'
import Responsive from 'src/shared/Responsive'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

interface Props {
  randomSeed: number
}

export class Team extends React.Component<Props & I18nProps & ScreenProps> {
  render() {
    const { t, randomSeed, screen } = this.props
    const shuffledTeamList = shuffleSeed.shuffle(teamList, randomSeed)
    const isTablet = screen === ScreenSizes.TABLET
    const isMobile = screen === ScreenSizes.MOBILE
    return (
      <>
        <BookLayout label={t('teamTitle')} startBlock={true}>
          <H1>{t('teamAlternateTitle')}</H1>
          <Text style={[fonts.p, standardStyles.elementalMargin]}>{t('teamCopy')} </Text>
        </BookLayout>
        <GridRow>
          <Cell span={Spans.full} tabletSpan={Spans.full}>
            <View
              style={[
                styles.photoList,
                isMobile ? styles.photoListAuxMobile : isTablet && styles.photoListAuxTablet,
              ]}
            >
              {shuffledTeamList.map((person: Person) => (
                <React.Fragment key={person.name}>
                  <LazyLoadFadin>
                    {(onLoad: () => void) => (
                      <Portrait
                        name={person.name}
                        team={person.role}
                        purpose="Methodically Manages Mischief"
                        source={{ uri: person.photo }}
                        onLoad={onLoad}
                      />
                    )}
                  </LazyLoadFadin>
                </React.Fragment>
              ))}
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
  team: string
  onLoad?: () => void
}

const Portrait = React.memo(function _Portrait({
  source,
  onLoad,
  name,
  team,
  purpose,
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
          <Text style={[fonts.p, textStyles.heavy, standardStyles.elementalMarginTop]}>{name}</Text>
          <Text style={[fonts.p]}>{team}</Text>
        </View>
      </Responsive>
    </>
  )
})

const PHOTO_BACKGROUND = '#E5E2DD'

// @ts-ignore
const styles = StyleSheet.create({
  purposeText: { fontSize: 24, lineHeight: 28 },
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  photoListAuxMobile: { justifyContent: 'center' },
  photoListAuxTablet: { justifyContent: 'space-around' },
  imageBackground: { backgroundColor: PHOTO_BACKGROUND, marginBottom: 20 },
  photo: {
    height: '100%',
    width: '100%',
  },
  photoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  person: {
    flexDirection: 'column',
    margin: 5,
    marginBottom: 30,
    flex: 1,
    maxWidth: '100%',
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
