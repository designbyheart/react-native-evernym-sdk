// @flow

import detox, { device } from 'detox'
import { storeBootedDeviceId } from '../utils/screenshot'
import { setDeviceType } from '../utils/test-constants'
import { unlock } from '../utils/lock-unlock'

jest.setTimeout(120000)
const config = require('../../package.json').detox

beforeAll(async () => {
  await detox.init(config, { launchApp: false })
  await device.launchApp({
    permissions: { camera: 'YES', photos: 'YES', notifications: 'YES' },
  })
  await storeBootedDeviceId()
  setDeviceType(device.getPlatform())
})

beforeEach(async () => {
  await unlock()
})

afterEach(async () => {
  // await device.terminateApp()
})

afterAll(async () => {
  // await device.terminateApp()
  await detox.cleanup()
})
