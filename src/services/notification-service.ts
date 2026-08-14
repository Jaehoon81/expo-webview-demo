// [파일 역할] demo 알림의 표시 방법, 권한, Android channel, 예약, 수신·누름 감지를 한곳에서 관리합니다.
// [검증 경계] 이 파일의 함수를 호출했다는 사실만으로 OS 알림 영역에 실제로 표시됐다고 볼 수 없습니다.
// 권한 선택, background 수신, 알림 누름은 실제 기기에서 확인해야 합니다.
// [라이브러리] `expo-notifications`가 알림 권한, 예약, 수신 감지 기능을 제공합니다.
// `Platform`으로 Android에서만 필요한 코드를 고릅니다.

// ========================================== 외부 의존성 ==========================================

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// =================================================================================================

// ===================================== 알림 기준값과 handler =====================================

const DEMO_CHANNEL_ID = "webview-demo";
// 예약한 알림 내용에 source 값을 넣어 이 demo가 만든 대기 중 알림만 나중에 찾습니다.
const DEMO_NOTIFICATION_SOURCE = "webview-demo";

// [문법] 함수 밖의 boolean은 앱의 JavaScript가 실행되는 동안 handler를 이미 등록했는지 기억합니다.
let handlerConfigured = false;

// [역할] `configureNotificationHandler`는 앱을 보는 동안 알림을 어떻게 표시할지 한 번만 등록합니다.
export function configureNotificationHandler(): void {
  // 화면을 다시 그릴 때마다 같은 handler를 등록하지 않도록 한 번 설정했으면 바로 끝냅니다.
  if (handlerConfigured) {
    return;
  }

  // [라이브러리] 이 handler는 앱을 보고 있는 동안 알림 배너, 목록, 소리, badge를 표시할지 정합니다.
  Notifications.setNotificationHandler({
    // [문법] `async () => ({ ... })`는 아래 설정 객체를 Promise에 담아 돌려주는 짧은 arrow function입니다.
    // [역할] `handleNotification` callback은 foreground 알림에 적용할 표시·소리·badge 설정을 돌려줍니다.
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  // handler 등록을 마친 뒤 true로 바꿉니다. 다음 호출은 위 조건에서 바로 끝납니다.
  handlerConfigured = true;
}

// =================================================================================================

// ================================== 알림 권한과 Android channel ==================================

// [역할] `ensureNotificationPermission`은 현재 권한을 확인하고 필요할 때만 OS 권한 창을 연 뒤 거부를 오류로 알립니다.
async function ensureNotificationPermission(): Promise<void> {
  // 앱 시작 때 묻지 않고 사용자가 알림 기능을 눌렀을 때 현재 권한을 확인합니다.
  // [문법] 권한 요청 뒤 새 결과를 같은 변수에 넣어야 하므로 `const`가 아니라 `let`을 사용합니다.
  let permission = await Notifications.getPermissionsAsync();

  if (!permission.granted) {
    // [라이브러리] 아직 권한이 없을 때만 OS 권한 선택 창을 엽니다.
    permission = await Notifications.requestPermissionsAsync();
  }

  if (!permission.granted) {
    throw new Error("알림 권한이 거부되었습니다.");
  }
}

// [역할] `configureAndroidChannel`은 Android에서만 demo 알림 channel을 만들거나 같은 설정으로 갱신합니다.
async function configureAndroidChannel(): Promise<void> {
  // Android 알림에는 channel이 필요합니다. iOS에는 같은 개념이 없으므로 Android에서만 만듭니다.
  if (Platform.OS !== "android") {
    // Android가 아니면 channel API를 부르지 않고 여기서 끝냅니다.
    return;
  }

  // [라이브러리] 같은 channel id를 사용해 이름, 중요도, 진동, 불빛 설정을 만들거나 갱신합니다.
  await Notifications.setNotificationChannelAsync(DEMO_CHANNEL_ID, {
    name: "WebView 데모 알림",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#4F46E5",
  });
}

// =================================================================================================

// =========================================== 알림 예약 ===========================================

// [역할] `cancelPendingDemoNotifications`는 아직 실행되지 않은 알림 중 이 demo가 만든 것만 모두 취소합니다.
async function cancelPendingDemoNotifications(): Promise<void> {
  // 아직 전달되지 않은 알림 중 source가 이 demo와 같은 것만 찾습니다.
  // 다른 기능이 만든 알림이나 이미 표시된 알림은 지우지 않습니다.
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  // [문법] `filter` 안의 `{ content }`는 각 알림에서 content만 꺼냅니다.
  // `?.`는 data가 없어도 오류 없이 비교를 멈춥니다.
  // [역할] `filter` callback은 예약 알림의 source가 이 demo와 같은 항목만 남깁니다.
  const demoNotifications = scheduled.filter(
    ({ content }) => content.data?.source === DEMO_NOTIFICATION_SOURCE,
  );

  // [라이브러리] `Promise.all`은 찾은 알림을 모두 취소할 때까지 기다린 뒤 다음 단계로 갑니다.
  await Promise.all(
    // [문법] `map`은 각 identifier를 그 알림을 취소하는 Promise로 바꿉니다.
    // [역할] `map` callback은 각 demo 알림 식별자를 하나의 취소 Promise로 바꿉니다.
    demoNotifications.map(({ identifier }) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  );
}

// [역할] `showDemoNotification`은 channel·권한·기존 예약을 차례로 준비하고 1초 뒤 local 알림을 예약합니다.
export async function showDemoNotification(
  title: string,
  body?: string,
): Promise<void> {
  // [FLOW-05 / 관련 코드] channel 준비 → 권한 확인 → 이전 예약 취소 → 새 알림 예약 순서로 실행합니다.
  // handler 등록은 바로 끝나고, 기기 작업은 `await`로 앞 단계가 끝난 뒤 다음 단계가 시작되게 합니다.
  configureNotificationHandler();
  await configureAndroidChannel();
  await ensureNotificationPermission();
  await cancelPendingDemoNotifications();

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      // [문법] 본문이 빈 문자열이면 `undefined`로 바꿔 본문이 없는 알림으로 보냅니다.
      body: body || undefined,
      data: {
        source: DEMO_NOTIFICATION_SOURCE,
      },
      sound: true,
      badge: 1,
    },
    trigger: {
      // [라이브러리] `TIME_INTERVAL`로 1초 뒤 한 번만 나타나는 기기 알림을 예약합니다.
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      repeats: false,
      // channelId는 Android에만 넣습니다. iOS에서는 `undefined`라 전달하지 않습니다.
      channelId: Platform.OS === "android" ? DEMO_CHANNEL_ID : undefined,
    },
  });
}

