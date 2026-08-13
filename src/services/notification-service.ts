// [파일 역할] WebView demo 전용 local notification handler·권한·Android channel·예약과 app lifecycle listener를 관리합니다.
// [검증 경계] 이 module의 API 호출만으로 OS tray 표시·권한 선택·background 수신을 증명하지 않으며 해당 결과는 실기기 기록을 따릅니다.
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const DEMO_CHANNEL_ID = "webview-demo";
const DEMO_NOTIFICATION_SOURCE = "webview-demo";

let handlerConfigured = false;

export function configureNotificationHandler(): void {
  // process 전역 handler를 component render마다 중복 설정하지 않도록 module flag로 한 번만 등록합니다.
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
  // 사진과 마찬가지로 알림 action을 실제 호출할 때 기존 권한을 확인하고 필요한 경우에만 요청합니다.
  let permission = await Notifications.getPermissionsAsync();

  if (!permission.granted) {
    permission = await Notifications.requestPermissionsAsync();
  }

  if (!permission.granted) {
    throw new Error("알림 권한이 거부되었습니다.");
  }
}

async function configureAndroidChannel(): Promise<void> {
  // Android 8+ 표시 정책과 Android 13 권한 prompt 선행 조건을 위한 channel이며 iOS에서는 실행하지 않습니다.
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
  // source marker가 같은 아직 예약된 demo 알림만 취소하고 다른 기능이나 이미 전달된 알림은 건드리지 않습니다.
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
  // [FLOW-05 / 관련 코드] channel → 권한 → 이전 demo 예약 정리 → 새 단발 예약 순서를 직렬로 보장합니다.
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
  // DemoShell mount 수명 동안 수신/탭 listener를 유지하고 cleanup 함수에서 둘 다 제거합니다.
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
    // [주의] cleanup 누락 시 DemoShell remount 뒤 동일 notification을 여러 listener가 처리할 수 있습니다.
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

export async function clearApplicationBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
