/**
 * @jest-environment node
 */

// @flow

import {
  HOME_CONTAINER,
  QR_CODE_INPUT_ENV_SWITCH,
  QR_CODE_ENV_SWITCH_URL,
  QR_CODE_NATIVE_ALERT_SWITCH_TEXT,
  OK_TEXT_ALERT,
  NATIVE_ALERT_OK_MATCHER,
  TEST_PASS_CODE,
  INVITATION_SUCCESS_MODAL_CONTINUE,
  INVITATION_ACCEPT,
  PIN_CODE_INPUT_BOX,
  HOME_HEADER,
  HOME_NEW_MESSAGE,
  CLAIM_OFFER_ACCEPT,
  CLAIM_OFFER_REJECT,
  PROOF_REQUEST_SEND,
  PROOF_REQUEST_REJECT,
  PROOF_REQUEST_GENERATE,
  ALLOW_BUTTON,
  SCAN_BUTTON,
  GENERAL_SCROLL_VIEW,
  PROOF_REQUEST_MISSING_ATTRIBUTE_BASE,
  BURGER_MENU,
  MENU_MY_CONNECTIONS,
  MY_CONNECTIONS_CONTAINER,
  MY_CONNECTIONS_HEADER,
  MY_CONNECTIONS_CONNECTION,
  CONNECTION_ENTRY_HEADER,
  VIEW_CREDENTIAL,
  CREDENTIAL_HEADER,
  VIEW_PROOF,
  PROOF_HEADER,
  CLOSE_BUTTON,
  SCREENSHOT_INVITATION,
  SCREENSHOT_CLAIM_OFFER_PROFILE_INFO,
  SCREENSHOT_CLAIM_OFFER_ADDRESS,
  SCREENSHOT_CLAIM_OFFER_CONTACT,
  SCREENSHOT_CLAIM_OFFER_MIXED,
  SCREENSHOT_PROOF_TEMPLATE_SINGLE_CLAIM_FULFILLED,
  SCREENSHOT_PROOF_TEMPLATE_TWO_CLAIM_FULFILLED,
  SCREENSHOT_TEST_CONNECTION,
  SCREENSHOT_HOME_SMALL_HISTORY,
  SCREENSHOT_HOME_BIG_HISTORY,
  BACK_ARROW,
  MENU_HOME,
} from '../utils/test-constants'
import { waitForElementAndTap } from '../utils/detox-selectors'
import { element, by, waitFor, expect, device } from 'detox'
import {
  getInvitation,
  createSchema,
  createClaimDef,
  sendClaimOffer,
  sendProofRequest,
  CLAIM_OFFER_PROFILE_INFO,
  CLAIM_OFFER_ADDRESS,
  CLAIM_OFFER_CONTACT,
  CLAIM_OFFER_MIXED,
  PROOF_TEMPLATE_SINGLE_CLAIM_FULFILLED,
  PROOF_TEMPLATE_TWO_CLAIM_FULFILLED,
  PROOF_TEMPLATE_MISSING_ATTRIBUTES,
} from '../utils/api'
import { unlock } from '../utils/lock-unlock'
import { matchScreenshot } from '../utils/screenshot'
import { exec } from 'child-process-async'
import chalk from 'chalk'

let connectionId
let schema
let credDef
let credential
let proof
let URL
const TIMEOUT = 60000

