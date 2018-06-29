// @flow

import { put, takeLatest, call, all, select } from 'redux-saga/effects'
import {
  GENERATE_RECOVERY_PHRASE_SUCCESS,
  GENERATE_BACKUP_FILE_SUCCESS,
  GENERATE_BACKUP_FILE_FAILURE,
  EXPORT_BACKUP_SUCCESS,
  EXPORT_BACKUP_FAILURE,
  BACKUP_COMPLETE,
  BACKUP_STORE_STATUS,
  BACKUP_WALLET_FAIL,
  PROMPT_WALLET_BACKUP_BANNER,
  GENERATE_RECOVERY_PHRASE_FAILURE,
  GENERATE_RECOVERY_PHRASE_LOADING,
  GENERATE_BACKUP_FILE_LOADING,
  EXPORT_BACKUP_LOADING,
  ERROR_EXPORT_BACKUP,
  ERROR_GENERATE_RECOVERY_PHRASE,
  ERROR_GENERATE_BACKUP_FILE,
} from './type-backup'
import type {
  GenerateBackupFileAction,
  GenerateRecoveryPhraseAction,
  ExportBackupAction,
  PromptBackupBannerAction,
  BackupStore,
  BackupStoreStatus,
  BackupStoreAction,
} from './type-backup'
import RNFetchBlob from 'react-native-fetch-blob'
import { AsyncStorage, Platform } from 'react-native'
import Share from 'react-native-share'
import type { Saga } from 'redux-saga'
import type { AgencyPoolConfig } from '../store/type-config-store'
import type { CustomError } from '../common/type-common'
import { RESET } from '../common/type-common'
import { LAST_SUCCESSFUL_BACKUP } from '../common/secure-storage-constants'
import { getZippedWalletBackupPath } from '../bridge/react-native-cxs/RNCxs'
import { getConfig } from '../store/store-selector'
import { STORAGE_KEY_SHOW_BANNER } from '../components/banner/banner-constants'
import { getWords } from './secure-passphrase'
import moment from 'moment'

const initialState = {
  passPhrase: { data: '' },
  status: BACKUP_STORE_STATUS.IDLE,
  error: null,
  showBanner: false,
  lastSuccessfulBackup: null,
  backupWalletPath: '',
}

export function* generateBackupSaga(
  action: GenerateBackupFileAction
): Generator<*, *, *> {
  // WALLET BACKUP ZIP FLOW
  const {
    agencyUrl,
    agencyDID,
    agencyVerificationKey,
    poolConfig,
  }: AgencyPoolConfig = yield select(getConfig)
  const agencyConfig = {
    agencyUrl,
    agencyDID,
    agencyVerificationKey,
    poolConfig,
  }
  try {
    const documentDirectory = RNFetchBlob.fs.dirs.DocumentDir
    const backupPath = yield call(getZippedWalletBackupPath, {
      documentDirectory,
      agencyConfig,
    })

    yield put(generateBackupFileSuccess(backupPath))
  } catch (e) {
    yield put(
      generateBackupFileFail({
        ...ERROR_GENERATE_BACKUP_FILE,
        message: `${ERROR_GENERATE_BACKUP_FILE.message} ${e.message}`,
      })
    )
  }
}

export function* exportBackupSaga(
  action: ExportBackupAction
): Generator<*, *, *> {
  try {
    Platform.OS === 'android'
      ? yield call(Share.open, {
          title: 'Share Your Data Wallet',
          url: `file://${action.backupWalletPath}`,
          type: 'application/zip',
        })
      : yield call(Share.open, {
          title: 'Share Your Data Wallet',
          url: action.backupWalletPath,
          type: 'application/zip',
          message: 'here we go!',
          subject: 'something here maybe?',
        })
    const lastSuccessfulBackup = moment().format()
    yield call(
      AsyncStorage.setItem,
      LAST_SUCCESSFUL_BACKUP,
      lastSuccessfulBackup
    )
    yield put(exportBackupSuccess(lastSuccessfulBackup))
    yield put(promptBackupBanner(false))
  } catch (e) {
    yield put(
      exportBackupFail({
        ...ERROR_EXPORT_BACKUP,
        message: `${ERROR_EXPORT_BACKUP.message} ${e.message}`,
      })
    )
  }
}

export function* generateRecoveryPhraseSaga(
  action: GenerateRecoveryPhraseAction
): Generator<*, *, *> {
  try {
    let lastSuccessfulBackup = yield call(
      AsyncStorage.getItem,
      LAST_SUCCESSFUL_BACKUP
    )
    yield put(reset(lastSuccessfulBackup))
    let words = yield call(getWords, 8, 5)
    yield put(generateRecoveryPhraseSuccess(words.join(' ')))
    yield put(generateBackupFile())
  } catch (e) {
    yield put(
      generateRecoveryPhraseFail({
        ...ERROR_GENERATE_RECOVERY_PHRASE,
        message: `${ERROR_GENERATE_RECOVERY_PHRASE.message} ${e.message}`,
      })
    )
  }
}

export const generateBackupFileSuccess = (backupWalletPath: string) => ({
  type: GENERATE_BACKUP_FILE_SUCCESS,
  status: BACKUP_STORE_STATUS.GENERATE_BACKUP_FILE_SUCCESS,
  backupWalletPath,
})

