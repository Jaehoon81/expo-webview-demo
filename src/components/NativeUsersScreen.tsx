// [파일 역할] 사용자 목록을 보여 주는 네이티브 탭입니다. 처음 불러오기, 다시 불러오기, 당겨서 새로 고침, 성공·실패 안내를 관리합니다.
// [FLOW-07] 시작: React가 항상 mount된 native 탭을 render하면 `active` 값으로 Query observer와 최초 request 여부를 정합니다.
// [검증 경계] test에서는 Query Hook과 Alert를 가짜로 바꿉니다.
// 화면 변화와 손동작 뒤의 함수 호출은 확인하지만, 실제 HTTP 요청 시점과 휴대폰 손동작은 확인하지 못합니다.
// [라이브러리] React의 effect, ref, callback은 탭 표시와 timer 값을 관리합니다.
// React Native `FlatList`는 Query가 준 사용자를 스크롤 목록으로 보여 줍니다.

// ========================================== 외부 의존성 ==========================================

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// [라이브러리] 이 custom Hook은 TanStack Query가 보관한 사용자와 요청 상태를 돌려줍니다. 화면은 Axios 요청과 Zod 검사 방법을 알 필요가 없습니다.
import { useUsersQuery } from "@/src/api/users";
import type { User } from "@/src/types/user";
import {
  getScrollDirection,
  type ScrollDirection,
} from "@/src/utils/scroll-direction";

// =================================================================================================

// ======================================== 외부 type 계약 =========================================

export type NativeUsersScreenHandle = {
  // DemoShell에는 다시 불러오기 명령 두 개만 줍니다. Query 객체 전체는 이 component 안에 숨깁니다.
  // [역할] `refetch`는 Query를 다시 요청하고 선택에 따라 결과 Alert까지 보여 주는 공개 함수 계약입니다.
  refetch: (showResultAlert?: boolean) => Promise<void>;
  // [역할] `refetchIfActivated`는 사용자가 한 번이라도 연 탭에서만 다시 요청하는 공개 함수 계약입니다.
  refetchIfActivated: (showResultAlert?: boolean) => Promise<void>;
};

// active가 true이면 이 탭을 보여 주고 사용자 요청도 시작할 수 있습니다. bottomContentInset은 목록이 하단 탭 막대에 가리지 않을 여백입니다.
type NativeUsersScreenProps = {
  active: boolean;
  bottomContentInset: number;
  // [역할] `onScrollDirection`은 목록이 움직인 방향을 하단 탭 표시를 관리하는 DemoShell에 보내는 함수 계약입니다.
  onScrollDirection: (direction: ScrollDirection) => void;
};

// 당겨서 새로 고침한 결과를 Alert로 보여 주기 전까지 잠시 보관할 모양입니다.
type RefreshResultAlert = {
  title: string;
  message: string;
};

// iOS에서는 손을 놓은 뒤 새로 고침 표시가 사라질 시간을 조금 기다렸다가 Alert를 띄웁니다.
const IOS_PULL_REFRESH_ALERT_DELAY_MS = 300;

// =================================================================================================

// ======================================= UserRow component =======================================

// [역할] `UserRow`는 검사된 사용자 한 명의 번호·이름·email을 목록의 한 줄로 보여 줍니다.
// [문법] parameter의 `{ user }`는 props에서 user만 꺼내는 구조 분해입니다. 뒤의 type은 이 줄이 받을 값의 모양을 정합니다.
function UserRow({ user }: { user: User }) {
  // 사용자 한 명의 id, name, email만 보여 주는 줄입니다. Zod 검사를 마친 값만 받습니다.
  return (
    <View
      accessibilityLabel={`${user.name}, ${user.email}`}
      style={styles.userRow}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user.id}</Text>
      </View>
      <View style={styles.userText}>
        <Text numberOfLines={1} style={styles.userName}>
          {user.name}
        </Text>
        <Text numberOfLines={1} style={styles.userEmail}>
          {user.email}
        </Text>
      </View>
    </View>
  );
}

// =================================================================================================

// ================================== NativeUsersScreen component ==================================

// [역할] `NativeUsersScreen`은 사용자 Query 상태, 다시 요청, pull-to-refresh와 목록 화면을 함께 관리합니다.
// [문법] `forwardRef<Handle, Props>`에서 첫 type은 DemoShell이 ref로 부를 명령이고, 둘째 type은 이 화면이 받을 props입니다.
export const NativeUsersScreen = forwardRef<
  NativeUsersScreenHandle,
  NativeUsersScreenProps