describe('Connection via QR code and SMS link', () => {
  it('Case 1.1: user should be able to establish connection via scanning QR code', async () => {
    let [
      token,
      invitationId,
      fetchingInvitation,
      invitationUrl,
      jsonData,
    ] = await getInvitation()

    connectionId = invitationId
    URL = invitationUrl

    const { resolve, promise: invitationPushed } = getDeferred() // <<< can work without it
    const http = require('http')
    const server = http
      .createServer(function (request, response) {
        response.writeHead(200, { 'Content-Type': 'application/json' })
        response.write(jsonData.trim())
        response.end()
        // resolve promise that invitation has been sent to QR scanner
        resolve && resolve() // <<< can work without it
      })
      .listen(1337)
    console.log(
      chalk.greenBright('Invitation server is listening on port 1337...')
    )

    await waitForElementAndTap('text', SCAN_BUTTON, TIMEOUT)

    await invitationPushed // <<< can work without it

    // server has sent data, we can dispose the server
    server.close()
    console.log(chalk.redBright('Invitation server has been stopped.'))

    await waitForElementAndTap('text', ALLOW_BUTTON, TIMEOUT)

    await matchScreenshot(SCREENSHOT_INVITATION) // screenshot

    await waitForElementAndTap('id', INVITATION_ACCEPT, TIMEOUT)

    await new Promise((r) => setTimeout(r, 30000)) // sync issue
    // await waitFor(element(by.id(PIN_CODE_INPUT_BOX)).atIndex(1))
    //   .toExist()
    //   .withTimeout(10000)
    // await element(by.id(PIN_CODE_INPUT_BOX))
    //   .atIndex(1)
    //   .replaceText(TEST_PASS_CODE)
  })

  it('Case 1.2: open connection using SMS link right after establishing connection', async () => {
    await exec(`xcrun simctl openurl booted ${URL}`)

    await new Promise((r) => setTimeout(r, 10000)) // sync issue

    await matchScreenshot(SCREENSHOT_HOME_SMALL_HISTORY) // screenshot
  })

  it('Case 2.1: create and reject profile credential', async () => {
    credential = await sendClaimOffer(
      CLAIM_OFFER_PROFILE_INFO,
      connectionId
    ).catch(console.error)

    // catch intermittnet failure with new message absence
    try {
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    } catch (e) {
      console.error(e)
      // await device.launchApp({
      //   newInstance: true,
      // })
      // await unlock()
      await element(by.id(HOME_CONTAINER)).swipe('down')
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    }

    await waitForElementAndTap('text', CLAIM_OFFER_REJECT, TIMEOUT)
  })

  it('Case 2.2: create and accept profile credential', async () => {
    credential = await sendClaimOffer(
      CLAIM_OFFER_PROFILE_INFO,
      connectionId
    ).catch(console.error)

    // catch intermittnet failure with new message absence
    try {
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    } catch (e) {
      console.error(e)
      // await device.launchApp({
      //   newInstance: true,
      // })
      // await unlock()
      await element(by.id(HOME_CONTAINER)).swipe('down')
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    }

    await matchScreenshot(SCREENSHOT_CLAIM_OFFER_PROFILE_INFO) // screenshot

    await waitForElementAndTap('text', CLAIM_OFFER_ACCEPT, TIMEOUT)
  })

  it('Case 2.3: create and accept address credential', async () => {
    credential = await sendClaimOffer(CLAIM_OFFER_ADDRESS, connectionId).catch(
      console.error
    )

    // catch intermittnet failure with new message absence
    try {
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    } catch (e) {
      console.error(e)
      // await device.launchApp({
      //   newInstance: true,
      // })
      // await unlock()
      await element(by.id(HOME_CONTAINER)).swipe('down')
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    }

    await matchScreenshot(SCREENSHOT_CLAIM_OFFER_ADDRESS) // screenshot

    await waitForElementAndTap('text', CLAIM_OFFER_ACCEPT, TIMEOUT)
  })

  it('Case 2.4: create and accept contact credential', async () => {
    credential = await sendClaimOffer(CLAIM_OFFER_CONTACT, connectionId).catch(
      console.error
    )

    // catch intermittnet failure with new message absence
    try {
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    } catch (e) {
      console.error(e)
      // await device.launchApp({
      //   newInstance: true,
      // })
      // await unlock()
      await element(by.id(HOME_CONTAINER)).swipe('down')
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    }

    await matchScreenshot(SCREENSHOT_CLAIM_OFFER_CONTACT) // screenshot

    await waitForElementAndTap('text', CLAIM_OFFER_ACCEPT, TIMEOUT)
  })

  it('Case 2.5: create and accept mixed credential', async () => {
    credential = await sendClaimOffer(CLAIM_OFFER_MIXED, connectionId).catch(
      console.error
    )

    // catch intermittnet failure with new message absence
    try {
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    } catch (e) {
      console.error(e)
      // await device.launchApp({
      //   newInstance: true,
      // })
      // await unlock()
      await element(by.id(HOME_CONTAINER)).swipe('down')
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    }

    await matchScreenshot(SCREENSHOT_CLAIM_OFFER_MIXED) // screenshot

    await waitForElementAndTap('text', CLAIM_OFFER_ACCEPT, TIMEOUT)
  })

  it('Case 3.1: create and reject proof request', async () => {
    proof = await sendProofRequest(
      PROOF_TEMPLATE_SINGLE_CLAIM_FULFILLED,
      connectionId
    ).catch(console.error)

    // catch intermittnet failure with new message absence
    try {
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    } catch (e) {
      console.error(e)
      // await device.launchApp({
      //   newInstance: true,
      // })
      // await unlock()
      await element(by.id(HOME_CONTAINER)).swipe('down')
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    }

    await waitForElementAndTap('text', PROOF_REQUEST_REJECT, TIMEOUT)
  })

  it('Case 3.2: create and send proof request', async () => {
    proof = await sendProofRequest(
      PROOF_TEMPLATE_SINGLE_CLAIM_FULFILLED,
      connectionId
    ).catch(console.error)

    // catch intermittnet failure with new message absence
    try {
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    } catch (e) {
      console.error(e)
      // await device.launchApp({
      //   newInstance: true,
      // })
      // await unlock()
      await element(by.id(HOME_CONTAINER)).swipe('down')
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    }

    await matchScreenshot(SCREENSHOT_PROOF_TEMPLATE_SINGLE_CLAIM_FULFILLED) // screenshot

    await waitForElementAndTap('text', PROOF_REQUEST_SEND, TIMEOUT)
  })

  it('Case 3.3: create and send another proof request', async () => {
    proof = await sendProofRequest(
      PROOF_TEMPLATE_TWO_CLAIM_FULFILLED,
      connectionId
    ).catch(console.error)

    // catch intermittnet failure with new message absence
    try {
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    } catch (e) {
      console.error(e)
      // await device.launchApp({
      //   newInstance: true,
      // })
      // await unlock()
      await element(by.id(HOME_CONTAINER)).swipe('down')
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    }

    await matchScreenshot(SCREENSHOT_PROOF_TEMPLATE_TWO_CLAIM_FULFILLED) // screenshot

    await waitForElementAndTap('text', PROOF_REQUEST_SEND, TIMEOUT)
  })

  it('Case 3.4: create and send self-attested proof request', async () => {
    proof = await sendProofRequest(
      PROOF_TEMPLATE_MISSING_ATTRIBUTES,
      connectionId
    ).catch(console.error)

    // catch intermittnet failure with new message absence
    try {
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    } catch (e) {
      console.error(e)
      // await device.launchApp({
      //   newInstance: true,
      // })
      // await unlock()
      await element(by.id(HOME_CONTAINER)).swipe('down')
      await waitForElementAndTap('text', HOME_NEW_MESSAGE, TIMEOUT)
    }

    await waitForElementAndTap('text', OK_TEXT_ALERT, TIMEOUT)

    await element(by.type(GENERAL_SCROLL_VIEW)).atIndex(2).swipe('down')

    try {
      await element(
        by.id(PROOF_REQUEST_MISSING_ATTRIBUTE_BASE.concat('1'))
      ).typeText('test attribute 1')
    } catch (e) {
      try {
        await element(by.type(GENERAL_SCROLL_VIEW)).atIndex(2).swipe('down')

        await element(
          by.id(PROOF_REQUEST_MISSING_ATTRIBUTE_BASE.concat('1'))
        ).typeText('test attribute 1')
      } catch (e) {
        await element(by.type(GENERAL_SCROLL_VIEW)).atIndex(2).swipe('up')

        await element(
          by.id(PROOF_REQUEST_MISSING_ATTRIBUTE_BASE.concat('1'))
        ).typeText('test attribute 1')
      }
    }
    await element(
      by.id(PROOF_REQUEST_MISSING_ATTRIBUTE_BASE.concat('1'))
    ).tapReturnKey()

    try {
      await element(
        by.id(PROOF_REQUEST_MISSING_ATTRIBUTE_BASE.concat('2'))
      ).typeText('test attribute 2')
    } catch (e) {
      try {
        await element(by.type(GENERAL_SCROLL_VIEW)).atIndex(2).swipe('down')

        await element(
          by.id(PROOF_REQUEST_MISSING_ATTRIBUTE_BASE.concat('2'))
        ).typeText('test attribute 2')
      } catch (e) {
        await element(by.type(GENERAL_SCROLL_VIEW)).atIndex(2).swipe('up')

        await element(
          by.id(PROOF_REQUEST_MISSING_ATTRIBUTE_BASE.concat('2'))
        ).typeText('test attribute 2')
      }
    }
    await element(
      by.id(PROOF_REQUEST_MISSING_ATTRIBUTE_BASE.concat('2'))
    ).tapReturnKey()

    try {
      await element(
        by.id(PROOF_REQUEST_MISSING_ATTRIBUTE_BASE.concat('3'))
      ).typeText('test attribute 3')
    } catch (e) {
      try {
        await element(by.type(GENERAL_SCROLL_VIEW)).atIndex(2).swipe('down')

        await element(
          by.id(PROOF_REQUEST_MISSING_ATTRIBUTE_BASE.concat('3'))
        ).typeText('test attribute 3')
      } catch (e) {
        await element(by.type(GENERAL_SCROLL_VIEW)).atIndex(2).swipe('up')

        await element(
          by.id(PROOF_REQUEST_MISSING_ATTRIBUTE_BASE.concat('3'))
        ).typeText('test attribute 3')
      }
    }
    await element(
      by.id(PROOF_REQUEST_MISSING_ATTRIBUTE_BASE.concat('3'))
    ).tapReturnKey()

    await waitForElementAndTap('text', PROOF_REQUEST_GENERATE, TIMEOUT)

    await waitForElementAndTap('text', PROOF_REQUEST_SEND, TIMEOUT)
  })

  it('Case 4.2: check my connections screenshot with test connection', async () => {
    await waitForElementAndTap('id', BURGER_MENU, TIMEOUT)

    await waitForElementAndTap('text', MENU_MY_CONNECTIONS, TIMEOUT)

    await matchScreenshot(SCREENSHOT_TEST_CONNECTION) // screenshot
  })

  it('Case 5: drill down to connection and check its elements', async () => {
    await waitForElementAndTap('id', BURGER_MENU, TIMEOUT)

    await waitForElementAndTap('text', MENU_MY_CONNECTIONS, TIMEOUT)

    await waitForElementAndTap('text', MY_CONNECTIONS_CONNECTION, TIMEOUT)

    await element(by.type(GENERAL_SCROLL_VIEW))
      .atIndex(0)
      .swipe('down', 'fast', 0.5)

    await expect(element(by.text(CONNECTION_ENTRY_HEADER))).toBeVisible()

    await element(by.text(VIEW_CREDENTIAL)).atIndex(3).tap()

    await expect(element(by.text(CREDENTIAL_HEADER))).toBeVisible()

    await expect(
      element(by.text(CLAIM_OFFER_PROFILE_INFO)).atIndex(0)
    ).toBeVisible()

    await waitForElementAndTap('text', CLOSE_BUTTON, TIMEOUT)

    await element(by.type(GENERAL_SCROLL_VIEW))
      .atIndex(0)
      .swipe('up', 'fast', 0.5)

    await element(by.text(VIEW_PROOF)).atIndex(0).tap()

    await expect(element(by.text(PROOF_HEADER))).toBeVisible()

    await expect(
      element(by.text(PROOF_TEMPLATE_MISSING_ATTRIBUTES)).atIndex(0)
    ).toBeVisible()

    await waitForElementAndTap('text', CLOSE_BUTTON, TIMEOUT)

    await element(by.id(BACK_ARROW)).tap()
  })

  it('Case 6: open connection using SMS link when connection is already expired', async () => {
    // await waitForElementAndTap('id', BURGER_MENU, TIMEOUT)

    // await waitForElementAndTap('text', MENU_HOME, TIMEOUT)

    await exec(`xcrun simctl openurl booted ${URL}`)

    await new Promise((r) => setTimeout(r, 10000)) // sync issue

    await matchScreenshot(SCREENSHOT_HOME_BIG_HISTORY) // screenshot
  })
})

function getDeferred() {
  let resolve
  let reject

  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })

  return { resolve, reject, promise }
}
