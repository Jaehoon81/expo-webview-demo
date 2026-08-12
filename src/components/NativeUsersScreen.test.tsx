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

jest.mock("@/src/api/users", () => ({
  useUsersQuery: jest.fn(),
}));

const mockedUseUsersQuery = jest.mocked(useUsersQuery);
const users: User[] = [
  {
    id: 1,
    name: "Leanne Graham",
    email: "leanne@example.com",
  },
];

function createUsersQuery(
  overrides: Partial<UseQueryResult<User[], Error>> = {},
): UseQueryResult<User[], Error> {
  return {
    data: users,
    error: null,
    isError: false,
    isFetched: true,
    isPending: false,
    isRefetching: false,
    refetch: jest.fn(),
    ...overrides,
  } as unknown as UseQueryResult<User[], Error>;
}

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

describe("NativeUsersScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("비활성 상태의 조회 결과를 소비하지 않고 최초 진입 시 알린다", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    mockedUseUsersQuery.mockReturnValue(createUsersQuery());

    const { rerender } = await renderScreen(false);

    expect(alertSpy).not.toHaveBeenCalled();

    await rerender(
      <NativeUsersScreen
        active
        bottomContentInset={0}
        onScrollDirection={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "사용자 조회 완료",
        "사용자 목록을 불러왔습니다.",
      );
    });
  });

  it("최초 진입 전에는 조건부 refetch를 건너뛰고 진입 후에는 결과를 알린다", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    const refetch = jest.fn().mockResolvedValue({
      error: null,
      isError: false,
    });
    mockedUseUsersQuery.mockReturnValue(
      createUsersQuery({ isFetched: false, refetch }),
    );
    const screenRef = createRef<NativeUsersScreenHandle>();

    const { rerender } = await renderScreen(false, screenRef);

    await act(async () => {
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

    await act(async () => {
      await screenRef.current?.refetchIfActivated(true);
    });

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(
      "사용자 조회 완료",
      "사용자 목록을 새로 불러왔습니다.",
    );
  });

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

  it("iOS pull-to-refresh 결과는 손을 놓은 뒤 알린다", async () => {
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
    const refreshableLists = view.container.queryAll(
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

    await waitFor(() => {
      expect(refetch).toHaveBeenCalledTimes(1);
    });
    expect(alertSpy).not.toHaveBeenCalled();

    await fireEvent(list, "scrollEndDrag", {
      nativeEvent: { contentOffset: { x: 0, y: -80 } },
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "사용자 조회 완료",
        "사용자 목록을 새로 불러왔습니다.",
      );
    });
  });

  it("Android pull-to-refresh 결과는 기존처럼 즉시 알린다", async () => {
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

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "사용자 조회 완료",
        "사용자 목록을 새로 불러왔습니다.",
      );
    });
  });
});
