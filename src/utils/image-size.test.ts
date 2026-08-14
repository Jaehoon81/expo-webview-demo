// [파일 역할] 사진 크기를 줄일 때 작은 사진은 그대로 두고, 큰 사진은 긴 쪽만 최대 크기로 줄이는지 확인합니다. 잘못된 가로·세로 값도 검사합니다.
// [검증 경계] 숫자 계산만 확인합니다. 실제 이미지 읽기, 화면 비율, PNG·base64 만들기, 메모리 사용량은 확인하지 않습니다.
// [라이브러리] Jest의 값 비교와 Error 검사만 사용합니다. Expo ImageManipulator의 실제 휴대폰 기능은 불러오지 않습니다.

// ========================================== 외부 의존성 ==========================================

import { getConstrainedImageSize } from "@/src/utils/image-size";

// =================================================================================================

// ========================================== test cases ===========================================

// [역할] `describe` callback은 사진 크기 제한 계산의 정상·오류 경우를 한 묶음으로 실행합니다.
describe("getConstrainedImageSize", () => {
  // [역할] 이 test callback은 최대 크기보다 작은 사진에 resize 값이 생기지 않는지 확인합니다.
  it("이미 작은 이미지는 resize하지 않는다", () => {
    expect(getConstrainedImageSize(800, 600)).toEqual({
      width: null,
      height: null,
    });
  });

  // [역할] 이 test callback은 가로·세로로 긴 사진에서 긴 쪽 하나만 최대값으로 제한되는지 확인합니다.
  it("가로와 세로 이미지의 긴 변만 1000으로 제한한다", () => {
    // 긴 쪽 크기 하나만 정하고 다른 쪽은 null로 둡니다. ImageManipulator가 원래 가로세로 비율에 맞춰 나머지를 계산하게 합니다.
    // 가로로 긴 사진과 세로로 긴 사진을 각각 넣어 ternary의 두 경우를 모두 확인합니다.
    expect(getConstrainedImageSize(4000, 3000)).toEqual({
      width: 1_000,
      height: null,
    });
    expect(getConstrainedImageSize(2000, 3000)).toEqual({
      width: null,
      height: 1_000,
    });
  });

  // [역할] 이 test callback은 0 이하의 사진 크기가 오류로 거부되는지 확인합니다.
  it("잘못된 크기를 거부한다", () => {
    // [문법] Error가 날 함수 호출을 `() => ...`로 감싸 `toThrow`에 줍니다. Jest가 Error를 잡아 기대한 실패인지 판단합니다.
    // [역할] `expect` wrapper callback은 잘못된 크기로 계산 함수를 불러 실제 Error를 발생시킵니다.
    expect(() => getConstrainedImageSize(0, 100)).toThrow();
  });
});

// =================================================================================================
