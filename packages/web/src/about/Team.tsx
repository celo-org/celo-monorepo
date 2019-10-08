import * as React from 'react'
import LazyLoad from 'react-lazyload'
import { Image, StyleSheet, Text, View } from 'react-native'
import shuffleSeed from 'shuffle-seed'
import teamList from 'src/about/team/team-list'
import { H1, H4 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import BookLayout from 'src/layout/BookLayout'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import AspectRatio from 'src/shared/AspectRatio'
import Responsive from 'src/shared/Responsive'
import { fonts, standardStyles } from 'src/styles'

interface Props {
  randomSeed: number
}

export class Team extends React.Component<Props & I18nProps & ScreenProps> {
  render() {
    const { t, randomSeed, screen } = this.props
    const shuffledTeamList = shuffleSeed.shuffle(teamList, randomSeed)

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
                screen === ScreenSizes.MOBILE && { justifyContent: 'center' },
              ]}
            >
              {shuffledTeamList.map((person) => (
                <Responsive
                  key={person.name}
                  medium={styles.mediumPerson}
                  large={styles.largePerson}
                >
                  <View style={styles.person}>
                    <LazyLoad height={200}>
                      <AspectRatio style={styles.photoContainer} ratio={275 / 400}>
                        <Image source={{ uri: person.photo }} style={styles.photo} />
                      </AspectRatio>
                    </LazyLoad>
                    <H4>{person.name}</H4>
                    <Text style={fonts.p}>{t(person.role) as string}</Text>
                  </View>
                </Responsive>
              ))}
              <Responsive medium={styles.mediumFiller} large={styles.largeFiller}>
                <View style={styles.filler} />
              </Responsive>
              <Responsive medium={styles.mediumFiller} large={styles.largeFiller}>
                <View style={styles.filler} />
              </Responsive>
            </View>
          </Cell>
        </GridRow>
      </>
    )
  }
}

// @ts-ignore
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  photoContainer: { marginBottom: 20 },
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
    width: 176,
    minHeight: 400,
  },
  mediumPerson: {
    flexDirection: 'column',
    marginVertical: 20,
    width: 210,
    minHeight: 420,
  },
  largePerson: {
    flexDirection: 'column',
    marginVertical: 30,
    width: 275,
  },
  filler: {
    width: 176 + 10,
    height: 0,
  },
  mediumFiller: {
    width: 210 + 40,
    height: 0,
  },
  largeFiller: {
    width: 275 + 60,
    height: 0,
  },
})

export default withScreenSize(withNamespaces('about')(Team))
