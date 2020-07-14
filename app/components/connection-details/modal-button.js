// @flow
import React, { PureComponent } from 'react'
import { Text, View, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { scale, verticalScale, moderateScale } from 'react-native-size-matters'
import { colors, fontSizes, fontFamily } from '../../common/styles/constant'

// TODO: Fix the <any, {}> to be the correct types for props and state
class ModalButton extends PureComponent<any, {}> {
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.innerWrapper}>
          <TouchableOpacity
            style={[
              styles.buttonClose,
              { backgroundColor: this.props.colorBackground },
            ]}
            onPress={this.props.onClose}
          >
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }
}

export { ModalButton }

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cmGray5,
    width: '100%',
    padding: moderateScale(15),
    paddingBottom: moderateScale(45),
  },
  innerWrapper: {
    width: '100%',
    borderRadius: 5,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonClose: {
    padding: moderateScale(17),
    paddingLeft: moderateScale(30),
    paddingRight: moderateScale(30),
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  close: {
    fontSize: verticalScale(fontSizes.size5),
    fontWeight: '700',
    color: colors.cmWhite,
    fontFamily: fontFamily,
  },
})