>(function NativeUsersScreen(
  { active, bottomContentInset, onScrollDirection },
  forwardedRef,
) {

  // ====================================== Query 상태와 ref =======================================

  // [FLOW-07 / 2단계] component render가 `useUsersQuery(active)`를 호출해 현재 active 값을 Query의 `enabled` 입력으로 전달합니다.
  // 이 값은 Query가 지금 보관 중인 사용자와 요청 상태입니다. 탭을 숨겨도 component를 없애지 않으므로 같은 Query 결과를 계속 사용합니다.
  // [역할] `useUsersQuery`는 현재 탭 활성 여부에 맞춰 사용자 요청 상태와 보관된 결과를 제공합니다.
  const usersQuery = useUsersQuery(active);
  // 아래 ref들은 탭 방문 여부, 손동작, 늦게 띄울 Alert 값을 기억합니다. 값이 바뀌어도 그 이유만으로 화면을 다시 그리지는 않습니다.
  // [역할] `scrollStartOffsetRef`는 현재 손동작이 시작된 세로 위치를 다음 scroll 방향 계산까지 기억합니다.
  const scrollStartOffsetRef = useRef(0);
  // 첫 자동 요청 결과를 이미 Alert로 알렸는지 기억합니다. 같은 안내를 두 번 띄우지 않기 위한 값입니다.
  // [역할] `handledInitialResultRef`는 첫 Query 결과 안내를 이미 보여 줬는지 기억합니다.
  const handledInitialResultRef = useRef(false);
  // 사용자가 이 탭을 한 번이라도 열었는지 기억합니다. 열어 보지 않은 탭의 사용자 요청이 뒤에서 몰래 시작되는 일을 막습니다.
  // [역할] `hasActivatedRef`는 이 탭을 한 번이라도 실제로 보여 준 적이 있는지 기억합니다.
  const hasActivatedRef = useRef(false);
  // 첫 ref는 iOS에서 아직 손으로 당기는 중인지 기억합니다. 둘째 ref는 손을 놓은 뒤 보여 줄 결과를 잠시 보관합니다.
  // [역할] `isDraggingRef`는 사용자가 아직 목록을 손으로 당기는 중인지 기억합니다.
  const isDraggingRef = useRef(false);
  // [역할] `pendingPullRefreshAlertRef`는 iOS에서 손을 놓은 뒤 보여 줄 새로 고침 결과를 잠시 보관합니다.
  const pendingPullRefreshAlertRef = useRef<RefreshResultAlert | null>(null);
  // [문법] `ReturnType<typeof setTimeout>`은 `setTimeout`이 돌려주는 값의 type을 직접 가져옵니다.
  // 환경마다 timer 값의 type이 달라도 맞춰 줍니다.
  // [역할] `pullRefreshAlertTimerRef`는 예약된 iOS 결과 Alert timer를 취소할 수 있도록 기억합니다.
  const pullRefreshAlertTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  // ===============================================================================================

  // ======================================= Query lifecycle =======================================

  // [라이브러리] 이 `useEffect`는 시작할 때 할 일 없이 정리 함수만 등록합니다. component가 사라질 때 남아 있는 timer를 취소합니다.
  // [역할] 바깥 `useEffect` callback은 component가 사라질 때 실행할 timer 정리 함수를 등록합니다.
  // [역할] 안쪽 정리 callback은 화면이 사라진 뒤 늦은 iOS Alert가 뜨지 않도록 남은 timer를 취소합니다.
  useEffect(() => () => {
    // 화면이 사라진 뒤 늦은 Alert가 뜨지 않도록 iOS용 timer를 취소합니다.
    if (pullRefreshAlertTimerRef.current !== null) {
      clearTimeout(pullRefreshAlertTimerRef.current);
    }
    // [문법] 빈 dependency 배열 `[]`은 이 effect를 component가 만들어질 때 한 번만 등록한다는 뜻입니다.
  }, []);

  // active가 처음 true가 되면 사용자가 이 탭을 방문했다고 기록합니다.
  // [역할] 이 `useEffect` callback은 탭이 보이는 첫 순간을 방문 여부 ref에 기록합니다.
  useEffect(() => {
    if (active) {
      // [FLOW-07 / 4-C단계] active commit 뒤 이 effect가 자동 실행되어 최초 방문 ref를 true로 남기고 bridge refetch gate를 엽니다.
      // 한 번 본 뒤부터는 bridge의 `reloadOtherTabs`가 이 탭의 사용자를 다시 요청할 수 있습니다.
      hasActivatedRef.current = true;
    }
  }, [active]);

  // 첫 요청이 끝났고 탭도 보이는지 함께 확인합니다. 조건이 맞으면 첫 결과를 한 번만 Alert로 알립니다.
  // [역할] 이 `useEffect` callback은 첫 사용자 요청이 끝난 뒤 성공 또는 실패 Alert를 한 번만 보여 줍니다.
  useEffect(() => {
    // [FLOW-07 / 10단계] Query result가 바뀐 commit 뒤 이 effect가 자동 실행되어 최초 active 결과를 한 번 알릴지 검사합니다.
    if (
      !active ||
      !usersQuery.isFetched ||
      handledInitialResultRef.current
    ) {
      // 탭이 숨겨졌거나 요청 중이거나 이미 알렸다면 아무 Alert도 띄우지 않습니다.
      return;
    }

    handledInitialResultRef.current = true;

    // 탭을 처음 열어 받은 결과만 자동으로 알려 줍니다. 그다음 결과는 사용자가 다시 불러오기를 시작했을 때만 알려 줍니다.
    if (usersQuery.isError) {
      // [FLOW-07 / 11-A단계] 최초 error branch는 cache의 Error message로 실패 Alert를 표시합니다.
      // 실패했다면 Query가 정리해 둔 Error 문장을 첫 실패 Alert에 보여 줍니다.
      Alert.alert("사용자 조회 실패", usersQuery.error.message);
    } else {
      // [FLOW-07 / 11-B단계] 최초 success branch는 완료 Alert를 표시하고 같은 결과의 중복 Alert를 막습니다.
      Alert.alert("사용자 조회 완료", "사용자 목록을 불러왔습니다.");
    }
  // [문법] dependency 배열에는 이 effect가 읽는 active와 Query 상태를 모두 넣습니다. 이 가운데 값이 바뀌면 조건을 다시 확인합니다.
  }, [active, usersQuery.error, usersQuery.isError, usersQuery.isFetched]);

  // ===============================================================================================

  // ===================================== 다시 불러오기 함수 ======================================

  // [라이브러리] `useCallback`으로 같은 Alert 함수를 이어서 씁니다. 실행 순간의 손동작과 대기 값은 ref에서 최신 값으로 읽습니다.
  // [역할] `showPullRefreshResultAlert`는 iOS 손동작이 끝난 뒤 결과 Alert를 한 번만 예약합니다.
  const showPullRefreshResultAlert = useCallback((
    resultAlert: RefreshResultAlert,
  ) => {
    // [FLOW-07 / 15-B단계] iOS pull 결과 branch는 현재 drag 여부를 확인하려고 이 helper에 들어옵니다.
    if (isDraggingRef.current) {
      // [FLOW-07 / 16-A단계] request가 drag보다 먼저 끝났으면 결과를 ref에 보류하고 `onScrollEndDrag` event를 기다립니다.
      // 아직 당기는 중이면 결과만 저장합니다. timer와 Alert는 손을 놓기 전에는 시작하지 않습니다.
      pendingPullRefreshAlertRef.current = resultAlert;
      return;
    }

    if (pullRefreshAlertTimerRef.current !== null) {
      // 먼저 예약한 Alert timer가 있으면 취소합니다. 새 결과와 이전 결과가 연달아 뜨지 않게 합니다.
      clearTimeout(pullRefreshAlertTimerRef.current);
    }

    // timer가 끝나면 저장해 둔 결과와 timer 값을 먼저 비웁니다. 다음 새로 고침도 새 Alert를 예약할 수 있게 합니다.
    // [역할] timer callback은 대기값을 비운 뒤 저장해 둔 새로 고침 결과 Alert를 보여 줍니다.
    // [FLOW-07 / 16-B단계] 이미 손을 놓은 branch는 300ms timer를 예약해 native gesture 정리 뒤 Alert를 실행하게 합니다.
    pullRefreshAlertTimerRef.current = setTimeout(() => {
      // [FLOW-07 / 18단계] timer callback이 보류값과 timer ref를 비운 뒤 iOS 결과 Alert를 실제로 표시합니다.
      pendingPullRefreshAlertRef.current = null;
      pullRefreshAlertTimerRef.current = null;
      Alert.alert(resultAlert.title, resultAlert.message);
    }, IOS_PULL_REFRESH_ALERT_DELAY_MS);
  }, []);

  // [역할] `refetch`는 Query를 다시 요청하고 필요하면 즉시 또는 iOS 손동작 뒤 결과를 알려 줍니다.
  // [문법] parameter 두 개에 default 값을 두어 같은 함수를 세 방식으로 부릅니다. 단순 재요청, 결과 안내, iOS용 늦은 안내에 함께 씁니다.
  const refetch = useCallback(async (
    showResultAlert = false,
    deferUntilPullGestureEnds = false,
  ) => {
    // [FLOW-07 / 13단계] 네 refresh 입력 branch가 이 함수로 합류하고 `usersQuery.refetch()` Promise의 새 결과를 await합니다.
    if (showResultAlert) {
      handledInitialResultRef.current = true;
    }

    const result = await usersQuery.refetch();

    if (!showResultAlert) {
      // showResultAlert가 false이면 Query가 보관한 값만 새로 바꾸고 Alert는 띄우지 않습니다.
      return;
    }

    // [문법] ternary `조건 ? 실패값 : 성공값`으로 `isError`에 맞는 Alert 내용을 하나 고릅니다.
    // [FLOW-07 / 14단계] awaited refetch result를 success/error Alert 객체로 바꾸고 platform·gesture 표시 branch를 선택합니다.
    const resultAlert = result.isError
      ? {
          title: "사용자 조회 실패",
          message: result.error.message,
        }
      : {
          title: "사용자 조회 완료",
          message: "사용자 목록을 새로 불러왔습니다.",
        };

    if (deferUntilPullGestureEnds) {
      // iOS에서 당겨서 새로 고침한 경우에만 손을 놓았는지 확인한 뒤 Alert를 띄웁니다.
      showPullRefreshResultAlert(resultAlert);
    } else {
      // [FLOW-07 / 15-A단계] 일반 retry·재선택과 Android pull branch는 await 직후 결과 Alert를 바로 표시합니다.
      Alert.alert(resultAlert.title, resultAlert.message);
    }
  // [문법] 이 callback 안에서 `usersQuery.refetch`와 `showRefreshResult`를 쓰므로 dependency 배열에도 둘을 넣습니다.
  }, [showPullRefreshResultAlert, usersQuery]);

  // bridge가 다른 탭을 새로 고칠 때 쓰는 함수입니다. 사용자가 아직 한 번도 열지 않은 이 탭은 요청하지 않습니다.
  // [역할] `refetchIfActivated`는 방문한 적이 있는 탭에서만 공통 `refetch`를 실행합니다.
  const refetchIfActivated = useCallback(async (
    showResultAlert = false,
  ) => {
    // [FLOW-07 / 12-D단계] bridge refresh는 이 gate를 호출하고 방문 ref가 false이면 종료, true이면 공통 `refetch`로 진행합니다.
    // 다른 WebView의 `reloadOtherTabs` 때문에 보지 않은 네이티브 탭의 첫 API 요청이 시작되는 일을 막습니다.
    if (!hasActivatedRef.current) {
      return;
    }

    await refetch(showResultAlert);
  }, [refetch]);

  // ===============================================================================================

  // ===================================== DemoShell 공개 명령 =====================================

  // [라이브러리] `useImperativeHandle`은 DemoShell의 ref에 위의 다시 불러오기 함수 두 개만 넣어 줍니다.
  // [역할] `useImperativeHandle` factory는 DemoShell이 사용할 두 다시 요청 명령 객체를 만듭니다.
  useImperativeHandle(
    forwardedRef,
    // [FLOW-02 / 4-B단계] React commit 시 `useImperativeHandle`이 native 탭의 두 Query 명령을 `nativeUsersRef`에 저장합니다.
    () => ({ refetch, refetchIfActivated }),
    [refetch, refetchIfActivated],
  );

  // ===============================================================================================

  // ==================================== scroll과 화면 helper =====================================

  // [역할] `handleScroll`은 현재 목록 위치와 손동작 시작 위치로 방향을 구해 DemoShell에 알립니다.
  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ): void => {
    // [FLOW-08 / 1-B단계] FlatList가 native scroll event를 전달하면 이 handler가 drag 시작 offset과 현재 offset을 helper에 보냅니다.
    // [문법] `NativeSyntheticEvent<NativeScrollEvent>`는 event에 들어 있을 값의 모양을 정합니다.
    // 그래서 TypeScript는 `nativeEvent.contentOffset`이 있다는 것을 알 수 있습니다.
    const currentOffset = event.nativeEvent.contentOffset.y;
    const direction = getScrollDirection(
      scrollStartOffsetRef.current,
      currentOffset,
    );

    if (direction) {
      // [FLOW-08 / 3-B단계] helper가 방향을 반환한 경우에만 native 탭도 `onScrollDirection(direction)`을 호출합니다.
      onScrollDirection(direction);
    }
  };

  // loading 화면과 오류 화면도 하단 탭 막대에 가리지 않도록 아래 여백을 남깁니다.
  // [역할] `centeredContentStyle`은 상태 화면의 아래쪽에 하단 탭 높이를 포함한 여백을 더합니다.
  const centeredContentStyle = [
    styles.centered,
    { paddingBottom: bottomContentInset + 24 },
  ];

  // ===============================================================================================

  // ======================================= Query 화면 출력 =======================================

  // [역할] `renderContent`는 Query 상태에 맞는 loading·오류·빈 목록·사용자 목록 중 하나를 만듭니다.
  const renderContent = () => {
    // [FLOW-07 / 9단계] Query observer가 알린 state로 React가 다시 render하고 pending·error·empty·list branch 하나를 선택합니다.
    // [FLOW-09 / 9-C단계] 수동 refetch 결과가 Query cache에 반영된 뒤에만 이 branch가 error 또는 새 data UI로 바뀝니다.
    // [문법] 각 early return은 해당 화면을 돌려준 뒤 함수를 바로 끝냅니다. 여러 상태 화면이 한꺼번에 겹치지 않습니다.
    if (usersQuery.isPending) {
      return (
        <View
          accessibilityLabel="사용자 목록을 불러오는 중"
          accessibilityRole="progressbar"
          style={centeredContentStyle}
        >
          <ActivityIndicator size="large" />
          <Text style={styles.statusText}>사용자 목록을 불러오고 있습니다.</Text>
        </View>
      );
    }

    if (usersQuery.isError) {
      // [FLOW-09 / 6-C단계] Query error는 network banner와 별도 cache state로 유지되어 reconnect만으로 사라지지 않습니다.
      return (
        <View accessibilityRole="alert" style={centeredContentStyle}>
          <Ionicons color="#DC2626" name="alert-circle-outline" size={42} />
          <Text style={styles.errorTitle}>사용자 목록을 불러오지 못했습니다.</Text>
          <Text style={styles.errorMessage}>{usersQuery.error.message}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              // [FLOW-07 / 12-A단계] error button press callback은 `refetch(true)`를 호출해 공통 refresh path를 시작합니다.
              // [FLOW-09 / 8-C단계] native Query도 reconnect가 아니라 이 명시적 press에서 새 request를 시작합니다.
              // [역할] 오류 화면의 `onPress` callback은 사용자 요청을 다시 보내고 완료 결과도 알려 줍니다.
              // [문법] 앞의 `void`는 Pressable의 함수가 Promise를 밖으로 돌려주지 않는다는 뜻입니다. `refetchUsers`의 비동기 작업은 그대로 시작합니다.
              void refetch(true);
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </Pressable>
        </View>
      );
    }

    // [라이브러리] `FlatList`는 data의 각 사용자를 한 줄씩 보여 줍니다. 당겨서 새로 고침과 스크롤 event도 callback으로 알려 줍니다.
    // `keyExtractor`는 숫자인 사용자 id를 React가 목록 항목을 구별할 문자열 key로 바꿉니다.
    return (
      <FlatList
        data={usersQuery.data}
        // [역할] `keyExtractor` callback은 사용자 숫자 id를 React가 구별할 문자열 key로 바꿉니다.
        keyExtractor={(item) => String(item.id)}
        // [역할] `renderItem` callback은 사용자 한 명을 `UserRow` component로 바꿉니다.
        renderItem={({ item }) => <UserRow user={item} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomContentInset + 14 },
          usersQuery.data.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons color="#64748B" name="people-outline" size={42} />
            <Text style={styles.statusText}>표시할 사용자가 없습니다.</Text>
          </View>
        }
        // [역할] `ItemSeparatorComponent` callback은 사용자 줄 사이에 둘 빈 간격 View를 만듭니다.
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshing={usersQuery.isRefetching}
        onRefresh={() => {
          // [FLOW-07 / 12-C단계] 사용자가 pull-to-refresh를 하면 FlatList가 이 callback을 호출해 platform별 Alert 옵션과 함께 `refetch`를 시작합니다.
          // [역할] `onRefresh` callback은 pull-to-refresh 요청을 시작하고 운영체제에 맞는 Alert 시점을 선택합니다.
          // iOS에서는 손을 놓은 뒤 Alert를 띄우고, Android에서는 다시 불러오기가 끝나면 바로 띄웁니다.
          void refetch(true, Platform.OS === "ios");
        }}
        onScrollBeginDrag={(event) => {
          // [역할] `onScrollBeginDrag` callback은 손동작 시작 여부와 시작 위치를 ref에 기록합니다.
          // 당기기 시작한 세로 위치를 저장합니다. 이어지는 `onScroll`에서 움직인 방향을 계산할 기준입니다.
          isDraggingRef.current = true;
          scrollStartOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        onScrollEndDrag={() => {
          // [FLOW-07 / 17단계] iOS에서 손을 놓으면 이 callback이 자동 실행되고, 먼저 끝난 request의 보류 결과가 있으면 stage 15-B helper로 되돌립니다.
          // [역할] `onScrollEndDrag` callback은 손을 놓았다고 기록하고 기다리던 iOS 결과 Alert를 예약합니다.
          // 손을 놓았다고 먼저 기록합니다. 기다리던 결과가 있으면 300ms 뒤 Alert를 띄우도록 예약합니다.
          isDraggingRef.current = false;

          if (pendingPullRefreshAlertRef.current !== null) {
            showPullRefreshResultAlert(
              pendingPullRefreshAlertRef.current,
            );
          }
        }}
        onScroll={handleScroll}
        scrollEventThrottle={100}
      />
    );
  };

  // ===============================================================================================

  // ======================================== tab 화면 출력 ========================================

  // [역할] `NativeUsersScreen`의 return은 component를 유지한 채 active 값으로 표시·입력만 전환합니다.
  // 다른 탭으로 가도 이 component와 Query 연결을 없애지 않고 화면만 숨깁니다. 받아 둔 사용자와 방문 여부를 그대로 유지합니다.
  return (
    // [FLOW-02 / 5-B단계] React는 inactive native 탭도 unmount하지 않고 wrapper의 표시·입력·접근성만 바꿉니다.
    <View
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? "auto" : "no-hide-descendants"}
      pointerEvents={active ? "auto" : "none"}
      style={[styles.container, !active && styles.hidden]}
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          사용자 목록
        </Text>
        <Text style={styles.headerDescription}>
          JSONPlaceholder 공개 API에서 가져온 데이터입니다.
        </Text>
      </View>
      <View style={styles.content}>{renderContent()}</View>
      {/* [FLOW-07 / 19단계] 종료: 화면은 최신 Query cache branch를 표시하고 다음 명시적 refresh 또는 active 변화까지 observer를 유지합니다. */}
    </View>
  );

  // ===============================================================================================

});

// =================================================================================================

// ========================================== 화면 style ===========================================

// 아래 style은 숨긴 탭, 제목, 목록, 상태 화면의 위치와 모양만 정합니다. Query와 손동작 관련 값은 위 Hook과 ref가 관리합니다.
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F8FAFC",
  },
  hidden: {
    display: "none",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "800",
  },
  headerDescription: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  statusText: {
    marginTop: 12,
    color: "#475569",
    fontSize: 15,
    textAlign: "center",
  },
  errorTitle: {
    marginTop: 12,
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  errorMessage: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: "#4F46E5",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  userRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
  },
  avatarText: {
    color: "#4338CA",
    fontSize: 16,
    fontWeight: "800",
  },
  userText: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
  userEmail: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 14,
  },
  separator: {
    height: 10,
  },
});

// =================================================================================================