export const generateBackupFileFail = (error: CustomError) => ({
  type: GENERATE_BACKUP_FILE_FAILURE,
  status: BACKUP_STORE_STATUS.GENERATE_BACKUP_FILE_FAILURE,
  error,
})

export const generateBackupFile = () => ({
  type: GENERATE_BACKUP_FILE_LOADING,
  status: BACKUP_STORE_STATUS.GENERATE_BACKUP_FILE_LOADING,
})

function* watchBackupStart(): any {
  yield takeLatest(GENERATE_BACKUP_FILE_LOADING, generateBackupSaga)
}

function* watchExportBackup(): any {
  yield takeLatest(EXPORT_BACKUP_LOADING, exportBackupSaga)
}

function* watchGenerateRecoveryPhrase(): any {
  yield takeLatest(GENERATE_RECOVERY_PHRASE_LOADING, generateRecoveryPhraseSaga)
}

export function* watchBackup(): any {
  yield all([
    watchBackupStart(),
    watchGenerateRecoveryPhrase(),
    watchExportBackup(),
    watchBackupBannerPrompt(),
  ])
}

export function* watchBackupBannerPrompt(): any {
  yield takeLatest(PROMPT_WALLET_BACKUP_BANNER, backupBannerSaga)
}

export function* backupBannerSaga(
  action: PromptBackupBannerAction
): Generator<*, *, *> {
  try {
    const { showBanner } = action

    yield call(
      AsyncStorage.setItem,
      STORAGE_KEY_SHOW_BANNER,
      JSON.stringify(showBanner)
    )
  } catch (e) {
    yield put(promptBackupBanner(false))
  }
}

export const reset = (lastSuccessfulBackup: string) => ({
  type: RESET,
  lastSuccessfulBackup,
})

export const promptBackupBanner = (
  showBanner: boolean
): PromptBackupBannerAction => ({
  type: PROMPT_WALLET_BACKUP_BANNER,
  showBanner,
})

export const generateRecoveryPhrase = () => ({
  type: GENERATE_RECOVERY_PHRASE_LOADING,
  status: BACKUP_STORE_STATUS.GENERATE_PHRASE_LOADING,
})

export const generateRecoveryPhraseSuccess = (passPhrase: string) => ({
  type: GENERATE_RECOVERY_PHRASE_SUCCESS,
  status: BACKUP_STORE_STATUS.GENERATE_BACKUP_FILE_SUCCESS,
  passPhrase,
})

export const generateRecoveryPhraseFail = (error: CustomError) => ({
  type: GENERATE_RECOVERY_PHRASE_FAILURE,
  status: BACKUP_STORE_STATUS.GENERATE_BACKUP_FILE_FAILURE,
  error,
})

export const exportBackup = () => ({
  type: EXPORT_BACKUP_LOADING,
  status: BACKUP_STORE_STATUS.EXPORT_BACKUP_LOADING,
})

export const exportBackupFail = (error: CustomError) => ({
  type: EXPORT_BACKUP_FAILURE,
  error,
  status: BACKUP_STORE_STATUS.EXPORT_BACKUP_FAILURE,
})

export const exportBackupSuccess = (lastSuccessfulBackup: string) => ({
  type: EXPORT_BACKUP_SUCCESS,
  status: BACKUP_COMPLETE,
  lastSuccessfulBackup,
})

export default function backupReducer(
  state: BackupStore = initialState,
  action: BackupStoreAction
) {
  switch (action.type) {
    case GENERATE_RECOVERY_PHRASE_LOADING: {
      return {
        ...state,
        status: action.status,
        error: null,
      }
    }
    case GENERATE_RECOVERY_PHRASE_SUCCESS: {
      return {
        ...state,
        status: action.status,
        error: action.error,
        passPhrase: {
          data: action.passPhrase,
        },
      }
    }
    case GENERATE_RECOVERY_PHRASE_FAILURE: {
      return {
        ...state,
        status: action.status,
        error: action.error,
      }
    }
    case GENERATE_BACKUP_FILE_LOADING: {
      return {
        ...state,
        status: action.status,
        error: null,
      }
    }
    case GENERATE_BACKUP_FILE_SUCCESS: {
      return {
        ...state,
        status: action.status,
        error: null,
        backupWalletPath: action.backupWalletPath,
      }
    }
    case GENERATE_BACKUP_FILE_FAILURE: {
      return {
        ...state,
        status: action.status,
        error: action.error,
      }
    }
    case EXPORT_BACKUP_LOADING: {
      return {
        ...state,
        status: action.status,
        error: null,
      }
    }
    case EXPORT_BACKUP_SUCCESS: {
      return {
        ...state,
        error: null,
        status: action.status,
        lastSuccessfulBackup: action.lastSuccessfulBackup,
      }
    }
    case EXPORT_BACKUP_FAILURE: {
      return {
        ...state,
        status: action.status,
        error: action.error,
      }
    }
    case PROMPT_WALLET_BACKUP_BANNER: {
      return {
        ...state,
        showBanner: action.showBanner,
      }
    }
    case BACKUP_WALLET_FAIL: {
      return {
        ...state,
        error: action.error,
      }
    }
    case RESET:
      return {
        ...initialState,
        lastSuccessfulBackup: action.lastSuccessfulBackup,
      }
    default:
      return state
  }
}