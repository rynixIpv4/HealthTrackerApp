/**
 * Navigation utility functions
 */

/**
 * Safe navigation helper that tries multiple approaches
 * @param navigation The navigation object
 * @param screenName The screen name to navigate to
 */
export const safeNavigate = (navigation: any, screenName: string): boolean => {
  console.log(`Safe navigation to: ${screenName}`);
  
  // Try direct navigation first
  try {
    navigation.navigate(screenName);
    console.log(`Successfully navigated to ${screenName}`);
    return true;
  } catch (error) {
    console.error(`Direct navigation to ${screenName} failed:`, error);
    
    // Try using parent navigation
    try {
      const parentNav = navigation.getParent?.();
      if (parentNav) {
        parentNav.navigate(screenName);
        console.log(`Successfully navigated to ${screenName} via parent`);
        return true;
      }
    } catch (parentError) {
      console.error(`Parent navigation to ${screenName} failed:`, parentError);
    }
    
    // Try using navigation state methods
    try {
      const state = navigation.getState?.() || navigation.dangerouslyGetState?.();
      if (state && state.routes) {
        const routeIndex = state.routes.findIndex((route: any) => route.name === screenName);
        if (routeIndex >= 0) {
          navigation.reset({
            index: routeIndex,
            routes: state.routes.slice(0, routeIndex + 1),
          });
          console.log(`Successfully navigated to ${screenName} via reset`);
          return true;
        }
      }
    } catch (stateError) {
      console.error(`State navigation to ${screenName} failed:`, stateError);
    }
    
    // Last resort - try to navigate to the main screen and then to the target
    try {
      navigation.navigate('Main', { screen: screenName });
      console.log(`Attempted to navigate to ${screenName} via Main`);
      return true;
    } catch (lastError) {
      console.error(`All navigation attempts to ${screenName} failed`);
      return false;
    }
  }
}; 