// =================================================================================================

// ====================================== 알림 event와 badge =======================================

// [역할] `subscribeToNotificationEvents`는 알림 수신과 누름 listener를 등록하고 둘을 해제할 정리 함수를 돌려줍니다.
export function subscribeToNotificationEvents(): () => void {
  // DemoShell이 화면에 있는 동안 알림 수신과 알림 누름을 듣습니다. 화면이 없어지면 둘 다 해제합니다.
  // [라이브러리] listener를 추가하면 나중에 `remove()`할 수 있는 객체가 돌아옵니다.
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    // [역할] 수신 listener callback은 foreground에서 받은 local 알림의 demo data를 기록합니다.
    (notification) => {
      console.info(
        "로컬 알림을 수신했습니다.",
        notification.request.content.data,
      );
    },
  );
  const responseSubscription =
    // [역할] 응답 listener callback은 사용자가 누른 알림을 기록하고 남은 badge를 지웁니다.
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.info(
        "로컬 알림을 눌렀습니다.",
        response.notification.request.content.data,
      );
      // [문법] 이 listener는 badge 초기화를 기다릴 필요가 없어 Promise 앞에 `void`를 붙입니다.
      // 실패는 뒤의 `catch`에서 기록하므로 조용히 사라지지 않습니다.
      // [역할] badge 실패 처리 callback은 초기화 오류를 기록하되 알림 누름 처리를 멈추지 않습니다.
      void Notifications.setBadgeCountAsync(0).catch((error) => {
        console.warn("앱 배지를 초기화하지 못했습니다.", error);
      });
    });

  // [문법] 이 함수는 정리 함수를 돌려줍니다. `useEffect`가 DemoShell을 없앨 때 이 함수를 호출할 수 있습니다.
  // [역할] 정리 callback은 DemoShell이 사라질 때 알림 수신·응답 listener를 모두 제거합니다.
  return () => {
    // [주의] 두 `remove()`를 빼면 DemoShell을 다시 열 때 listener가 겹쳐 같은 알림을 여러 번 처리합니다.
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

// [역할] `clearApplicationBadge`는 앱 icon에 남은 알림 개수를 0으로 바꿉니다.
export async function clearApplicationBadge(): Promise<void> {
  // 앱을 열거나 다시 활성화할 때 남아 있는 badge 숫자를 0으로 만듭니다.
  await Notifications.setBadgeCountAsync(0);
}

// =================================================================================================
