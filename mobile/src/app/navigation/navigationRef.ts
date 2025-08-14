import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export function navigate(name: string, params?: any): boolean {
  if (navigationRef.isReady()) {
    try {
      navigationRef.navigate(name as never, params as never);
      return true;
    } catch (error) {
      console.error('Navigation error:', error);
      return false;
    }
  } else {
    console.warn('Navigation not ready, cannot navigate to:', name);
    return false;
  }
}