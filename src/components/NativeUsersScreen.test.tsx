// [파일 역할] 사용자 탭을 처음 열 때의 요청, ref로 부르는 다시 요청, 오류 화면 여백, iOS·Android 새로 고침 안내 시점을 확인합니다.
// [검증 경계] `useUsersQuery`와 Alert를 가짜로 바꿉니다.
// 실제 Axios 요청, Zod 검사, TanStack Query 저장, 휴대폰에서 당기는 손동작은 확인하지 않습니다.
// [라이브러리] Testing Library의 `act`, event, query로 화면 변화를 확인합니다.
// Jest로 운영체제 값과 Alert를 바꿔 JavaScript에서 나뉘는 경우를 검사합니다.

// ========================================== 외부 의존성 ==========================================

import { createRef, type RefObject } from "react";
import { Alert, Platform } from "react-native";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import type { UseQueryResult } from "@tanstack/react-query";

import { useUsersQuery } from "@/src/api/users";
import {
  NativeUsersScreen,
  type NativeUsersScreenHandle,
} from "@/src/components/NativeUsersScreen";
import type { User } from "@/src/types/user";

// =================================================================================================

// ====================================== test mock과 helper =======================================

// [역할] mock factory callback은 실제 사용자 API와 Query 대신 test가 결과를 정할 가짜 Hook을 내보냅니다.
jest.mock("@/src/api/users", () => ({
  // 화면이 Query 결과를 어떻게 사용하는지만 보려고 실제 인터넷 요청과 Query 실행을 모두 가짜 Hook으로 바꿉니다.
  useUsersQuery: jest.fn(),
}));

// [라이브러리] `jest.mocked`는 import한 Hook을 Jest mock으로 다루면서 원래 parameter와 반환 type도 유지합니다.
const mockedUseUsersQuery = jest.mocked(useUsersQuery);
// 성공 화면과 사용자 한 줄을 확인할 때 함께 쓰는 고정 사용자 목록입니다. test에서는 이 값을 바꾸지 않습니다.
const users: User[] = [
  // 성공한 사용자 목록에 필요한 id, name, email만 넣습니다.
  {
    id: 1,
    name: "Leanne Graham",
    email: "leanne@example.com",
  },
];

// [역할] `createUsersQuery`는 성공 결과를 기본으로 두고 각 test가 필요한 Query 상태만 덮어쓸 수 있게 합니다.
function createUsersQuery(
  // [문법] `Partial`은 `UseQueryResult`의 모든 field를 요구하지 않고, 이 test가 바꿀 값만 선택해서 받게 합니다.
  overrides: Partial<UseQueryResult<User[], Error>> = {},
): UseQueryResult<User[], Error> {
  // 먼저 성공한 Query 결과를 기본값으로 만듭니다. 각 test는 loading, error, refetch처럼 필요한 값만 바꿉니다.
  // [문법] 마지막의 object spread `...overrides`가 앞의 기본값과 이름이 같은 property를 덮어씁니다.
  return {
    data: users,
    error: null,
    isError: false,
    isFetched: true,
    isPending: false,
    isRefetching: false,
    refetch: jest.fn(),
    ...overrides,
  // 실제 Query 결과의 사용하지 않는 함수까지 만들지는 않습니다. test 안에서만 `unknown`을 거쳐 필요한 type으로 바꿉니다.
  } as unknown as UseQueryResult<User[], Error>;
}

// 여러 test가 반복하는 화면 만들기를 이 함수에 모읍니다. 중요한 입력인 active, ref, 아래 여백은 parameter로 그대로 받습니다.
// [역할] `renderScreen`은 공통 props와 선택 입력으로 `NativeUsersScreen` test 화면을 만듭니다.
function renderScreen(
  active: boolean,
  ref?: RefObject<NativeUsersScreenHandle | null>,
  bottomContentInset = 0,
) {
  return render(
    <NativeUsersScreen
      active={active}
      bottomContentInset={bottomContentInset}
      onScrollDirection={jest.fn()}
      ref={ref}
    />,
  );
}

// =================================================================================================

// ========================================== test cases ===========================================

