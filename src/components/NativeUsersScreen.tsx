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

import { useUsersQuery } from "@/src/api/users";
import type { User } from "@/src/types/user";
import {
  getScrollDirection,
  type ScrollDirection,
} from "@/src/utils/scroll-direction";

export type NativeUsersScreenHandle = {
  refetch: (showResultAlert?: boolean) => Promise<void>;
  refetchIfActivated: (showResultAlert?: boolean) => Promise<void>;
};

type NativeUsersScreenProps = {
  active: boolean;
  bottomContentInset: number;
  onScrollDirection: (direction: ScrollDirection) => void;
};

type RefreshResultAlert = {
  title: string;
  message: string;
};

const IOS_PULL_REFRESH_ALERT_DELAY_MS = 300;

function UserRow({ user }: { user: User }) {
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

export const NativeUsersScreen = forwardRef<
  NativeUsersScreenHandle,
  NativeUsersScreenProps
>(function NativeUsersScreen(
  { active, bottomContentInset, onScrollDirection },
  forwardedRef,
) {
  const usersQuery = useUsersQuery(active);
  const scrollStartOffsetRef = useRef(0);
  const handledInitialResultRef = useRef(false);
  const hasActivatedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const pendingPullRefreshAlertRef = useRef<RefreshResultAlert | null>(null);
  const pullRefreshAlertTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(() => () => {
    if (pullRefreshAlertTimerRef.current !== null) {
      clearTimeout(pullRefreshAlertTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (active) {
      hasActivatedRef.current = true;
    }
  }, [active]);

  useEffect(() => {
    if (
      !active ||
      !usersQuery.isFetched ||
      handledInitialResultRef.current
    ) {
      return;
    }

    handledInitialResultRef.current = true;

    if (usersQuery.isError) {
      Alert.alert("사용자 조회 실패", usersQuery.error.message);
    } else {
      Alert.alert("사용자 조회 완료", "사용자 목록을 불러왔습니다.");
    }
  }, [active, usersQuery.error, usersQuery.isError, usersQuery.isFetched]);

  const showPullRefreshResultAlert = useCallback((
    resultAlert: RefreshResultAlert,
  ) => {
    if (isDraggingRef.current) {
      pendingPullRefreshAlertRef.current = resultAlert;
      return;
    }

    if (pullRefreshAlertTimerRef.current !== null) {
      clearTimeout(pullRefreshAlertTimerRef.current);
    }

    pullRefreshAlertTimerRef.current = setTimeout(() => {
      pendingPullRefreshAlertRef.current = null;
      pullRefreshAlertTimerRef.current = null;
      Alert.alert(resultAlert.title, resultAlert.message);
    }, IOS_PULL_REFRESH_ALERT_DELAY_MS);
  }, []);

  const refetch = useCallback(async (
    showResultAlert = false,
    deferUntilPullGestureEnds = false,
  ) => {
    if (showResultAlert) {
      handledInitialResultRef.current = true;
    }

    const result = await usersQuery.refetch();

    if (!showResultAlert) {
      return;
    }

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
      showPullRefreshResultAlert(resultAlert);
    } else {
      Alert.alert(resultAlert.title, resultAlert.message);
    }
  }, [showPullRefreshResultAlert, usersQuery]);

  const refetchIfActivated = useCallback(async (
    showResultAlert = false,
  ) => {
    if (!hasActivatedRef.current) {
      return;
    }

    await refetch(showResultAlert);
  }, [refetch]);

  useImperativeHandle(
    forwardedRef,
    () => ({ refetch, refetchIfActivated }),
    [refetch, refetchIfActivated],
  );

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ): void => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const direction = getScrollDirection(
      scrollStartOffsetRef.current,
      currentOffset,
    );

    if (direction) {
      onScrollDirection(direction);
    }
  };

  const centeredContentStyle = [
    styles.centered,
    { paddingBottom: bottomContentInset + 24 },
  ];

  const renderContent = () => {
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
      return (
        <View accessibilityRole="alert" style={centeredContentStyle}>
          <Ionicons color="#DC2626" name="alert-circle-outline" size={42} />
          <Text style={styles.errorTitle}>사용자 목록을 불러오지 못했습니다.</Text>
          <Text style={styles.errorMessage}>{usersQuery.error.message}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void refetch(true);
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <FlatList
        data={usersQuery.data}
        keyExtractor={(item) => String(item.id)}
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
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshing={usersQuery.isRefetching}
        onRefresh={() => {
          void refetch(true, Platform.OS === "ios");
        }}
        onScrollBeginDrag={(event) => {
          isDraggingRef.current = true;
          scrollStartOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        onScrollEndDrag={() => {
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

  return (
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
    </View>
  );
});

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
