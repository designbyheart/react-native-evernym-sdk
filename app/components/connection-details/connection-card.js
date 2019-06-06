// @flow
import React from 'react'
import SvgCustomIcon from '../../components/svg-custom-icon'
import {
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { Border } from '../../components/connection-details/border'

// TODO: Fix the <any, {}> to be the correct types for props and state
class ConnectionCard extends React.Component<any, {}> {
  constructor(props: any) {
    super(props)
    this.state = {}
  }
  updateAndShowModal = () => {
    this.props.showModal(this.props.order)
  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.messageDate}>{this.props.messageDate}</Text>
        <View style={styles.innerWrapper}>
          <View style={styles.top}>
            <View
              style={[
                styles.badge,
                { display: this.props.showBadge ? 'flex' : 'none' },
              ]}
            >
              <View style={styles.iconWrapper}>
                <SvgCustomIcon
                  name="CheckmarkBadge"
                  fill={'#505050'}
                  width={22}
                  height={33}
                />
              </View>
            </View>
            <View style={styles.headerWrapper}>
              <View style={styles.header}>
                <Text style={styles.headerText}>{this.props.headerText}</Text>
              </View>
              <View style={styles.infoWrapper}>
                <Text style={styles.infoType}>{this.props.infoType}</Text>
                <Text style={styles.infoDate}>{this.props.infoDate}</Text>
              </View>
            </View>
          </View>
          <Border borderColor={'#eaeaea'} />
          <View style={styles.bottom}>
            <View style={styles.attributesWrapper}>
              <Text style={styles.attributesText}>
                {this.props.noOfAttributes}
              </Text>
              <Text style={styles.attributesText}> Attributes</Text>
            </View>
            <TouchableOpacity
              onPress={this.updateAndShowModal}
              style={styles.button}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: this.props.colorBackground },
                ]}
              >
                {this.props.buttonText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.helperView} />
      </View>
    )
  }
}

export { ConnectionCard }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingLeft: '7%',
    paddingRight: '7%',
    paddingTop: 15,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  innerWrapper: {
    marginTop: 15,
    borderBottomColor: '#ccc',
    backgroundColor: 'white',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 7,
    shadowOffset: {
      height: 0,
      width: 0,
    },
    elevation: Platform.OS === 'android' ? 4 : 0,
    marginBottom: 15,
    borderRadius: 6,
    padding: 15,
  },
  messageDate: {
    color: '#777',
    fontSize: 11,
    lineHeight: 13,
    textAlign: 'left',
    fontFamily: 'Lato',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingBottom: 15,
  },
  badge: {
    height: 38,
    width: 35,
  },
  badgeImage: {
    width: 23,
    height: 34.5,
  },
  headerWrapper: {
    flex: 1,
  },
  header: {
    width: '100%',
  },
  headerText: {
    textAlign: 'left',
    fontSize: 14,
    fontWeight: '700',
    color: '#505050',
    fontFamily: 'Lato',
  },
  infoWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    paddingTop: 4,
  },
  infoType: {
    textAlign: 'left',
    fontSize: 11,
    fontWeight: '500',
    color: '#777777',
    flex: 1,
    fontFamily: 'Lato',
    lineHeight: 13,
  },
  infoDate: {
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '500',
    color: '#505050',
    fontFamily: 'Lato',
  },
  bottom: {
    width: '100%',
    paddingTop: 15,
    backgroundColor: 'white',
  },
  attributesWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  attributesText: {
    textAlign: 'left',
    fontSize: 14,
    fontWeight: '400',
    color: '#505050',
    fontFamily: 'Lato',
  },
  button: {
    backgroundColor: 'transparent',
    padding: 8,
    paddingRight: 25,
    marginLeft: -8,
    marginBottom: -8,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Lato',
  },
  iconWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  helperView: {
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    width: '100%',
    paddingTop: 15,
  },
})