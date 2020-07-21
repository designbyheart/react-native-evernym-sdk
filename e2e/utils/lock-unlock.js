// @flow

import { element, by, waitFor, expect } from 'detox'
import {
  LOCK_SELECTION_PIN_CODE,
  TEST_PASS_CODE,
  TEST_PASS_CODE_CHANGED,
  PIN_CODE_INPUT_BOX,
  LOCK_SETUP_SUCCESS_CLOSE_BUTTON,
  LOCK_SELECTION_OR_TEXT,
  SWITCH_ENVIRONMENT_SAVE_BUTTON,
  NATIVE_ALERT_OK_MATCHER,
  APP_ENVIRONMENT,
} from './test-constants'
import { cat } from 'shelljs'

export const unlock = async () => {
  try {
    await waitFor(element(by.id(PIN_CODE_INPUT_BOX)))
      .toExist()
      .withTimeout(5000)
    // If lock is already setup, then just unlock the app
    await unlockAppViaPassCode()
  } catch (e) {
    // if lock is not setup then setup environment and pass code
    await setEnvironment()
    await setupPassCode()
  }
}

async function setEnvironment() {
  const acceptButton = element(by.id('eula-accept')) // it taps but then throws error the
  await acceptButton.tap()

  // We have hidden start-fresh button for now, Once we enable it then we can add this line again
  // const startFreshButton = element(by.id('start-fresh'))
  // await startFreshButton.tap()
  const orText = element(by.id(LOCK_SELECTION_OR_TEXT))

  await orText.longPress()
  await orText.multiTap(10)

  await element(NATIVE_ALERT_OK_MATCHER()).tap()

  await element(by.id(APP_ENVIRONMENT)).tap()

  await element(by.id(SWITCH_ENVIRONMENT_SAVE_BUTTON)).tap()
}

async function setupPassCode() {
  await element(by.id(LOCK_SELECTION_PIN_CODE)).tap()

  await element(by.id(PIN_CODE_INPUT_BOX)).replaceText(TEST_PASS_CODE)
  // await element(by.id(PIN_CODE_INPUT_BOX)).replaceText(TEST_PASS_CODE)

  await element(by.id(LOCK_SETUP_SUCCESS_CLOSE_BUTTON)).tap()

  await expect(element(by.id('home-container'))).toBeVisible()
}

async function unlockAppViaPassCode() {
  await element(by.id(PIN_CODE_INPUT_BOX)).replaceText(TEST_PASS_CODE)
  try {
    await expect(element(by.id('home-container'))).toBeVisible()
  } catch (e) {
    // passcode has been changed in previous tests
    await element(by.id(PIN_CODE_INPUT_BOX)).replaceText(TEST_PASS_CODE_CHANGED)
    await expect(element(by.id('home-container'))).toBeVisible()
  }
}

async function setupBiometric() {}

async function unlockAppViaBiometric() {}
