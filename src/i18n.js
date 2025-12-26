/**
 * SP MD Viewer - Internationalization (i18n)
 * Language support: Korean (ko), English (en)
 */

export const i18n = {
  ko: {
    // Navigation
    home: '홈',
    homeTooltip: '홈으로 (Esc)',
    openFile: '파일 열기 (Ctrl+O)',
    recentFiles: '최근 파일',

    // Color Themes
    colorTheme: '컬러 테마',
    themeDefault: '기본 (그레이)',
    themePurple: '퍼플',
    themeOcean: '오션',
    themeSunset: '선셋',
    themeForest: '포레스트',
    themeRose: '로즈',
    themeCustom: '커스텀',

    // Font
    fontFamily: '글꼴',
    fontSystem: '시스템 기본',
    fontMalgun: '맑은 고딕',
    fontNanum: '나눔고딕',
    fontPretendard: 'Pretendard',
    fontNoto: 'Noto Sans KR',

    // Font Size
    fontSize: '글씨 크기',
    fontSmall: '작게',
    fontMedium: '보통',
    fontLarge: '크게',
    fontXlarge: '아주 크게',

    // Content Width
    contentWidth: '콘텐츠 너비',
    widthNarrow: '좁게 (900px)',
    widthMedium: '보통 (1200px)',
    widthWide: '넓게 (1600px)',
    widthFull: '전체 너비',

    // Language
    language: '언어',

    // Theme Toggle
    toggleTheme: '라이트/다크 전환 (Ctrl+D)',
    themeCustomizer: '테마 커스터마이저',

    // Actions
    print: '인쇄 (Ctrl+P)',
    search: '검색 (Ctrl+F)',
    viewSingle: '한 페이지 보기',
    viewDouble: '여러 페이지로 보기',
    zoomOut: '축소 (Ctrl+-)',
    zoomIn: '확대 (Ctrl++)',
    zoomReset: '원래 크기 (Ctrl+0)',
    zoomRatio: '확대/축소 비율',

    // Search
    searchPlaceholder: '검색어 입력...',
    searchPrev: '이전 (Shift+Enter)',
    searchNext: '다음 (Enter)',
    searchClose: '닫기 (Esc)',

    // Recent Files
    recentEmpty: '최근 파일이 없습니다',
    clearList: '목록 지우기',

    // Welcome Screen
    welcomeSubtitle: '초경량 마크다운 뷰어',
    welcomeInstruction: 'Markdown 파일을 열거나 이 영역에 드래그하세요.',
    dropMessage: '파일을 놓으세요',

    // Notifications
    themeApplied: '테마가 적용되었습니다!',
    themeReset: '테마가 초기화되었습니다',
    themeSaved: '테마를 저장했습니다!',
    themeImported: '커스텀 테마를 불러왔습니다!',
    previewApplied: '미리보기 적용됨',
    noPrintDoc: '인쇄할 문서가 없습니다.',

    // Errors
    unsupportedFormat: '지원하지 않는 형식',
    unsupportedFormatMsg: 'Markdown 파일(.md, .markdown, .txt) 또는 테마 파일(.json)만 지원합니다.',
    fileReadError: '파일 읽기 실패',
    themeImportError: '테마 불러오기 실패',
    invalidTheme: '유효한 테마 파일이 아닙니다.',

    // Common
    close: '닫기',
    confirm: '확인',
    cancel: '취소',
    apply: '적용',
    preview: '미리보기',
    reset: '초기화',
    import: '가져오기',
    export: '내보내기',
    removeFromList: '목록에서 제거',

    // Presentation
    presentation: '프레젠테이션 (F5)',
    prevSlide: '이전 슬라이드 (←)',
    nextSlide: '다음 슬라이드 (→)',
    exitPresentation: '종료 (Esc)',
    noDocForPresentation: '프레젠테이션할 문서가 없습니다.',

    // Help Menu
    help: '도움말',
    shortcuts: '단축키',
    about: '프로그램 정보',

    // About Modal
    aboutTitle: '프로그램 정보',
    version: '버전',
    developer: '개발',
    technology: '기술',
    license: '라이선스',

    // Shortcuts Modal
    shortcutsTitle: '단축키',
    shortcutFile: '파일',
    shortcutView: '보기',
    shortcutNav: '탐색',
    scOpenFile: '파일 열기',
    scCloseTab: '탭 닫기',
    scPrint: '인쇄',
    scHome: '홈으로',
    scToggleTheme: '테마 전환',
    scZoomIn: '확대',
    scZoomOut: '축소',
    scZoomReset: '원래 크기',
    scSearch: '검색',
    scPageNav: '페이지 이동',
    scNextTab: '다음 탭',
    scPresentation: '프레젠테이션',

    // Theme Editor
    themeEditorTitle: '테마 커스터마이저',
    tabUIEditor: 'UI 에디터',
    tabCSSEditor: 'CSS 편집',

    // Theme Editor Sections
    sectionColors: '🎨 기본 색상',
    sectionFont: '📝 글꼴',
    sectionCode: '📦 코드 블록',
    sectionBlockquote: '💬 인용문',
    sectionTable: '📊 테이블',
    sectionHeadings: '📰 제목',
    sectionTextMark: '✏️ 텍스트 마크',
    sectionToolbar: '🔧 툴바',

    // Theme Editor Labels
    labelBgColor: '배경색',
    labelTextColor: '텍스트 색상',
    labelAccentColor: '강조 색상',
    labelBorderColor: '테두리 색상',
    labelBodyFont: '본문 글꼴',
    labelBaseFontSize: '기본 글자 크기',
    labelLineHeight: '줄 간격',
    labelCodeFont: '코드 글꼴',
    labelCodeFontDefault: '기본 (Consolas)',
    labelBorderWidth: '테두리 두께',
    labelHeaderBg: '헤더 배경',
    labelHeaderText: '헤더 텍스트',
    labelBorderRadius: '테두리 반경',
    labelH1Color: 'H1 색상',
    labelH2Color: 'H2 색상',
    labelUseGradient: '그라데이션 사용',
    labelLinkColor: '링크 색상',
    labelBoldColor: '굵은 글씨',
    labelItalicColor: '기울임 글씨',
    labelHighlightBg: '하이라이트 배경',
    labelHighlightText: '하이라이트 글씨',
    labelListMarker: '목록 마커',
    labelToolbarBg: '툴바 배경',
    labelToolbarGradient: '툴바 그라데이션',
    labelTabbarBg: '탭바 배경',

    // CSS Editor
    cssEditorInfo: 'CSS 변수와 스타일을 직접 편집할 수 있습니다.',
    cssPlaceholder: '/* 커스텀 CSS 입력 */'
  },

  en: {
    // Navigation
    home: 'Home',
    homeTooltip: 'Go Home (Esc)',
    openFile: 'Open File (Ctrl+O)',
    recentFiles: 'Recent Files',

    // Color Themes
    colorTheme: 'Color Theme',
    themeDefault: 'Default (Gray)',
    themePurple: 'Purple',
    themeOcean: 'Ocean',
    themeSunset: 'Sunset',
    themeForest: 'Forest',
    themeRose: 'Rose',
    themeCustom: 'Custom',

    // Font
    fontFamily: 'Font',
    fontSystem: 'System Default',
    fontMalgun: 'Malgun Gothic',
    fontNanum: 'Nanum Gothic',
    fontPretendard: 'Pretendard',
    fontNoto: 'Noto Sans KR',

    // Font Size
    fontSize: 'Font Size',
    fontSmall: 'Small',
    fontMedium: 'Medium',
    fontLarge: 'Large',
    fontXlarge: 'X-Large',

    // Content Width
    contentWidth: 'Content Width',
    widthNarrow: 'Narrow (900px)',
    widthMedium: 'Medium (1200px)',
    widthWide: 'Wide (1600px)',
    widthFull: 'Full Width',

    // Language
    language: 'Language',

    // Theme Toggle
    toggleTheme: 'Toggle Light/Dark (Ctrl+D)',
    themeCustomizer: 'Theme Customizer',

    // Actions
    print: 'Print (Ctrl+P)',
    search: 'Search (Ctrl+F)',
    viewSingle: 'Single Page View',
    viewDouble: 'Multi-Page View',
    zoomOut: 'Zoom Out (Ctrl+-)',
    zoomIn: 'Zoom In (Ctrl++)',
    zoomReset: 'Reset Zoom (Ctrl+0)',
    zoomRatio: 'Zoom Ratio',

    // Search
    searchPlaceholder: 'Search...',
    searchPrev: 'Previous (Shift+Enter)',
    searchNext: 'Next (Enter)',
    searchClose: 'Close (Esc)',

    // Recent Files
    recentEmpty: 'No recent files',
    clearList: 'Clear List',

    // Welcome Screen
    welcomeSubtitle: 'Ultra-lightweight Markdown Viewer',
    welcomeInstruction: 'Open or drag a Markdown file here.',
    dropMessage: 'Drop file here',

    // Notifications
    themeApplied: 'Theme applied!',
    themeReset: 'Theme has been reset',
    themeSaved: 'Theme saved!',
    themeImported: 'Custom theme imported!',
    previewApplied: 'Preview applied',
    noPrintDoc: 'No document to print.',

    // Errors
    unsupportedFormat: 'Unsupported Format',
    unsupportedFormatMsg: 'Only Markdown (.md, .markdown, .txt) or theme (.json) files are supported.',
    fileReadError: 'Failed to read file',
    themeImportError: 'Failed to import theme',
    invalidTheme: 'Invalid theme file.',

    // Common
    close: 'Close',
    confirm: 'OK',
    cancel: 'Cancel',
    apply: 'Apply',
    preview: 'Preview',
    reset: 'Reset',
    import: 'Import',
    export: 'Export',
    removeFromList: 'Remove from list',

    // Presentation
    presentation: 'Presentation (F5)',
    prevSlide: 'Previous Slide (←)',
    nextSlide: 'Next Slide (→)',
    exitPresentation: 'Exit (Esc)',
    noDocForPresentation: 'No document for presentation.',

    // Help Menu
    help: 'Help',
    shortcuts: 'Shortcuts',
    about: 'About',

    // About Modal
    aboutTitle: 'About',
    version: 'Version',
    developer: 'Developer',
    technology: 'Technology',
    license: 'License',

    // Shortcuts Modal
    shortcutsTitle: 'Shortcuts',
    shortcutFile: 'File',
    shortcutView: 'View',
    shortcutNav: 'Navigation',
    scOpenFile: 'Open File',
    scCloseTab: 'Close Tab',
    scPrint: 'Print',
    scHome: 'Go Home',
    scToggleTheme: 'Toggle Theme',
    scZoomIn: 'Zoom In',
    scZoomOut: 'Zoom Out',
    scZoomReset: 'Reset Zoom',
    scSearch: 'Search',
    scPageNav: 'Page Navigation',
    scNextTab: 'Next Tab',
    scPresentation: 'Presentation',

    // Theme Editor
    themeEditorTitle: 'Theme Customizer',
    tabUIEditor: 'UI Editor',
    tabCSSEditor: 'CSS Editor',

    // Theme Editor Sections
    sectionColors: '🎨 Colors',
    sectionFont: '📝 Font',
    sectionCode: '📦 Code Block',
    sectionBlockquote: '💬 Blockquote',
    sectionTable: '📊 Table',
    sectionHeadings: '📰 Headings',
    sectionTextMark: '✏️ Text Marks',
    sectionToolbar: '🔧 Toolbar',

    // Theme Editor Labels
    labelBgColor: 'Background',
    labelTextColor: 'Text Color',
    labelAccentColor: 'Accent Color',
    labelBorderColor: 'Border Color',
    labelBodyFont: 'Body Font',
    labelBaseFontSize: 'Base Font Size',
    labelLineHeight: 'Line Height',
    labelCodeFont: 'Code Font',
    labelCodeFontDefault: 'Default (Consolas)',
    labelBorderWidth: 'Border Width',
    labelHeaderBg: 'Header Background',
    labelHeaderText: 'Header Text',
    labelBorderRadius: 'Border Radius',
    labelH1Color: 'H1 Color',
    labelH2Color: 'H2 Color',
    labelUseGradient: 'Use Gradient',
    labelLinkColor: 'Link Color',
    labelBoldColor: 'Bold Text',
    labelItalicColor: 'Italic Text',
    labelHighlightBg: 'Highlight Background',
    labelHighlightText: 'Highlight Text',
    labelListMarker: 'List Marker',
    labelToolbarBg: 'Toolbar Background',
    labelToolbarGradient: 'Toolbar Gradient',
    labelTabbarBg: 'Tab Bar Background',

    // CSS Editor
    cssEditorInfo: 'Edit CSS variables and styles directly.',
    cssPlaceholder: '/* Custom CSS */'
  }
};

export default i18n;
