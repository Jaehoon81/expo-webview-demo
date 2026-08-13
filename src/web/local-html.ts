// [파일 역할] 첫 WebView에 주입되는 학습용 HTML·CSS·JavaScript와 8개 bridge action 버튼을 한 문서로 제공합니다.
// [FLOW-05] bridge 흐름은 이 문서의 postMessage에서 시작해 Zod/dispatcher/기기 service를 거쳐 calledByNative callback으로 돌아옵니다.
// [FLOW-05 / 1단계] `sendNative`가 uuid·action·선택 params를 JSON 문자열로 만들어 ReactNativeWebView에 전달합니다.
// [주의] 아래 template literal 내부는 실제 WebView payload입니다. 설명용 TypeScript 주석을 문자열 안에 넣거나 escaping을 바꾸지 않습니다.
export const LOCAL_DEMO_HTML = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <meta name="format-detection" content="telephone=no" />
    <title>WebView 데모</title>
    <style>
      :root {
        color-scheme: light;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f8fafc;
        color: #0f172a;
      }
      body {
        margin: 0;
      padding: 20px 16px 120px;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 24px;
      }
      .description {
        margin: 0 0 20px;
        color: #475569;
        line-height: 1.5;
      }
      .card {
        margin-bottom: 16px;
        padding: 16px;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background: #fff;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
      }
      h2 {
        margin: 0 0 12px;
        font-size: 17px;
      }
      a {
        display: block;
        margin: 10px 0;
        color: #4338ca;
      }
      button {
        width: 100%;
        min-height: 48px;
        margin: 5px 0;
        padding: 12px;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        background: #e2e8f0;
        color: #334155;
        font-size: 15px;
        font-weight: 700;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        box-shadow: 0 2px 5px rgba(15, 23, 42, 0.12);
      }
      button:focus-visible {
        outline: 3px solid #0ea5e9;
        outline-offset: 2px;
      }
      .device-actions button {
        border-color: #bae6fd;
        background: #e0f2fe;
        color: #075985;
      }
      .device-actions button:active {
        border-color: #075985;
        background: #075985;
        color: #e0f2fe;
      }
      .tab-actions button {
        border-color: #bbf7d0;
        background: #dcfce7;
        color: #166534;
      }
      .tab-actions button:active {
        border-color: #166534;
        background: #166534;
        color: #dcfce7;
      }
      .photo-actions button {
        border-color: #fed7aa;
        background: #ffedd5;
        color: #9a3412;
      }
      .photo-actions button:active {
        border-color: #9a3412;
        background: #9a3412;
        color: #ffedd5;
      }
      .photo {
        width: 100%;
        height: auto;
        display: none;
        margin-top: 12px;
        border-radius: 8px;
      }
      textarea {
        box-sizing: border-box;
        width: 100%;
        margin-top: 8px;
        padding: 8px;
        resize: none;
      }
    </style>
    <script>
      function getUuidV4() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0;
          var v = c === "x" ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

      function sendNative(action, params, uuid) {
        var request = { uuid: uuid === undefined ? getUuidV4() : uuid, action: action };
        if (params !== undefined) {
          request.params = params;
        }
        window.ReactNativeWebView.postMessage(JSON.stringify(request));
      }

      function openPopupWindow() {
        window.open("https://www.bing.com", "_blank");
      }

      function showMobileType() {
        var userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.indexOf("android") > -1) {
          alert("현재 기기는 Android 타입입니다.");
        } else if (
          userAgent.indexOf("iphone") > -1 ||
          userAgent.indexOf("ipad") > -1 ||
          userAgent.indexOf("ipod") > -1
        ) {
          alert("현재 기기는 iOS 타입입니다.");
        } else {
          alert("현재 기기 타입을 알 수 없습니다.");
        }
      }

      function calledByNative(message) {
        var data = JSON.parse(message);
        console.log("uuid: " + data.uuid);
        console.log("action: " + data.action);
        console.log("result: ", data.result);
        console.log("isError: " + data.isError);

        if (data.isError) {
          alert(data.result);
          return "complete";
        }

        if (data.action === "getDeviceUUID") {
          alert(data.result);
        } else if (data.action === "getPhotoImages") {
          for (var resetIndex = 1; resetIndex <= 2; resetIndex++) {
            var resetImage = document.getElementById("image" + resetIndex);
            var resetName = document.getElementById("photo" + resetIndex + "_name");
            resetImage.removeAttribute("src");
            resetImage.style.display = "none";
            resetName.value = "";
          }

          for (var index = 0; index < data.result.length; index++) {
            var imageData = data.result[index];
            var imageElement = document.getElementById("image" + (index + 1));
            imageElement.src = "data:image/png;base64," + imageData.base64Image;
            imageElement.style.display = "block";

            var textElement = document.getElementById("photo" + (index + 1) + "_name");
            textElement.value = "사진이름: " + imageData.name;
          }
        }

        return "complete";
      }
    </script>
  </head>
  <body>
    <h1>HTML FILE</h1>
    <p class="description">로컬 HTML과 React Native bridge 기능을 확인하는 데모 페이지입니다.</p>

    <section class="card">
      <h2>웹과 외부 앱</h2>
      <a href="https://www.google.com">Google 검색으로 이동</a>
      <a href="javascript:void(0)" onclick="openPopupWindow()">Bing 검색을 팝업으로 열기</a>
      <a href="tel:010-1234-5678">Tel: 010-1234-5678</a>
      <a href="sms:010-1234-5678">Sms: 010-1234-5678</a>
      <a href="mailto:demo@example.com">MailTo: demo@example.com</a>
      <a href="mywebviewapp://webviewappdemo?target=1&amp;url=m.nate.com">WebViewAppDemo 호출하기</a>
    </section>

    <section class="card device-actions">
      <h2>기기와 메시지</h2>
      <button ontouchstart="" onclick="showMobileType()">스마트폰 종류 출력 요청</button>
      <button ontouchstart="" onclick="sendNative('getDeviceUUID', undefined, '')">기기 고유번호 전달 요청</button>
      <button ontouchstart="" onclick="sendNative('showToastMessage', ['토스트 메시지 테스트!!'])">토스트 메시지 출력 요청</button>
      <button ontouchstart="" onclick="sendNative('showNotiMessage', ['노티 메시지 테스트!!', '노티 메시지 테스트입니다.'])">노티 메시지 출력 요청</button>
    </section>

    <section class="card tab-actions">
      <h2>탭 제어</h2>
      <button ontouchstart="" onclick="sendNative('reloadOtherTabs')">나머지 탭 리로드</button>
      <button ontouchstart="" onclick="sendNative('goToAnotherTab', ['f1', 'https://m.nate.com'])">다른 탭 이동 및 URL 로드</button>
      <button ontouchstart="" onclick="sendNative('showBottomNaviView')">하단 탭 영역 보여주기</button>
      <button ontouchstart="" onclick="sendNative('hideBottomNaviView')">하단 탭 영역 숨기기</button>
    </section>

    <section class="card photo-actions">
      <h2>사진</h2>
      <button ontouchstart="" onclick="sendNative('getPhotoImages')">사진 이미지 전달 요청</button>
      <img id="image1" class="photo" alt="첫 번째 선택 사진" />
      <textarea id="photo1_name" rows="1" readonly></textarea>
      <img id="image2" class="photo" alt="두 번째 선택 사진" />
      <textarea id="photo2_name" rows="1" readonly></textarea>
    </section>
  </body>
</html>`;
// [FLOW-05 / 8단계] payload 안의 calledByNative가 response를 parse해 error를 알리고 UUID 또는 최대 두 사진을 web DOM에 반영합니다.