// [역할] `describe` callback은 사용자 탭의 활성화·refetch·오류·platform별 새로 고침 test를 한 묶음으로 실행합니다.
describe("NativeUsersScreen", () => {
  // [역할] `beforeEach` callback은 각 test 전에 Query Hook mock과 함수 호출 기록을 지웁니다.
  beforeEach(() => {
    // 각 test 전에 가짜 Hook 동작과 함수 호출 기록을 비웁니다.
    jest.clearAllMocks();
  });

  // [역할] `afterEach` callback은 test가 바꾼 Alert와 Platform 값을 원래 상태로 되돌립니다.
  afterEach(() => {
    // [라이브러리] test에서 바꾼 Alert와 Platform 값을 끝난 뒤 원래대로 되돌립니다.
    jest.restoreAllMocks();
  });

  // [역할] 이 test callback은 비활성 탭에서는 첫 결과를 알리지 않고 처음 활성화될 때 한 번만 알리는지 확인합니다.
  it("비활성 상태의 조회 결과를 소비하지 않고 최초 진입 시 알린다", async () => {
    // 실제 Alert는 띄우지 않고 어떤 제목과 문장으로 언제 불렸는지만 기록합니다.
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    mockedUseUsersQuery.mockReturnValue(createUsersQuery());

    const { rerender } = await renderScreen(false);

    expect(alertSpy).not.toHaveBeenCalled();

    // 같은 component를 유지한 채 active만 true로 바꿉니다. 실제 앱처럼 탭을 없애지 않고 처음 보여 주는 상황입니다.
    await rerender(
      <NativeUsersScreen
        active
        bottomContentInset={0}
        onScrollDirection={jest.fn()}
      />,
    );

    // [라이브러리] `waitFor`는 active 변경 뒤 effect가 실행될 때까지 기다리며 Alert 확인을 다시 시도합니다.
    // [역할] `waitFor` callback은 첫 성공 Alert가 effect 실행 뒤 나타났는지 반복 확인합니다.
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "사용자 조회 완료",
        "사용자 목록을 불러왔습니다.",
      );
    });
  });

  // [역할] 이 test callback은 방문 전 조건부 refetch는 건너뛰고 방문 뒤에는 요청과 결과 안내를 실행하는지 확인합니다.
  it("최초 진입 전에는 조건부 refetch를 건너뛰고 진입 후에는 결과를 알린다", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    const refetch = jest.fn().mockResolvedValue({
      error: null,
      isError: false,
    });
    mockedUseUsersQuery.mockReturnValue(
      createUsersQuery({ isFetched: false, refetch }),
    );
    // [라이브러리] `createRef`로 실제 DemoShell처럼 사용자 화면의 다시 요청 명령을 부를 수 있게 합니다.
    const screenRef = createRef<NativeUsersScreenHandle>();

    const { rerender } = await renderScreen(false, screenRef);

    // `act`는 ref 명령 때문에 생긴 React와 Query 처리가 끝난 뒤 결과를 확인하게 합니다.
    // [역할] 첫 `act` callback은 방문 전 공개 refetch 명령을 실행해 실제 Query 요청이 생기지 않는지 확인하게 합니다.
    await act(async () => {
      // active가 false인 채 처음 만들어졌다면 ref 명령을 불러도 실제 Query의 `refetch`는 실행하지 않아야 합니다.
      await screenRef.current?.refetchIfActivated(true);
    });
    expect(refetch).not.toHaveBeenCalled();

    await rerender(
      <NativeUsersScreen
        active
        bottomContentInset={0}
        onScrollDirection={jest.fn()}
        ref={screenRef}
      />,
    );

    // [역할] 둘째 `act` callback은 활성화 뒤 같은 공개 refetch 명령을 실행해 Query 요청을 시작합니다.
    await act(async () => {
      await screenRef.current?.refetchIfActivated(true);
    });

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(
      "사용자 조회 완료",
      "사용자 목록을 새로 불러왔습니다.",
    );
  });

  // [역할] 이 test callback은 오류 화면 여백과 다시 시도 뒤 성공 Alert를 함께 확인합니다.
  it("오류 화면의 다시 시도 결과를 팝업으로 알린다", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    const refetch = jest.fn().mockResolvedValue({
      error: null,
      isError: false,
    });
    mockedUseUsersQuery.mockReturnValue(
      createUsersQuery({
        data: undefined,
        error: new Error("Network Error"),
        isError: true,
        isFetched: false,
        refetch,
      }),
    );

    await renderScreen(true, undefined, 80);

    // 정해 둔 아래 여백이 오류 화면의 padding에 들어갔는지, 화면에 나온 style 값으로 확인합니다.
    expect(
      screen.getByText("사용자 목록을 불러오지 못했습니다.").parent,
    ).toHaveStyle({ paddingBottom: 104 });

    await fireEvent.press(
      screen.getByRole("button", { name: "다시 시도" }),
    );

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(
      "사용자 조회 완료",
      "사용자 목록을 새로 불러왔습니다.",
    );
  });

  // [역할] 이 test callback은 iOS pull-to-refresh 결과가 손을 놓기 전에는 보이지 않고 이후에만 나타나는지 확인합니다.
  it("iOS pull-to-refresh 결과는 손을 놓은 뒤 알린다", async () => {
    // Platform 값만 iOS로 바꿉니다. 실제 iOS 손동작이나 `RefreshControl`을 실행하지는 않습니다.
    // [라이브러리] Jest가 이 test가 실행되는 동안에만 `Platform.OS`를 iOS로 바꿉니다.
    jest.replaceProperty(Platform, "OS", "ios");
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    const refetch = jest.fn().mockResolvedValue({
      error: null,
      isError: false,
    });
    mockedUseUsersQuery.mockReturnValue(
      createUsersQuery({ isFetched: false, refetch }),
    );

    const view = await renderScreen(true);
    // role이나 글자로 찾기 어려운 `FlatList`는 화면에 전달된 props의 함수 조합으로 찾습니다.
    const refreshableLists = view.container.queryAll(
      // component 이름 대신 실제 `FlatList`에 있는 callback 세 개를 모두 가진 항목을 찾습니다.
      // [역할] 첫 query predicate callback은 새로 고침과 drag callback을 모두 가진 `FlatList`만 찾습니다.
      (instance) =>
        typeof instance.props.onRefresh === "function" &&
        typeof instance.props.onScrollBeginDrag === "function" &&
        typeof instance.props.onScrollEndDrag === "function",
    );

    expect(refreshableLists).toHaveLength(1);

    // [문법] 앞에서 항목이 하나라고 확인했으므로 `[list]` 구조 분해로 첫 항목을 꺼냅니다.
    const [list] = refreshableLists;

    // 스크롤 시작, 당겨서 새로 고침, 스크롤 끝 event를 실제 순서대로 직접 부릅니다.
    await fireEvent(list, "scrollBeginDrag", {
      nativeEvent: { contentOffset: { x: 0, y: -80 } },
    });
    await fireEvent(list, "refresh");

    // [역할] 첫 iOS `waitFor` callback은 비동기 Query refetch가 한 번 시작됐는지 확인합니다.
    await waitFor(() => {
      expect(refetch).toHaveBeenCalledTimes(1);
    });
    // 다시 요청이 끝나도 사용자가 아직 당기는 중이면 iOS에서는 Alert가 뜨지 않아야 합니다.
    expect(alertSpy).not.toHaveBeenCalled();

    // 손을 놓는 callback 뒤에만 기다리던 결과 Alert가 뜨는지 확인합니다.
    await fireEvent(list, "scrollEndDrag", {
      nativeEvent: { contentOffset: { x: 0, y: -80 } },
    });

    // [역할] 둘째 iOS `waitFor` callback은 손을 놓은 뒤 대기했던 성공 Alert가 나타났는지 확인합니다.
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "사용자 조회 완료",
        "사용자 목록을 새로 불러왔습니다.",
      );
    });
  });

  // [역할] 이 test callback은 Android pull-to-refresh 결과가 별도 손놓기 지연 없이 바로 안내되는지 확인합니다.
  it("Android pull-to-refresh 결과는 기존처럼 즉시 알린다", async () => {
    // 같은 event 순서를 Android 값으로 실행합니다. iOS와 달리 다시 요청 직후 Alert가 뜨는지 비교합니다.
    jest.replaceProperty(Platform, "OS", "android");
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    const refetch = jest.fn().mockResolvedValue({
      error: null,
      isError: false,
    });
    mockedUseUsersQuery.mockReturnValue(
      createUsersQuery({ isFetched: false, refetch }),
    );

    const view = await renderScreen(true);
    const refreshableLists = view.container.queryAll(
      // [역할] 둘째 query predicate callback은 Android test 화면에서도 새로 고침 가능한 `FlatList`만 찾습니다.
      (instance) =>
        typeof instance.props.onRefresh === "function" &&
        typeof instance.props.onScrollBeginDrag === "function" &&
        typeof instance.props.onScrollEndDrag === "function",
    );

    expect(refreshableLists).toHaveLength(1);

    const [list] = refreshableLists;

    await fireEvent(list, "scrollBeginDrag", {
      nativeEvent: { contentOffset: { x: 0, y: -80 } },
    });
    await fireEvent(list, "refresh");

    // [역할] Android `waitFor` callback은 새로 고침 직후 성공 Alert가 나타났는지 확인합니다.
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "사용자 조회 완료",
        "사용자 목록을 새로 불러왔습니다.",
      );
    });
  });
});

// =================================================================================================
