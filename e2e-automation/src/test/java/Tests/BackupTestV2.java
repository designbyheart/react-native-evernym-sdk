package test.java.Tests;

import com.google.inject.Guice;
import com.google.inject.Injector;
import io.appium.java_client.TouchAction;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.android.AndroidKeyCode;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import test.java.appModules.AppInjector;
import test.java.appModules.AppUtils;
import test.java.appModules.AppiumUtils;
import test.java.pageObjects.BackupPageV2;
import test.java.pageObjects.HomePageV2;
import test.java.pageObjects.MenuPageV2;
import test.java.pageObjects.SettingsPageV2;
import test.java.utility.Config;
import test.java.utility.IntSetup;

public class BackupTestV2 extends IntSetup {

    Injector injector = Guice.createInjector(new AppInjector());
    AppUtils objAppUtils = injector.getInstance(AppUtils.class);
    HomePageV2 objHomePage = injector.getInstance(HomePageV2.class);
    MenuPageV2 objMenuPage = injector.getInstance(MenuPageV2.class);
    SettingsPageV2 objSettingsPage = injector.getInstance(SettingsPageV2.class);
    BackupPageV2 objBackupPage = injector.getInstance(BackupPageV2.class);

    @BeforeClass
    public void BeforeClassSetup() throws Exception {
        driver = IntSetup.configureDriver(Config.Device_Type, "connectMe");
        Thread.sleep(3000);
        objAppUtils.enterPincode(driver);
        objHomePage.burgerMenuButton(driver).click(); // go to Menu
        objMenuPage.settingsButton(driver).click(); // go to Settings
    }

    @Test
    public void checkLocalBackup() throws Exception {
        try { // first backup
            objSettingsPage.createBackupButton(driver).click();
            objBackupPage.recoveryHeader(driver).isDisplayed();
            ctx.recoveryPhrase = objBackupPage.recoveryPhraseBox(driver).getText();
            System.out.println(ctx.recoveryPhrase);
            objBackupPage.continueButton(driver).click();
            objBackupPage.verifyPhraseBox(driver).sendKeys(ctx.recoveryPhrase);
            AndroidDriver androidDriver = (AndroidDriver) driver;
            androidDriver.pressKeyCode(AndroidKeyCode.KEYCODE_ENTER);
//            objBackupPage.zipDownloadButton(driver).click(); // this button disappeared in the latest build
            ctx.backupFileName = objBackupPage.backupFileName(driver).getText();
            System.out.println(ctx.backupFileName);
            ctx.dumpContext();
        }
        catch (Exception ex) { // not first backup
            objSettingsPage.manualBackupButton(driver).click();
        }
        finally{
            objBackupPage.exportEncryptedButton(driver).isEnabled();
            objBackupPage.exportEncryptedButton(driver).click();
            objBackupPage.saveToDriveButton(driver).isEnabled();
            objBackupPage.saveToDriveButton(driver).click();
            objBackupPage.saveButton(driver).isEnabled();
            objBackupPage.saveButton(driver).click();
            objBackupPage.doneButton(driver).isEnabled();
            objBackupPage.doneButton(driver).click();
        }
    }

    @Test(dependsOnMethods = "checkLocalBackup", enabled = false) // this feature is switched off
    public void checkOneCloudBackup() throws Exception {
        objSettingsPage.automaticCloudBackupsButton(driver).click();
        try {
            objBackupPage.oneCloudBackupButton(driver).isEnabled();
            objBackupPage.oneCloudBackupButton(driver).click();
        }
        catch (Exception ex) {} // automatic cloud backup is already enabled
        finally {
            objBackupPage.cloudBackupSuccessMessage(driver).isDisplayed();
            objBackupPage.cloudDoneButton(driver).isEnabled();
            objBackupPage.cloudDoneButton(driver).click();
        }
    }

    @Test(dependsOnMethods = "checkOneCloudBackup", enabled = false) // this feature is switched off
    public void enableAutomaticCloudBackup() throws Exception {
        objSettingsPage.automaticCloudBackupsButton(driver).click();
        try {
            objBackupPage.enableCloudBackupsButton(driver).isEnabled();
            objBackupPage.enableCloudBackupsButton(driver).click();
        }
        catch (Exception ex) {} // automatic cloud backup is already enabled
        finally {
            objBackupPage.cloudBackupSuccessMessage(driver).isDisplayed();
            objBackupPage.cloudDoneButton(driver).isEnabled();
            objBackupPage.cloudDoneButton(driver).click();
        }
    }

    @Test(dependsOnMethods = "enableAutomaticCloudBackup", enabled = false) // this feature is switched off
    public void disableAutomaticCloudBackup() throws Exception {
        new TouchAction(driver)
                // FIXME
                .press(AppiumUtils.findElement(driver, "//android.view.ViewGroup[@content-desc=\"settings-container\"]/android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup/android.view.ViewGroup[2]/android.view.ViewGroup[2]/android.view.ViewGroup", "Slider"))
                .moveTo(AppiumUtils.findElement(driver, "//android.view.ViewGroup[@content-desc=\"settings-container\"]/android.widget.ScrollView/android.view.ViewGroup/android.view.ViewGroup/android.view.ViewGroup[2]/android.view.ViewGroup[1]", "Cloud Icon"))
                .release();
    }

    @AfterClass
    public void AfterClass() {
        driver.quit();
    }

}
