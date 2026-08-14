// [파일 역할] offline 값에 따라 인터넷 연결 안내가 사라지거나 나타나는지 확인합니다. 접근성에서 Alert로 읽히는지도 검사합니다.
// [검증 경계] expo-network는 실행하지 않습니다. 실제 인터넷 끊김과 복원 감지, 개별 웹·API 요청 실패는 확인하지 않습니다.
// [라이브러리] Testing Library의 screen query로 화면의 글자와 접근성 항목을 찾습니다. style로만 숨긴 것이 아니라 실제로 만들어졌는지 확인합니다.

// ========================================== 외부 의존성 ==========================================

import { render, screen } from "@testing-library/react-native";

import { NetworkStatusBanner } from "@/src/components/NetworkStatusBanner";

// =================================================================================================

// ========================================== test cases ===========================================

// [역할] `describe` callback은 offline 안내의 표시 조건과 접근성 정보를 확인하는 test를 실행합니다.
describe("NetworkStatusBanner", () => {
  // [역할] 이 test callback은 visible 값이 false에서 true로 바뀔 때 alert 안내가 나타나는지 확인합니다.
  it("오프라인일 때만 지속형 안내를 표시한다", async () => {
    // 처음 offline이 false일 때 component가 null을 돌려 안내를 만들지 않는지 먼저 확인합니다.
    const { rerender } = await render(
      <NetworkStatusBanner visible={false} />,
    );

    expect(
      screen.queryByText("네트워크에 연결되어 있지 않습니다."),
    ).toBeNull();

    // [문법] boolean JSX 줄임 표현 `visible`은 `visible={true}`와 같습니다. 같은 component를 offline 상태로 다시 그립니다.
    await rerender(<NetworkStatusBanner visible />);

    // 안내 글자와 accessibility role을 함께 확인합니다. 눈에 보이는지만 아니라 화면 읽기 기능이 Alert로 알아보는지도 검사합니다.
    // [라이브러리] `getByRole`은 해당 항목이 없으면 test를 바로 실패시킵니다.
    expect(screen.getByRole("alert")).toBeOnTheScreen();
    expect(
      screen.getByText("네트워크에 연결되어 있지 않습니다."),
    ).toBeOnTheScreen();
  });
});

// =================================================================================================
