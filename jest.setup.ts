// [파일 역할] 모든 test가 시작되기 전에 SecureStore를 메모리에서 동작하는 가짜 함수로 바꿉니다.
// [검증 경계] 이 mock은 test가 실행되게 할 뿐입니다. 실제 keychain/keystore 저장이 된다는 뜻은 아닙니다.
// [라이브러리] `jest.mock`은 test에서 `expo-secure-store`를 가져올 때 아래 가짜 객체를 대신 돌려줍니다.
// [문법] `() => ({ ... })`에서 바깥 괄호는 arrow function이 객체를 바로 반환한다는 뜻입니다.

// ===================================== SecureStore test mock =====================================

// [역할] mock factory callback은 test에서 사용할 SecureStore 가짜 함수 묶음을 만들어 돌려줍니다.
jest.mock("expo-secure-store", () => ({
  // 함수 이름과 Promise 반환 모양은 실제 API와 같지만 기기의 저장소에는 접근하지 않습니다.
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// =================================================================================================
