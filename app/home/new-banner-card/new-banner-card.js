// @flow
import React from 'react'
import { TouchableOpacity, Text, View, Image, StyleSheet } from 'react-native'
import {
  atlantis,
  atlantisOpacity,
  darkGray,
  font,
  newBannerCardSizes,
} from '../../common/styles/constant'

import type { NewBannerCardProps } from './type-new-banner-card'

export const NewBannerCard = (props: NewBannerCardProps) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() =>
        props.navigation.navigate(props.navigationRoute, { uid: props.uid })
      }
    >
      <View style={styles.iconSection}>
        <Image source={{ uri: props.logoUrl }} style={styles.issuerLogo} />
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
          <Text style={styles.newMessageText}>NEW MESSAGE - TAP TO OPEN</Text>
        </View>
      </View>
      <View style={styles.textDateSection}>
        <Text style={styles.dateText}>{props.timestamp}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: atlantisOpacity,
    borderWidth: 1,
    borderColor: atlantis,
    height: newBannerCardSizes.height,
    marginLeft: newBannerCardSizes.distance,
    marginRight: newBannerCardSizes.distance,
    marginTop: newBannerCardSizes.distance,
    borderRadius: 8,
  },
  iconSection: {
    height: '100%',
    width: 64,
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
    width: 65,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  issuerText: {
    fontFamily: font.family,
    fontSize: font.size.M,
    fontWeight: 'bold',
    color: darkGray,
    marginBottom: 3,
  },
  newMessageText: {
    fontFamily: font.family,
    fontSize: font.size.XS1,
    fontWeight: 'bold',
    color: darkGray,
    marginTop: 3,
  },
  issuerLogo: {
    width: newBannerCardSizes.logoSize,
    height: newBannerCardSizes.logoSize,
    borderRadius: newBannerCardSizes.logoSize / 2,
  },
  dateText: {
    fontFamily: font.family,
    fontWeight: '500',
    fontSize: font.size.XXXS,
    fontStyle: 'italic',
    color: darkGray,
    marginTop: 8,
    marginRight: 8,
  },
})