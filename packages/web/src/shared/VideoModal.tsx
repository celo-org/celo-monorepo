import * as React from 'react'
import ReactModal from 'react-modal'
import { Dimensions, Image, StyleSheet, Text, TouchableHighlight, View } from 'react-native'
import YouTube from 'react-youtube'
import AspectRatio from 'src/shared/AspectRatio'
import EX from 'src/shared/EX'
import PlayCircle from 'src/shared/PlayCircle'
import { getSentry } from 'src/utils/sentry'

interface Props {
  videoID: string
  previewImage?: string
  children?: (onPlay: () => void) => React.ReactNode
  ariaDescription: string
}

interface State {
  playing: boolean
  isClient: boolean
  width: number
  height: number
}

const HEIGHT = 360

export default class VideoModal extends React.Component<Props, State> {
  state = { playing: false, isClient: false, width: 0, height: 0 }

  componentDidMount() {
    ReactModal.setAppElement('#__next')
    this.setState({ isClient: true })
    this.changeSize({ window: Dimensions.get('window') })
    Dimensions.addEventListener('change', this.changeSize)
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this.changeSize)
    this.setState({ isClient: false })
  }

  changeSize = ({ window }) => {
    this.setState({ height: window.height * 0.8, width: window.width })
  }

  play = () => {
    this.setState({ playing: true })
  }

  close = () => {
    this.setState({ playing: false })
  }

  onEnd = () => {
    this.close()
  }

  playerHeight = () => {
    return this.state.height > this.state.width ? this.state.width * 0.75 : this.state.height
  }

  render() {
    const opts = {
      height: this.playerHeight(),
      width: this.state.width,
      playerVars: {
        // https://developers.google.com/youtube/player_parameters
        autoplay: 1,
        controls: 1,
        playsinline: 1,
        modestbranding: 1,
      },
    }

    return (
      <>
        <style>
          {`
            .ReactModal__Body--open {
              position: fixed;
            }

            .ReactModal__Content iframe {
              position: absolute;
              bottom: 60px;
              left: 0;
              width: calc(100% - 5px);
              height: calc(90% - 60px);
            }

            .ReactModal__Overlay {
              transition: transform 1000ms ease-in-out;
            }
            
            .ReactModal__Overlay--after-open{
              transform: translateY(0);
            }

            .ReactModal__Overlay--before-close {
              transform: translateY(-100vh);
            }
          `}
        </style>
        {this.props.previewImage ? (
          <TouchableHighlight onPress={this.play}>
            <View style={styles.container}>
              <AspectRatio ratio={300 / 958} style={{ height: HEIGHT }}>
                <Image
                  source={{ uri: this.props.previewImage }}
                  resizeMode="cover"
                  style={styles.image}
                />
              </AspectRatio>
              <View style={styles.playButton}>
                <PlayCircle />
              </View>
            </View>
          </TouchableHighlight>
        ) : (
          this.props.children(this.play)
        )}
        {this.state.isClient && (
          <ReactModal
            isOpen={this.state.playing}
            onRequestClose={this.close}
            style={{ overlay: htmlStyles.cinema, content: htmlStyles.modalContent }}
            aria={{
              labelledby: 'Video',
              describedby: this.props.ariaDescription,
            }}
          >
            <Text onPress={this.close} style={styles.closeButton}>
              <EX size={30} />
            </Text>
            <YouTube
              videoId={this.props.videoID}
              opts={opts}
              onReady={onReady}
              onEnd={this.onEnd}
            />
          </ReactModal>
        )}
      </>
    )
  }
}

async function onReady({ target }) {
  const Sentry = await getSentry()
  try {
    Sentry.addBreadcrumb({
      message: 'Playing About Page Video',
    })
    target.playVideo()
  } catch (e) {
    Sentry.captureException(e)
  }
}

const styles = StyleSheet.create({
  container: { height: HEIGHT },
  image: { width: '100%', height: '100%' },
  playButton: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    right: 30,
    height: 30,
    width: 30,
  },
})

const htmlStyles = {
  cinema: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'black',
    zIndex: 9999999,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    cursor: 'pointer',
  },
  modalContent: {
    backgroundColor: 'black',
    display: 'flex',
    flex: 1,
    border: 0,
    position: 'absolute',
    overflow: 'hidden',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 0,
  },
}
