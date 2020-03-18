package test.java.appModules;

import java.util.HashMap;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.RemoteWebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.Reporter;

import io.appium.java_client.AppiumDriver;
import io.appium.java_client.TouchAction;


/**
 * The AppiumUtils class is to implement appium utility methods
 * All Appium action overrides are defined here
 * 
 */

public class AppiumUtils {
	private static WebElement element = null;

	/**
	 * clicks on a webelement n times
	 * @param n - how many time to be clicked
	 * @param element -webelemnt which need to be clicked
	 * @return void
	 */
	public static void nClick(int n, WebElement element) throws Exception {

		for (int i = 0; i < n; i++) {
			element.click();// click action on element
		}
	}

	/**
	 * wait for a element until its not visible
	 * @param driver - appium driver available for session
	 * @param element -webelement for which we need to wait
	 * @param seconds - how many seconds we want to wait webelemnt
	 * @return void
	 */
	public static void waitForScreenToLoad(AppiumDriver driver, WebElement element, int seconds) {

		WebDriverWait wait = new WebDriverWait(driver, seconds);
		//wait.until(ExpectedConditions.visibilityOf(element));// Visibilty condition check
	}

	/**
	 * finds element by xpath
	 * @param driver - appium driver available for session
	 * @param expression -path for webelement
	 * @param elementName -name of the element to be displayed at console
	 * @return webelement on which we need to peform action
	 */
	public static WebElement findElement (AppiumDriver driver, String expression, String elementName) throws Exception {
		try {
			element = driver.findElement(By.xpath(expression));
			System.out.println(elementName + " is displayed");
			return element;
		} catch (Exception e) {
			System.out.println(elementName + " is not displayed");
			Reporter.log(elementName + " is not displayed");
			throw (e);
		}

	}

	/**
	 * check element is not present on screen
	 * @param driver - appium driver available for session
	 * @param expression -path for webelement
	 * @param elementName -name of the element to be displayed at console
	 * @return void
	 */

	public static void elementNotPresent(AppiumDriver driver, String expression, String elementName) {
		try {
			element = driver.findElement(By.xpath(expression));
		} catch (Exception e) {
			System.out.println(elementName + "is not displayed");
			Assert.assertTrue(true);
		}

	}

	/**
	 * long press on element
	 * @param driver  - appium driver available for session
	 * @param element -element on which action need to be peformed
	 * @return void
	 */

	public static void longPress(AppiumDriver driver, WebElement element) {
		TouchAction action = new TouchAction(driver);
		action.longPress(element);
		action.perform();

	}

	/**
	 * swipe on element
	 * @param driver -appium driver available for session
	 * @param element -element on which action need to be peformed
	 * @param direction-on which direction swipe need to be peformed
	 * @return void
	 */

	public static void swipe(AppiumDriver driver, WebElement element, String direction) throws Exception {
		JavascriptExecutor js = (JavascriptExecutor) driver;
		HashMap<String, String> scrollObject = new HashMap<String, String>();
		scrollObject.put("direction", direction);
		scrollObject.put("element", ((RemoteWebElement) element).getId());
		js.executeScript("mobile:swipe", scrollObject);

	}

	/**
	 * retry finding the element till timeOut
	 * @param driver - appium driver available for session
	 * @param expression -path for webelement
	 * @param elementName -name of the element to be displayed at console
	 * @param timeOut-how many time user want to retry
	 * @return webelement on which we need to peform action
	 */
	public static WebElement findElement(AppiumDriver driver, String expression, String elementName, int timeOut)throws Exception {
		{

			for (int i = 0; i < timeOut; i++) {
				try {
					element = driver.findElement(By.xpath(expression));
					break;
				} catch (Exception e) {
					try {
						if (i == timeOut) {
							System.out.println(elementName + " is not displayed");
							Reporter.log(elementName + " is not displayed");
							throw (e);
						}
						Thread.sleep(1000);
					} catch (InterruptedException e1) {
					}
				}

			}
			return element;
		}

	}
}