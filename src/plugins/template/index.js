/**
 * Template Plugin for Vexa MD (External Plugin)
 *
 * 외부 플러그인은 blob URL로 로드되므로 ES import를 사용할 수 없습니다.
 * 대신 window.VexaMD.Plugin을 기본 클래스로 사용하세요.
 *
 * 시작하기:
 * 1. plugin.json의 id, name 등을 수정하세요
 * 2. 이 파일에서 플러그인 로직을 구현하세요
 * 3. 플러그인 관리 UI에서 "플러그인 설치" 버튼으로 폴더를 선택하세요
 *
 * 사용 가능한 API (this.api):
 * - this.api.events  : 이벤트 시스템
 * - this.api.store   : 상태 관리
 * - this.api.markdown : 마크다운 확장
 * - this.api.ui      : UI 확장 (툴바, 알림, 모달)
 * - this.api.dom     : DOM 유틸리티
 * - this.api.utils   : 헬퍼 (debounce, throttle, generateId)
 */

const Plugin = window.VexaMD.Plugin;

export default class TemplatePlugin extends Plugin {
  // === 메타데이터 (plugin.json과 일치시키세요) ===
  static id = 'my-plugin';
  static name = 'My Plugin';
  static version = '1.0.0';
  static description = 'A template plugin for Vexa MD';
  static author = 'Your Name';

  // === 기능 선언 ===
  static capabilities = {
    markdown: false,  // true: 마크다운 확장 API 사용
    ui: false,        // true: UI 확장 API 사용
    toolbar: false,   // true: 툴바 버튼 추가
    settings: true,   // true: 설정 패널 표시
  };

  // === 기본 설정 (plugin.json의 settings.*.default와 일치) ===
  static defaultSettings = {
    greeting: 'Hello',
    enabled: true,
    theme: 'auto',
    opacity: 100,
  };

  constructor(api) {
    super(api);
    // 플러그인 인스턴스 변수 초기화
  }

  /**
   * 플러그인 초기화
   * 활성화될 때 호출됩니다.
   */
  async init() {
    console.log(`[${this.constructor.name}] Initialized with settings:`, this.settings);

    // 이벤트 리스너 등록 예시 (자동 정리됨)
    // this._on('file:loaded', ({ name }) => {
    //   console.log(`File loaded: ${name}`);
    // });

    // 툴바 버튼 추가 예시
    // this.api.ui.addToolbarButton({
    //   id: 'my-action',
    //   icon: '<svg>...</svg>',
    //   title: 'My Action',
    //   onClick: () => this.doSomething(),
    // });
  }

  /**
   * 플러그인 정리
   * 비활성화될 때 호출됩니다.
   */
  async destroy() {
    await super.destroy();
    console.log(`[${this.constructor.name}] Destroyed`);
  }

  /**
   * 설정 변경 핸들러
   */
  onSettingsChange(settings) {
    console.log(`[${this.constructor.name}] Settings changed:`, settings);
  }
}
