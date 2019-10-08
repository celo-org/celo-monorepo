import * as React from 'react'
import ReactModal from 'react-modal'
import { Dimensions, Image, StyleSheet, Text, TouchableHighlight, View } from 'react-native'
import YouTube from 'react-youtube'
import AspectRatio from 'src/shared/AspectRatio'
import EX from 'src/shared/EX'
import PlayCircle from 'src/shared/PlayCircle'
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

  render() {
    const opts = {
      height: this.state.height,
      width: this.state.width,
      playerVars: {
        // https://developers.google.com/youtube/player_parameters
        autoplay: 1,
        // controls: 0,
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
              width: 100%;
              height: calc(90% - 100px)
            }

            .ReactModal__Overlay {
              transform: translateY(-100vh);
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
            <YouTube videoId={this.props.videoID} opts={opts} onEnd={this.onEnd} />
          </ReactModal>
        )}
      </>
    )
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
    top: 40,
    right: 40,
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
    backgroundColor: 'transparent',
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    border: 0,
    width: '100%',
    position: 'static',
    top: 'inherit',
    bottom: 'inherit',
    padding: 0,
  },
}
