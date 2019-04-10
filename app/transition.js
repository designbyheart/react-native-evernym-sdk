// @flow

import { Easing, Animated } from 'react-native'
import { NavigationTransitionProps } from 'react-navigation'

import { checkIfAnimationToUse } from './bridge/react-native-cxs/RNCxs'

const useAnimation = checkIfAnimationToUse()
const duration = useAnimation ? 30 : 300
// when closing page, we want closing animation to be quicker than opening animation
// this is followed in general animation guidelines for material
const backDuration = useAnimation ? 10 : 150

export function modalTransitionConfig(
  toSceneProps: NavigationTransitionProps,
  fromSceneProps: ?NavigationTransitionProps
) {
  // Although we are just calling another function from here
  // but this function is supposed to run different transition
  // for different type of modal screens in our app
  // For example: Question-answer screen is of modal type
  // and has different transition, for now we are making same transitions
  // for all modal types
  // something like this logic should be handled in this function instead
  // of handling it inside our main navigator
  // const routeName = isBack ? fromTransitionProps.scene.route.routeName : toTransitionProps.scene.route.routeName;
  // if (routeName === questionRoute) return QuestionSpecificTransition
  // so, now we can customize different transition as per screen instead of a single global transition
  return bottomSheetScreenTransition(toSceneProps, fromSceneProps)
}

const bottomSheetScreenTransition = (
  toSceneProps: NavigationTransitionProps,
  fromSceneProps: ?NavigationTransitionProps
) => {
  const isBack = isBackNavigation(toSceneProps, fromSceneProps)

  return {
    transitionSpec: timeBasedTransitionSpec(isBack),
    screenInterpolator: (sceneProps: NavigationTransitionProps) => {
      const { layout, position, scene, scenes, index: toIndex } = sceneProps
      const { index } = scene
      const lastSceneIndex = scenes[scenes.length - 1].index
      const { initHeight } = layout

      const translateY = position.interpolate({
        inputRange: [index - 1, index, index + 1],
        outputRange: [initHeight, 0, 0],
      })

      const opacity = position.interpolate({
        inputRange: [index - 1, index - 0.1, index],
        outputRange: [0, 1, 1],
      })

      return {
        opacity,
        transform: [{ translateY }],
      }
    },
    containerStyle: {
      backgroundColor: 'transparent',
    },
  }
}

function timeBasedTransitionSpec(isBack: boolean) {
  return {
    duration: isBack ? backDuration : duration,
    easing: Easing.out(Easing.quad),
    timing: Animated.timing,
    useNativeDriver: true,
  }
}

function isBackNavigation(
  toSceneProps: NavigationTransitionProps,
  fromSceneProps: ?NavigationTransitionProps
) {
  if (!fromSceneProps) {
    return false
  }

  return (
    fromSceneProps.navigation.state.index >= toSceneProps.navigation.state.index
  )
}
