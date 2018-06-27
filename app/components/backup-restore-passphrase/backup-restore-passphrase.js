// @flow
import React, { Component, PureComponent } from 'react'
import {
  Image,
  Keyboard,
  StyleSheet,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native'
import { Container, CustomView, CustomText } from '../index'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { color } from '../../common/styles/constant'
import { SHORT_DEVICE } from '../../common/styles/constant'
import type { BackupRestorePassphraseProps } from './type-backup-restore-passphrase'

const { height } = Dimensions.get('window')
const inputBoxHeight = height > SHORT_DEVICE || Platform.OS === 'ios' ? 137 : 40

export default class BackupRestorePassphrase extends PureComponent<
  BackupRestorePassphraseProps,
  void
> {
  render() {
    const { filename, testID, onSubmit, onChangeText, placeholder } = this.props
    return (
      <Container
        testID={`${testID}-container`}
        style={[styles.verifyMainContainer]}
        onPress={Keyboard.dismiss}
        safeArea
      >
        <Image
          source={require('../../images/transparentBands2.png')}
          style={[styles.backgroundImageVerify]}
        />
        <KeyboardAwareScrollView extraHeight={50}>
          <Container testID={`${testID}-inputbox`}>
            <CustomView center>
              {filename ? (
                <CustomView center>
                  <Image source={require('../../images/encryptedFile.png')} />
                  <CustomText center transparentBg h5 style={[styles.filename]}>
                    {filename}
                  </CustomText>
                </CustomView>
              ) : (
                <CustomText transparentBg center style={[styles.title]}>
                  Verify Your Recovery Phrase
                </CustomText>
              )}
            </CustomView>
            <CustomView center>
              <CustomText
                center
                transparentBg
                h5
                style={[styles.verifyMainText]}
              >
                {filename
                  ? 'Enter the Recovery Phrase you used to create this backup.'
                  : 'To verify that you have copied down your recovery phrase correctly, please enter it below.'}
              </CustomText>
            </CustomView>
            <TextInput
              autoCapitalize="none"
              testID={`${testID}-text-input`}
              accessible={true}
              accessibilityLabel={`${testID}-text-input`}
              autoFocus={true}
              onSubmitEditing={onSubmit}
              onChangeText={onChangeText}
              style={[styles.inputBox]}
              placeholder={placeholder}
              placeholderTextColor="white"
              autoCorrect={false}
              underlineColorAndroid="transparent"
              multiline={Platform.OS === 'ios' ? true : false}
              clearButtonMode="always"
              returnKeyType="done"
              returnKeyLabel="done"
              numberOfLines={1}
            />
          </Container>
        </KeyboardAwareScrollView>
      </Container>
    )
  }
}

const styles = StyleSheet.create({
  verifyMainContainer: {
    flex: 1,
    backgroundColor: color.bg.twelfth.color,
  },
  backgroundImageVerify: {
    flex: 1,
    position: 'absolute',
  },
  filename: {
    fontWeight: 'bold',
  },
  title: {
    fontWeight: '600',
    lineHeight: 27,
    fontSize: 22,
    marginBottom: 20,
    width: '100%',
  },
  verifyMainText: {
    paddingHorizontal: 20,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '500',
    marginTop: height > SHORT_DEVICE ? 40 : 20,
    marginBottom: height > SHORT_DEVICE ? 40 : 20,
  },
  inputBox: {
    marginBottom: 24,
    marginRight: 20,
    marginLeft: 20,
    height: inputBoxHeight,
    backgroundColor: 'rgba(0,0,0,0.33)',
    color: 'white',
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 20,
    fontStyle: 'italic',
  },
})
