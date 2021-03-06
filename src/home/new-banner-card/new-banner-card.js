// @flow
import React, { useCallback } from 'react'
import { TouchableOpacity, Text, View, Image, StyleSheet } from 'react-native'
import { isiPhone5 } from '../../common/styles'
import {
  colors,
  font,
  fontFamily,
  fontSizes,
} from '../../common/styles/constant'
import { scale, moderateScale } from 'react-native-size-matters'

import type { NewBannerCardProps } from './type-new-banner-card'
import { DefaultLogo } from '../../components/default-logo/default-logo'
import { SwipeRow } from 'react-native-swipe-list-view'
import { removeEvent } from '../../connection-history/connection-history-store'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

const NewBannerCardComponent = (props: NewBannerCardProps) => {
  const onDelete = useCallback(() => {
    props.removeEvent(props.uid, props.navigationRoute)
  }, [props.navigationRoute, props.uid])

  return (
    <SwipeRow rightOpenValue={-scale(75)}>
      <View style={styles.rowBack}>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.rowFront}>
        <TouchableOpacity
          style={styles.cardContainer}
          onPress={() =>
            props.navigation.navigate(props.navigationRoute, { uid: props.uid })
          }
        >
          <View style={styles.iconSection}>
            {typeof props.logoUrl === 'string' ? (
              <Image
                source={{ uri: props.logoUrl }}
                style={styles.issuerLogo}
              />
            ) : (
              <DefaultLogo
                text={props.issuerName[0]}
                size={moderateScale(34, 0.15)}
                fontSize={isiPhone5 ? font.size.M : font.size.ML}
              />
            )}
          </View>
          <View style={styles.textSection}>
            <View style={styles.textIssuerSection}>
              <Text
                style={styles.issuerText}
                ellipsizeMode="tail"
                numberOfLines={1}
              >
                {props.issuerName}
              </Text>
            </View>
            <View style={styles.textMessageSection}>
              <Text style={styles.newMessageText}>
                NEW MESSAGE - TAP TO OPEN
              </Text>
            </View>
          </View>
          <View style={styles.textDateSection}>
            <Text style={styles.dateText}>{props.timestamp}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SwipeRow>
  )
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      removeEvent,
    },
    dispatch
  )

export const NewBannerCard = connect(
  null,
  mapDispatchToProps
)(NewBannerCardComponent)

const styles = StyleSheet.create({
  rowFront: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cmWhite,
    marginLeft: moderateScale(7, 0.1),
    marginRight: moderateScale(7, 0.1),
    marginTop: moderateScale(7, 0.1),
  },
  rowBack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cmWhite,
    marginLeft: moderateScale(7, 0.1),
    marginRight: moderateScale(7, 0.1),
    marginTop: moderateScale(7, 0.1),
  },
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cmGreen3,
    borderWidth: 1,
    borderColor: colors.cmGreen1,
    height: moderateScale(70, 0.12),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSection: {
    height: '100%',
    width: moderateScale(65, 0.2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    flex: 1,
  },
  textIssuerSection: {
    flex: 2,
    justifyContent: 'flex-end',
  },
  textMessageSection: {
    flex: 2,
    justifyContent: 'flex-start',
  },
  textDateSection: {
    height: '100%',
    width: moderateScale(65, 0.2),
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  issuerText: {
    fontFamily: fontFamily,
    fontSize: moderateScale(fontSizes.size5, 0.1),
    fontWeight: 'bold',
    color: colors.cmGray1,
    marginBottom: moderateScale(3, 0.1),
  },
  newMessageText: {
    fontFamily: fontFamily,
    fontSize: moderateScale(fontSizes.size8, 0.1),
    fontWeight: 'bold',
    color: colors.cmGray1,
    marginTop: moderateScale(3, 0.1),
  },
  issuerLogo: {
    width: moderateScale(34, 0.15),
    height: moderateScale(34, 0.15),
    borderRadius: moderateScale(34, 0.15) / 2,
  },
  dateText: {
    fontFamily: fontFamily,
    fontWeight: '500',
    fontSize: moderateScale(fontSizes.size9, 0.1),
    fontStyle: 'italic',
    color: colors.cmGray1,
    marginTop: moderateScale(8, 0.1),
    marginRight: moderateScale(8, 0.1),
  },
  placeholderIfNoImage: {
    width: moderateScale(34, 0.15),
    height: moderateScale(34, 0.15),
    borderRadius: moderateScale(34, 0.15) / 2,
    backgroundColor: colors.cmGray2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTextIfNoImage: {
    fontFamily: fontFamily,
    fontSize: moderateScale(fontSizes.size4, 0.1),
    fontWeight: 'bold',
    color: colors.cmWhite,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    top: 0,
    right: 0,
    width: moderateScale(75, 0.12),
    height: moderateScale(70, 0.12),
    borderRadius: 8,
    backgroundColor: colors.cmRed,
  },
  deleteButtonText: {
    color: colors.cmWhite,
    alignItems: 'center',
    fontFamily: fontFamily,
    fontSize: scale(14),
  },
})
