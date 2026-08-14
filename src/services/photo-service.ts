// [파일 역할] 사진 권한을 확인하고 최대 두 장을 골라 크기를 줄인 뒤 PNG base64 문자열로 돌려줍니다.
// [검증 경계] image-size test는 숫자 계산만 확인합니다. 사진 선택, 권한, 실제 변환은 기기에서 확인해야 합니다.
// [라이브러리] `expo-image-picker`가 기기의 사진 선택 화면을 엽니다.
// ImageManipulator가 크기 변경, 이미지 만들기, PNG 저장을 차례로 처리합니다.

// ========================================== 외부 의존성 ==========================================

import {
  ImageManipulator,
  SaveFormat,
} from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import type { PhotoResult } from "@/src/bridge/types";
import { getConstrainedImageSize } from "@/src/utils/image-size";

// =================================================================================================

// ====================================== 사진 기준값과 권한 =======================================

const MAX_IMAGE_DIMENSION = 1_000;
// 사진 선택 화면과 WebView의 사진 칸이 모두 두 개이므로 결과도 최대 두 장으로 제한합니다.
const MAX_SELECTION = 2;

// [역할] `ensurePhotoPermission`은 사진 보관함 권한을 확인하고 필요할 때만 요청한 뒤 거부를 오류로 알립니다.
async function ensurePhotoPermission(): Promise<void> {
  // 앱을 켤 때 바로 묻지 않고 사용자가 사진 기능을 눌렀을 때만 권한을 확인합니다.
  // [문법] 권한 요청 뒤 새 결과를 같은 변수에 넣어야 하므로 `const`가 아니라 `let`을 사용합니다.
  let permission = await ImagePicker.getMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    // [라이브러리] 아직 권한이 없을 때만 OS 사진 접근 권한 창을 엽니다.
    permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  }

  if (!permission.granted) {
    throw new Error("사진 접근 권한이 거부되었습니다.");
  }
}

// =================================================================================================

// ======================================= 사진 선택과 변환 ========================================

// [역할] `selectPhotoImages`는 최대 두 사진을 고르고 한 장씩 줄여 PNG base64 결과 배열로 돌려줍니다.
export async function selectPhotoImages(): Promise<PhotoResult[]> {
  // [FLOW-05 / 관련 코드] dispatcher가 `getPhotoImages`를 받으면 이 함수를 기다립니다.
  // 성공한 사진 배열이나 발생한 오류는 공통 bridge 응답으로 바뀝니다.
  await ensurePhotoPermission();

  // [라이브러리] 아래 option은 사진만, 여러 장 선택, 최대 두 장, 원본 품질로 OS 선택 화면을 열라는 뜻입니다.
  const selection = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: MAX_SELECTION,
    allowsEditing: false,
    quality: 1,
  });

  // [문법] `?.`는 취소 결과에 assets가 없어도 `.length`를 읽다가 오류가 나지 않게 합니다.
  if (selection.canceled || !selection.assets?.length) {
    // 취소를 빈 성공 결과로 숨기지 않고 Error로 알려 WebView가 사용자에게 안내하게 합니다.
    throw new Error("사진 선택을 취소했습니다.");
  }

  // 변환이 끝난 사진을 선택 순서대로 이 배열에 넣습니다. 함수 호출마다 새 배열을 만듭니다.
  const results: PhotoResult[] = [];

  // [문법] `slice(0, 2)`로 혹시 더 많이 와도 두 장만 남깁니다.
  // `entries()`가 준 `[순번, 사진]` 두 값을 `for...of`에서 각각 index와 asset으로 꺼냅니다.
  for (const [index, asset] of selection.assets
    .slice(0, MAX_SELECTION)
    .entries()) {
    // 원본 너비와 높이로 줄일 크기를 먼저 계산합니다. 실제 이미지 변경은 아래 context가 맡습니다.
    const size = getConstrainedImageSize(
      asset.width,
      asset.height,
      MAX_IMAGE_DIMENSION,
    );
    // [라이브러리] `manipulate`는 이 사진에 할 작업을 담을 context를 만듭니다. 아직 새 파일을 만들지는 않습니다.
    const context = ImageManipulator.manipulate(asset.uri);

    // 큰 사진 두 장을 동시에 처리하지 않고 한 장씩 처리해 메모리를 한꺼번에 많이 쓰지 않게 합니다.
    if (size.width !== null || size.height !== null) {
      // 긴 쪽 한 값만 숫자로 넣어 비율을 유지하는 크기 변경 작업을 추가합니다.
      context.resize(size);
    }

    // [라이브러리] `renderAsync`가 모아 둔 변경 작업을 적용합니다.
    // `saveAsync`는 결과를 PNG 파일로 저장하고 base64 문자열도 함께 만듭니다.
    const renderedImage = await context.renderAsync();
    const savedImage = await renderedImage.saveAsync({
      format: SaveFormat.PNG,
      compress: 1,
      base64: true,
    });

    if (!savedImage.base64) {
      // 사진을 골랐어도 base64 만들기에 실패하면 일부 결과만 보내지 않고 전체 요청을 실패로 처리합니다.
      throw new Error("Image 데이터를 생성하지 못했습니다.");
    }

    // [문법] 배열 순번은 0부터 시작하므로 1을 더해 사진 이름을 1번부터 표시합니다.
    results.push({
      name: `사진앨범 선택 이미지(${index + 1})`,
      base64Image: savedImage.base64,
    });
  }

  // 선택한 사진을 모두 차례로 처리한 뒤 완성된 배열을 dispatcher에 돌려줍니다.
  return results;
}

// =================================================================================================
