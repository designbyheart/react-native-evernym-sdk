// @flow
import { StyleSheet } from 'react-native'
import { measurements } from '../common/styles/measurements'
import { colors } from '../common/styles/constant'
import { scale, verticalScale, moderateScale } from 'react-native-size-matters'

const externalStyles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cmWhite,
  },
  flatListContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cmWhite,
    marginTop: verticalScale(90),
  },
  flatListInnerContainer: {
    paddingBottom: moderateScale(170, 0.25),
  },
  blurContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: verticalScale(90),
  },
})

export { externalStyles }
