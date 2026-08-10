import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const DEMO_CHANNEL_ID = "webview-demo";
const DEMO_NOTIFICATION_SOURCE = "webview-demo";

let handlerConfigured = false;

export function configureNotificationHandler(): void {
  if (handlerConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  handlerConfigured = true;
}

async function ensureNotificationPermission(): Promise<void> {
  let permission = await Notifications.getPermissionsAsync();

  if (!permission.granted) {
    permission = await Notifications.requestPermissionsAsync();
  }

  if (!permission.granted) {
    throw new Error("알림 권한이 거부되었습니다.");
  }
}

async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(DEMO_CHANNEL_ID, {
    name: "WebView 데모 알림",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#4F46E5",
  });
}

async function cancelPendingDemoNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const demoNotifications = scheduled.filter(
    ({ content }) => content.data?.source === DEMO_NOTIFICATION_SOURCE,
  );

  await Promise.all(
    demoNotifications.map(({ identifier }) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  );
}

export async function showDemoNotification(
  title: string,
  body?: string,
): Promise<void> {
  configureNotificationHandler();
  await configureAndroidChannel();
  await ensureNotificationPermission();
  await cancelPendingDemoNotifications();

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: body || undefined,
      data: {
        source: DEMO_NOTIFICATION_SOURCE,
      },
      sound: true,
      badge: 1,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      repeats: false,
      channelId: Platform.OS === "android" ? DEMO_CHANNEL_ID : undefined,
    },
  });
}

export function subscribeToNotificationEvents(): () => void {
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.info(
        "로컬 알림을 수신했습니다.",
        notification.request.content.data,
      );
    },
  );
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.info(
        "로컬 알림을 눌렀습니다.",
        response.notification.request.content.data,
      );
      void Notifications.setBadgeCountAsync(0).catch((error) => {
        console.warn("앱 배지를 초기화하지 못했습니다.", error);
      });
    });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

export async function clearApplicationBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
