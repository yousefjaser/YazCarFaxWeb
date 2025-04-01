// تعريف مكتبة react-navigation
declare module '@react-navigation/core/src/useRegisterNavigator' {
  import { NavigationContainerRef } from '@react-navigation/core';
  
  export default function useRegisterNavigator(): {
    register: (navigatorKey: string) => void;
    unregister: (navigatorKey: string) => void;
    navigation: NavigationContainerRef<any> | undefined;
  };
} 