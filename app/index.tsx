import React, { useRef, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  BackHandler, 
  ActivityIndicator, 
  Text,
  TouchableOpacity
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';

const CINEBY_URL = 'https://www.cineby.app/';

// 🔥 Inject JavaScript to block popups, redirects, and ads
const INJECTED_JAVASCRIPT = `
(function() {
  console.log("AdBlock Script Running...");

  // Function to remove ads dynamically
  function removeAds() {
    const adSelectors = [
      '.ad', '.advertisement', '.banner-ad', '.ad-container',
      '[class*="ad-"]', '[id*="ad-"]', 'iframe[src*="ad"]',
      'div[data-ad]', 'iframe', 'popup', 'video-ad'
    ];

    adSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.remove();
      });
    });

    console.log("Ads Removed.");
  }

  // Block JavaScript popups
  window.open = function() {
    console.log("Blocked a popup.");
    return null;
  };

  // Stop redirects from ad scripts
  Object.defineProperty(document, 'location', {
    configurable: false,
    enumerable: true,
    get: function() {
      return window.location;
    },
    set: function(value) {
      console.log("Blocked redirect to:", value);
    }
  });

  // Run ad removal immediately
  removeAds();

  // Keep removing ads dynamically
  const observer = new MutationObserver(removeAds);
  observer.observe(document.body, { childList: true, subtree: true });

  // Notify React Native that page has loaded
  window.addEventListener('load', function() {
    window.ReactNativeWebView.postMessage('PAGE_LOADED');
  });

})();
true;
`;

export default function WebViewScreen() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [canGoBack]);

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setError(nativeEvent.description || 'Failed to load the website');
    setIsLoading(false);
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleGoBack = () => {
    if (webViewRef.current && canGoBack) {
      webViewRef.current.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header with back button */}
      <View style={styles.header}>
        {canGoBack && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { marginRight: canGoBack ? 40 : 0 }]}>
          SanPix
        </Text>
      </View>
      
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Loading SanPix...</Text>
        </View>
      )}

      {/* Error view */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={handleRetry}
            activeOpacity={0.7}
          >
            <RefreshCw color="#fff" size={20} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView */}
      {!error && (
        <WebView
          ref={webViewRef}
          source={{ uri: CINEBY_URL }}
          style={[styles.webview, isLoading && styles.hidden]}
          injectedJavaScript={INJECTED_JAVASCRIPT}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          onError={handleError}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsBackForwardNavigationGestures={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={true}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
          onMessage={(event) => {
            const { data } = event.nativeEvent;
            if (data === 'PAGE_LOADED') {
              console.log('Page fully loaded');
            }
          }}
          // 🚫 Block popups & external links
          onShouldStartLoadWithRequest={(request) => {
            if (!request.url.startsWith(CINEBY_URL)) {
              console.log("Blocked external URL:", request.url);
              return false; // 🔥 Block popups and external ads
            }
            return true;
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: { color: '#E50914', fontSize: 18, fontFamily: 'Inter-Bold', flex: 1, textAlign: 'center' },
  backButton: { padding: 8 },
  webview: { flex: 1, backgroundColor: '#000' },
  hidden: { opacity: 0 },
  loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { marginTop: 10, color: '#fff', fontSize: 16, fontFamily: 'Inter-Regular' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#000' },
  errorText: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 20, fontFamily: 'Inter-Regular' },
  retryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E50914', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 4 },
  retryText: { color: '#fff', marginLeft: 8, fontSize: 16, fontFamily: 'Inter-Bold' },
});
