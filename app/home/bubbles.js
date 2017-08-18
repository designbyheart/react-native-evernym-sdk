import React, { Component, PureComponent } from 'react'
import {
  View,
  Animated,
  InteractionManager,
  Platform,
  Dimensions,
  StyleSheet,
} from 'react-native'
import { View as AnimationView } from 'react-native-animatable'
import { StyledImage } from '../styled-components/common-styled'
import { generatePlaceholderConnection } from '../services'
import { bubbleSize } from '../common/styles'

export class Bubble extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      failed: false,
    }
  }

  _onLoad = () => {
    this.setState({ failed: false })
  }

  _onError = () => {
    this.setState({ failed: true })
  }

  render() {
    let { size, image } = this.props
    if (this.state.failed) {
      image = require('../images/cb_evernym.png')
    }

    return (
      <StyledImage
        size={[size, size]}
        source={image}
        resizeMode={'contain'}
        onLoad={this._onLoad}
        onError={this._onError}
      />
    )
  }
}

export default class ConnectionBubbles extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showBubble: false,
    }
  }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.setState({ showBubble: true })
    })
  }

  render() {
    const { width } = Dimensions.get('window')
    let deviceClass = ''

    if (Platform.OS === 'ios') {
      deviceClass = width === 320
        ? 'Iphone5'
        : width === 414 ? 'IphonePlus' : 'ios'
    }

    return (
      <Animated.View
        style={[
          styles.bubbleContainer,
          { transform: [{ translateY: this.props.height }] },
        ]}
      >
        {this.props.connections.map(({ identifier, name, image, size }) => (
          <AnimationView
            animation="zoomIn"
            duration={600}
            delay={200}
            style={[
              styles.avatar,
              styles[name],
              styles[`${name}${deviceClass}`],
            ]}
            key={identifier}
          >
            <Bubble size={size} image={image} />
          </AnimationView>
        ))}
      </Animated.View>
    )
  }
}

const styles = (styles = StyleSheet.create({
  bubbleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    height: 402,
  },
  avatar: {
    position: 'absolute',
  },
  avatarImage: {
    resizeMode: 'contain',
  },
  bh: {
    top: 70,
    left: 2,
  },
  dell: {
    top: 20,
    left: 125,
  },
  ebay: {
    top: 30,
    left: 210,
  },
  target: {
    top: 90,
    right: 2,
  },
  centuryLink: {
    top: 180,
    left: 5,
  },
  starbucks: {
    top: 110,
    left: 120,
  },
  suncoast: {
    top: 180,
    right: 0,
  },
  amazon: {
    top: 260,
    left: 5,
  },
  dillard: {
    top: 260,
    left: 150,
  },
  verizon: {
    top: 310,
    right: 30,
  },
  dellIphone5: {
    top: 20,
    left: 115,
  },
  targetIphone5: {
    top: 100,
    right: 2,
  },
  starbucksIphone5: {
    top: 110,
    left: 100,
  },
  suncoastIphone5: {
    top: 180,
    right: 2,
  },
  dillardIphone5: {
    top: 260,
    left: 120,
  },
  starbucksIphonePlus: {
    top: 110,
    left: 150,
  },
  dillardIphonePlus: {
    top: 260,
    left: 160,
  },

  // multiple connections specific styles
  evernym: {
    top: 250,
    right: 50,
  },
  evernymIphone5: {
    top: 250,
    right: 50,
  },
  edcu: {
    bottom: 30,
    left: 50,
  },
  edcuIphone5: {
    bottom: 30,
    left: 50,
  },
}))
