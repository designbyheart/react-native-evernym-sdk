#!/usr/bin/env node

const yargs = require('yargs')
const fs = require('fs')
const promisify = require('util').promisify
const path = require('path')
const del = require('del')
const { exec, spawn } = require('child-process-async')
const { pathExists, move, remove } = require('fs-extra')
const chalk = require('chalk')
const shell = require('shelljs')

const readFile = promisify(fs.readFile)
const readDir = promisify(fs.readdir)
// this is the path relative to package.json
const testsDirectory = 'e2e/__tests__'

const detoxConfig = require('../package.json').detox.configurations

const args = yargs
  .option('b', {
    alias: 'build',
    describe: 'build before running test',
    choices: ['debug', 'release'],
    string: true,
  })
  .option('s', {
    alias: 'simulators',
    describe: 'simulators on which tests need to run',
    choices: ['iphone5s', 'iphone7', 'iphonex', 'iphonexsmax'],
    default: ['iphonexsmax'],
    array: true,
  })
  .option('u', {
    alias: 'update',
    describe: 'whether to update failing screenshots with new ones',
    default: false,
    boolean: true,
  })
  .option('t', {
    alias: 'testToRun',
    describe: 'which test to run',
    string: true,
  })
  .option('e', {
    alias: 'environment',
    describe: 'which environment to use QA Test1 or DEV-RC',
    string: true,
    choices: [
      'dev',
      'sandbox',
      'staging',
      'prod',
      'demo',
      'qatest1',
      'devteam1',
      'devteam2',
      'devteam3',
      'devrc',
    ],
    default: ['qatest1'],
  })
  .option('k', {
    alias: 'skip',
    describe:
      'skip even the initial test to lock setup and just launch existing installed app',
    boolean: true,
    default: false,
  })
  .parserConfiguration({
    ['populate--']: true,
  })
  .completion()
  .strict(false)
  .example(
    'yarn e2e -- -u -b release -s iphone7 iphonex -t token -- -r',
    'Run e2e with update, build release mode, on simulators, with detox config as -r, and test file to run'
  )
  .help().argv
;(async function() {
  await runBuildIfNeeded(args)
  await runTests(args)
})()

async function runBuildIfNeeded(args) {
  // TODO:KS Need to consider android as well
  const debugBuildPath = detoxConfig['ios.sim.debug'].binaryPath
  // TODO:KS Need to consider android as well
  const releaseBuildPath = detoxConfig['ios.sim.release'].binaryPath
  const releaseBuildExist = await pathExists(releaseBuildPath)
  const debugBuildExist = await pathExists(debugBuildPath)
  const needToGenerateBuild = args.build ? true : !debugBuildExist
  if (needToGenerateBuild) {
    // remove builds if already exists
    ;(debugBuildExist || releaseBuildExist) &&
      (await del(path.dirname(debugBuildPath)))

    const buildType = args.build ? args.build : 'debug'
    // TODO:KS Need to consider android as well
    const buildConfig = `ios.sim.${buildType}`
    const detoxArgs = ['build', `-c`, `${buildConfig}`]
    const detoxCommand = `detox ${detoxArgs.join(' ')}`
    console.log(chalk.green(`Running command ${detoxCommand}`))
    const build = spawn(`detox`, detoxArgs, {
      stdio: 'inherit',
    })
    // wait for build to finish
    await build
    // tell user that build has finished
    console.log(chalk.green(`Successfully built using ${detoxCommand}`))
  }
}

async function runTests(args) {
  // TODO:KS Need to consider android as well
  const simCommandNameMap = {
    iphone5s: 'iPhone 5s',
    iphone7: 'iPhone 7',
    iphonex: 'iPhone X',
    iphonexsmax: 'iPhone XS Max',
  }
  // we need to be sure that developer is
  // running metro bundler with detox env as yes
  // if, then set correct info in .env file
  // and then ask user to run packager again
  const envContent = await readFile('.env', 'utf8')
  if (envContent.trim() !== 'detox=yes') {
    await exec('echo "detox=yes" > .env')
    console.log(
      chalk.bgRed(
        `.env file did not have correct config for detox. We have updated .env file with appropriate information needed. Stop already running packager and re-run it via npm start or yarn start`
      )
    )
    return
  }

  // set environment variables that are going to be used by our tests
  if (args.update) {
    shell.env['UPDATE'] = 'YES'
  }
  // set environment on which app needs to run, prod, staging, dev etc.
  shell.env['environment'] = args.environment

  for (const sim of args.simulators) {
    // TODO:KS Need to consider android as well
    // config to run from package.json
    const detoxConfig = `ios.sim.${args.build || 'debug'}`
    // simulator name for OS
    const simName = simCommandNameMap[sim]
    // set env variable so that our tests can identify running simulator
    shell.env['SIMULATOR'] = sim.toUpperCase()
    // create args for detox
    // override -n (name) of config with sim name
    const initialTestArgs = ['test', '-n', simName, '-c', detoxConfig]
    if (!args.skip) {
      const initialTestRun = spawn(
        'detox',
        [...initialTestArgs, `${testsDirectory}/initial.spec.js`],
        { stdio: 'inherit' }
      )
      // wait for initial test run to finish
      await initialTestRun
    }

    const extraArgs = []
    // is there single test that user wants to run
    if (args.testToRun) {
      extraArgs.push(`${testsDirectory}/${args.testToRun}.spec.js`)
    } else {
      // if we have not specified a single test to run
      // then we need to all tests inside __tests__ directory
      // just not initial.spec.js
      // because that is already run
      const fileNames = await readDir(testsDirectory)
      extraArgs.push(
        ...fileNames
          .map(file => {
            if (file === 'initial.spec.js') return ''
            return `${testsDirectory}/${file}`
          })
          .filter(_ => _)
      )
    }

    // Now we can go ahead and run all functional tests
    // because lock setup is done now
    // Now, since we know app was fresh installed only for this session
    // we can use --reuse(-r) option to speed up our test run
    const detoxRunArgs = [
      ...initialTestArgs,
      ...extraArgs,
      '-r',
      ...(args['--'] || []),
    ]
    const testRun = spawn('detox', detoxRunArgs, { stdio: 'inherit' })
    // wait for test run to finish
    await testRun
  }
}