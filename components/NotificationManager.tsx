import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationManagerProps {
  children: React.ReactNode;
}

export default function NotificationManager({ children }: NotificationManagerProps) {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Only run on native platforms
    if (Platform.OS === 'web') return;

    // Register for push notifications
    registerForPushNotificationsAsync();

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for user interaction with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Here you would handle deep linking or navigation based on notification
    });

    // Clean up listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return <>{children}</>;
}

// Function to register for push notifications
async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return;

  try {
    // Check if we're running in the Expo client
    if (!Constants.expoConfig?.extra?.isStoreClient) {
      console.log('Running in Expo Go. Push notifications are limited.');
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Get the token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.projectId,
    });
    
    console.log('Push token:', token.data);
    
    // This would typically be sent to your server
    // sendTokenToServer(token.data);
    
  } catch (error) {
    console.error('Error registering for push notifications:', error);
  }
}

// Example function to schedule a local notification (for testing)
export async function scheduleLocalNotification(title: string, body: string, seconds: number = 5) {
  if (Platform.OS === 'web') return;
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: { seconds },
  });
}