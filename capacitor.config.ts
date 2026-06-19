import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bigimpact.aptitudepro',
  appName: 'AptiLead',
  webDir: 'out',
  server: {
    // TODO: Replace with your Vercel production URL
    url: 'https://project-aptitude.vercel.app/',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Default',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
