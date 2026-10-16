# Daggerfall Online 한국어 통합 번역 팩 (시험판)

대거폴 유니티용 한국어 번역과 Daggerfall Online 전용 메뉴 번역을 **한 개의 ZIP**으로 묶습니다. 원본 Daggerfall Unity 패치 및 업스트림 게임 코드는 수정하지 않습니다.

## 왜 통합 ZIP인가?

Daggerfall Online의 Translation pack은 같은 언어에 새 팩을 설치하면 기존 팩을 **교체**합니다. `Port_Strings.csv`만 들어 있는 두 번째 ZIP을 설치하면 앞서 설치한 퀘스트/책 번역을 잃게 됩니다. 따라서 번역을 합쳐 하나의 파일로 설치해야 합니다.

## 만드는 방법

1. [대거폴 유니티 한국어 패치](https://github.com/munument1/-KR-Daggerfall_Unity/releases)에서 패치 ZIP을 내려받거나 해당 저장소를 다운로드합니다.
2. Python 3.10 이상을 설치합니다.
3. 이 저장소의 루트에서 다음을 실행합니다.

```powershell
python tools/ko/build_online_korean_pack.py --dfu-path "C:\path\to\Daggerfall_Unity_Korean.zip" --output "Daggerfall_Online_Korean_Combined.zip"
```

`--dfu-path`는 ZIP 또는 압축을 푼 폴더를 받습니다. 이 저장소의 `locales/ko/Port_Strings.csv`를 결합합니다. 기존 출력 파일은 안전상 덮어쓰지 않습니다.

GitHub Actions의 **Build Korean translation pack**도 같은 ZIP을 빌드하고 검사하며, 실행에 성공하면 **Daggerfall-Online-Korean-Test**라는 아티팩트를 제공합니다. 다운로드한 GitHub Actions 아티팩트 ZIP 안에서 `Daggerfall_Online_Korean_Combined.zip`을 꺼내 사용하세요.

## 설치

1. [Daggerfall Online](https://daggerfalljs.dev/)을 엽니다.
2. `Settings → Interface → Language`에서 `한국어`를 선택합니다.
3. `Translation pack`에서 통합 ZIP을 설치합니다.
4. 퀘스트 일지, 책, NPC 대화와 온라인 메뉴를 시험합니다.

기존 번역 팩이 있다면 통합 팩으로 교체됩니다. 필요하면 원래 ZIP을 보관하세요.

## 포함 / 제외

- 포함: DFU의 `Text/*.csv`, `Text/*.txt`, `Text/Quests/*-LOC.txt`, `Text/Books/*-LOC.txt`, 지원되는 `Fonts/FONT000*-SDF` 파일
- 추가: 온라인 자체 UI의 `Text/Port_Strings.csv`
- 제외: 온라인 번역 팩 가져오기에서 처리하지 않는 `BIOGs`, `textures`, `movies`, `0` 폴더 및 원본 게임 리소스

## 현재 남아 있는 한계

한국어 `Port_Strings.csv`에는 영문 카탈로그의 **2,637개 키**가 모두 있습니다. 하지만 게임 소스에서 `t()` 등 현지화 함수를 거치지 않는 영문 문자열은 CSV를 추가해도 번역되지 않습니다. 이 문자열은 Daggerfall Online 자체 코드의 현지화 연결이 필요합니다.

이번 1차 교정은 가변 이름에 붙은 `을(를)`, `이(가)`, `은(는)`, `(으)로` 형태를 쓰던 45개 문장을 수정합니다. 문맥 및 화면 폭에 대한 전수 인게임 검수는 아직 완료되지 않았습니다.

## 관련 프로젝트

- 유니티 기본 게임 한국어 번역: https://github.com/munument1/-KR-Daggerfall_Unity
- 온라인판 자체 번역/포크: https://github.com/munument1/-KR-daggerfall-js
- 온라인 원본: https://github.com/Lattymoy/daggerfall-js-source

기존 유니티용 넥서스 배포는 별도로 유지하며, 온라인판은 선택 호환 지원입니다.
