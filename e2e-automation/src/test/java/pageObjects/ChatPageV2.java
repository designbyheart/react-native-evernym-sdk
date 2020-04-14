package test.java.pageObjects;

import io.appium.java_client.AppiumDriver;
import org.openqa.selenium.WebElement;

public interface ChatPageV2 {
    public WebElement chatContainer(AppiumDriver driver) throws Exception;
    public WebElement chatHeader(AppiumDriver driver) throws Exception;
    public WebElement backArrow(AppiumDriver driver) throws Exception;
}