package test.java.pageObjects;

import io.appium.java_client.AppiumDriver;
import org.openqa.selenium.WebElement;

public interface AboutPageV2 {
    public WebElement aboutContainer(AppiumDriver driver) throws Exception;
    public WebElement aboutHeader(AppiumDriver driver) throws Exception;
    public WebElement backArrow(AppiumDriver driver) throws Exception;
    public WebElement termsAndConditionsButton(AppiumDriver driver) throws Exception;
    public WebElement privacyPolicyButton(AppiumDriver driver) throws Exception;
}
