import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';

interface DeepLinkHandlerProps {
  children: React.ReactNode;
  webViewRef: React.RefObject<any>;
}

export default function DeepLinkHandler({ children, webViewRef }: DeepLinkHandlerProps) {
  const navigation = useNavigation();

  useEffect(() => {
    // Handle deep links when the app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle deep links that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = ({ url }: { url: string }) => {
    handleUrl(url);
  };

  const handleUrl = (url: string) => {
    if (!url) return;

    // Parse the URL
    const parsedUrl = Linking.parse(url);
    
    console.log('Deep link received:', parsedUrl);

    // Handle different paths
    if (parsedUrl.path) {
      // If it's a cineby.app URL, load it in the WebView
      if (webViewRef.current && parsedUrl.hostname?.includes('cineby.app')) {
        webViewRef.current.injectJavaScript(`
          window.location.href = "${url}";
          true;
        `);
      } 
      // Otherwise, handle internal navigation
      else if (parsedUrl.path === 'settings') {
        // Example: navigate to settings
        // navigation.navigate('Settings');
      }
    }
  };

  return <>{children}</>;
}