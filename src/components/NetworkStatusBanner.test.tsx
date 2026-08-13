// [파일 역할] network banner가 offline boolean에 따라 unmount/mount되고 alert semantics를 제공하는지 검증합니다.
// [검증 경계] expo-network를 사용하지 않으므로 실제 연결 단절·복원 감지나 request 실패 여부는 증명하지 않습니다.
import { render, screen } from "@testing-library/react-native";

import { NetworkStatusBanner } from "@/src/components/NetworkStatusBanner";

describe("NetworkStatusBanner", () => {
  it("오프라인일 때만 지속형 안내를 표시한다", async () => {
    const { rerender } = await render(
      <NetworkStatusBanner visible={false} />,
    );

    expect(
      screen.queryByText("네트워크에 연결되어 있지 않습니다."),
    ).toBeNull();

    await rerender(<NetworkStatusBanner visible />);

    // 표시 문구와 accessibility role을 함께 확인해 시각적 존재만 검사하는 test가 되지 않게 합니다.
    expect(screen.getByRole("alert")).toBeOnTheScreen();
    expect(
      screen.getByText("네트워크에 연결되어 있지 않습니다."),
    ).toBeOnTheScreen();
  });
});
