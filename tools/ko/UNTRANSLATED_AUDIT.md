# DFO Online 한국어: 미번역 코드 진단 (2026-10-14)

> **현황:** 유니티 번역 팩 + `Port_Strings` 통합팩을 실제 사용자가 적용했으나 아직 영어가 많이 나타남.
> 이 문서는 *고정 영문 텍스트 후보*를 집계한 것으로, 모두 사용자에게 보인다는 뜻은 아님.

## 확인된 사실

- `locales/en/Port_Strings.csv`와 `locales/ko/Port_Strings.csv`에는 동일한 2,637개 키가 있음. 이 카탈로그만 채운다고 미연결 코드 문자열이 번역되지는 않음.
- 게임에는 Daggerfall Unity 번역 팩을 받아 **퀘스트·서적·문자열 테이블을 읽는 별도 로더**가 있음.
- `test/l10n4_hardcoded.test.js`의 `HARDCODED` 집계상 **723개 JS 파일, 총 13,625개**의 영어 문장 후보가 남아 있음. 여기에는 설정 식별자·개발 전용·비표시 데이터도 일부 들어 있으므로 *미번역 실제 화면 개수*로 해석하면 안 됨.
- 대분류별 후보는 `systems: 6,254`, `ui: 3,336`, `net: 1,612`, `scenes: 1,313`개. 가장 우선할 영역은 사용자가 자주 접하는 `src/ui`와 메시지가 실제 출력되는 `src/scenes` 일부.

## 우선 작업 영역 (소스의 정적 문자열 예시 확인)

| 우선순위 | 파일 | 고정 영문 후보 | 실제 발견한 사용자 표시 문구 |
|---|---|---:|---|
| P1 | `src/ui/enhancedChargen.js` | 106 | `Homeland`, `Where are you from?`, `Choose again`, `Are you a man or a woman?` |
| P1 | `src/ui/enhancedInventory.js` | 84 | `Head`, `Chest, clothes`, `Right hand` 등 장비 슬롯 |
| P1 | `src/ui/enhancedMenu.js` | 59 | 기존 `t()` 사용 영역 이외의 일부 영문 |
| P2 | `src/ui/socialPanel.js` | 237 | `Social`, `Accept`, `Friends`, `Party invitations` |
| P2 | `src/ui/settingsCopy.js` | 185 | 설정 문구 후보 — 원본 설정 키와 화면 표시를 구분해야 함 |
| P2 | `src/ui/noticeWindow.js` | 99 | 알림/게시판 관련 문구 후보 |
| P3 | `src/ui/marketTab.js` | 151 | 거래소 기능 |
| P3 | `src/ui/familyPages.js` | 111 | 가문 기능 |

숫자는 `test/l10n4_hardcoded.test.js`의 기존 카운터를 읽은 것이며, 위 문구 일부는 해당 코드의 실제 출력 호출에서 확인함.

## 수정 원칙

1. **화면에 출력되는 문자열만** 다국어 시스템에 연결한다. 저장·네트워크·파일명·매칭에 쓰이는 영문 상수는 바꾸지 않는다.
2. `tools/l10n/ROUTE-BRIEF.md`에 따라 `t('section.key', 'English', vars)` 또는 DFU의 `localizedText`를 사용한다. `t()`는 모듈 로드 시점이 아닌 *출력 시점*에 호출한다.
3. `node tools/l10nExtract.mjs`로 영문 카탈로그를 갱신하고, 한국어뿐 아니라 프로젝트가 요구하는 다른 언어 키도 빠뜨리지 않는다. 다른 언어의 기존 번역은 덮어쓰지 않는다.
4. 플레이스홀더·ICU 형식·영문 원문 출력·기존 테스트와 source pin을 보존한다. `l10n4_hardcoded.test.js` 감소치를 갱신한다.
5. 인게임 비교로 실제 남는 영어가 **DFU 원문/모드/온라인 고정문자열/이미지 내 글자** 중 어느 부류인지 구분한다.
6. 포크의 코드 수정은 공식 `daggerfalljs.dev` 사이트에 즉시 반영되지 않는다. 온라인 공식 사이트에 반영하려면 원본 프로젝트에 병합되거나 별도 빌드가 배포되어야 한다.

## 추천 첫 배치

- **캐릭터 생성**: 사용자에게 바로 보이는 제목/설명/선택지, 장문 설명 순으로 전수 조사
- **인벤토리**: 장비 슬롯명, 버튼, 확인 대화상자
- **소셜**: 친구/파티/초대/대화 버튼 및 알림
- 이후 메뉴·퀘스트 창·기타 게임 시스템으로 확대

## 이미 완료한 별도 작업

- `locales/ko/Port_Strings.csv`의 미해결 가변 조사 45건 교정
- 온라인/유니티 통합 번역 팩 빌더와 GitHub Actions 아티팩트 빌드
- 원본 `main`은 수정하지 않음 (작업 브랜치: `ko-online-qa-20261014`)

## 참조

- `tools/l10n/ROUTE-BRIEF.md`
- `test/l10n4_hardcoded.test.js`
- `src/systems/translationPacks.js`
- `src/scenes/localeData.js`
