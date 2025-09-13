import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.budgetplanner.app',
  appName: 'Budget Planner',
  webDir: 'public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f172a",
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: "#0f172a"
    }
  }
};

export default config;
