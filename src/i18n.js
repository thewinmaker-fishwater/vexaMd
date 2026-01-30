/**
 * SP MD Viewer - Internationalization (i18n)
 * Language support: Korean (ko), English (en), Japanese (ja)
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
    exportPdf: 'PDF 내보내기',
    exportingPdf: 'PDF 내보내기 중...',
    pdfExportSuccess: 'PDF 내보내기 완료',
    pdfExportFailed: 'PDF 내보내기 실패',
    noPdfDoc: '내보낼 문서가 없습니다.',
    copyCode: '복사',
    codeCopied: '복사됨',
    search: '검색 (Ctrl+F)',
    viewSingle: '한 페이지 보기',
    viewDouble: '두 페이지 보기',
    viewPaging: '페이지 보기',
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
    noPresentDoc: '프레젠테이션할 문서가 없습니다.',
    fileReloaded: '파일이 변경되어 새로고침되었습니다.',

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

    // TOC (Table of Contents)
    toc: '목차 (Ctrl+Shift+T)',
    tocTitle: '목차',
    tocEmpty: '목차가 없습니다',
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
    scToc: '목차',
    scPageNav: '페이지 이동',
    scNextTab: '다음 탭',
    scPresentation: '프레젠테이션',

    // Theme Editor
    themeEditorTitle: '테마 커스터마이저',
    tabUIEditor: 'UI 에디터',
    tabCSSEditor: 'CSS 편집',
    tabSavedThemes: '저장된 테마',

    // Saved Themes
    themeNamePlaceholder: '테마 이름 입력',
    saveTheme: '테마 저장',
    noSavedThemes: '저장된 테마가 없습니다',
    loadTheme: '불러오기',
    deleteTheme: '삭제',
    confirmDeleteTheme: '이 테마를 삭제하시겠습니까?',
    themeLoaded: '테마를 불러왔습니다',
    themeDeleted: '테마가 삭제되었습니다',
    enterThemeName: '테마 이름을 입력하세요',
    themeSavedAs: '테마가 저장되었습니다',

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
    cssEditorInfo: '아래 템플릿을 참고하여 추가 CSS 스타일을 작성하세요. 주석(/*)을 제거하면 적용됩니다.',
    cssPlaceholder: '/* 커스텀 CSS 입력 */',

    // Editor
    modeView: '보기 모드',
    modeEdit: '편집 모드',
    modeSplit: '분할 모드',
    save: '저장 (Ctrl+S)',
    saved: '저장되었습니다',
    unsavedChanges: '저장하지 않은 변경사항이 있습니다.',
    confirmClose: '저장하지 않은 변경사항이 있습니다. 정말 닫으시겠습니까?',
    editorPlaceholder: '마크다운을 입력하세요...',

    // Plugins
    plugins: '플러그인',
    pluginSettings: '플러그인 설정',
    noPlugins: '사용 가능한 플러그인이 없습니다',
    builtIn: '내장',
    author: '개발자',
    settings: '설정',
    noSettings: '설정 항목이 없습니다',
    pluginEnabled: '플러그인이 활성화되었습니다',
    pluginDisabled: '플러그인이 비활성화되었습니다',

    // VMD Export
    exportVmd: '읽기전용 파일로 내보냈습니다.',
    exportVmdBtn: '읽기전용 내보내기',
    exportVmdToMd: 'Markdown 파일로 내보냈습니다.',
    exportVmdToMdBtn: 'MD로 내보내기',
    readOnly: '읽기전용'
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
    exportPdf: 'Export PDF',
    exportingPdf: 'Exporting PDF...',
    pdfExportSuccess: 'PDF exported successfully',
    pdfExportFailed: 'PDF export failed',
    noPdfDoc: 'No document to export.',
    copyCode: 'Copy',
    codeCopied: 'Copied',
    search: 'Search (Ctrl+F)',
    viewSingle: 'Single Page View',
    viewDouble: 'Two Page View',
    viewPaging: 'Paging View',
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
    noPresentDoc: 'No document to present.',
    fileReloaded: 'File changed and reloaded.',

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

    // TOC (Table of Contents)
    toc: 'Table of Contents (Ctrl+Shift+T)',
    tocTitle: 'Contents',
    tocEmpty: 'No headings found',
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
    scToc: 'Table of Contents',
    scPageNav: 'Page Navigation',
    scNextTab: 'Next Tab',
    scPresentation: 'Presentation',

    // Theme Editor
    themeEditorTitle: 'Theme Customizer',
    tabUIEditor: 'UI Editor',
    tabCSSEditor: 'CSS Editor',
    tabSavedThemes: 'Saved Themes',

    // Saved Themes
    themeNamePlaceholder: 'Enter theme name',
    saveTheme: 'Save Theme',
    noSavedThemes: 'No saved themes',
    loadTheme: 'Load',
    deleteTheme: 'Delete',
    confirmDeleteTheme: 'Delete this theme?',
    themeLoaded: 'Theme loaded',
    themeDeleted: 'Theme deleted',
    enterThemeName: 'Please enter theme name',
    themeSavedAs: 'Theme saved',

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
    cssEditorInfo: 'Use the template below to add custom CSS. Remove comments (/*) to apply.',
    cssPlaceholder: '/* Custom CSS */',

    // Editor
    modeView: 'View Mode',
    modeEdit: 'Edit Mode',
    modeSplit: 'Split Mode',
    save: 'Save (Ctrl+S)',
    saved: 'Saved',
    unsavedChanges: 'You have unsaved changes.',
    confirmClose: 'You have unsaved changes. Are you sure you want to close?',
    editorPlaceholder: 'Enter markdown here...',

    // Plugins
    plugins: 'Plugins',
    pluginSettings: 'Plugin Settings',
    noPlugins: 'No plugins available',
    builtIn: 'Built-in',
    author: 'Author',
    settings: 'Settings',
    noSettings: 'No settings available',
    pluginEnabled: 'Plugin enabled',
    pluginDisabled: 'Plugin disabled',

    // VMD Export
    exportVmd: 'Exported as read-only file.',
    exportVmdBtn: 'Export Read-only',
    exportVmdToMd: 'Exported as Markdown file.',
    exportVmdToMdBtn: 'Export as MD',
    readOnly: 'Read-only'
  },

  ja: {
    // Navigation
    home: 'ホーム',
    homeTooltip: 'ホームへ (Esc)',
    openFile: 'ファイルを開く (Ctrl+O)',
    recentFiles: '最近のファイル',

    // Color Themes
    colorTheme: 'カラーテーマ',
    themeDefault: 'デフォルト (グレー)',
    themePurple: 'パープル',
    themeOcean: 'オーシャン',
    themeSunset: 'サンセット',
    themeForest: 'フォレスト',
    themeRose: 'ローズ',
    themeCustom: 'カスタム',

    // Font
    fontFamily: 'フォント',
    fontSystem: 'システムデフォルト',
    fontMalgun: 'Malgun Gothic',
    fontNanum: 'Nanum Gothic',
    fontPretendard: 'Pretendard',
    fontNoto: 'Noto Sans JP',

    // Font Size
    fontSize: 'フォントサイズ',
    fontSmall: '小',
    fontMedium: '中',
    fontLarge: '大',
    fontXlarge: '特大',

    // Content Width
    contentWidth: 'コンテンツ幅',
    widthNarrow: '狭い (900px)',
    widthMedium: '普通 (1200px)',
    widthWide: '広い (1600px)',
    widthFull: '全幅',

    // Language
    language: '言語',

    // Theme Toggle
    toggleTheme: 'ライト/ダーク切替 (Ctrl+D)',
    themeCustomizer: 'テーマカスタマイザー',

    // Actions
    print: '印刷 (Ctrl+P)',
    exportPdf: 'PDFエクスポート',
    exportingPdf: 'PDFエクスポート中...',
    pdfExportSuccess: 'PDFエクスポート完了',
    pdfExportFailed: 'PDFエクスポート失敗',
    noPdfDoc: 'エクスポートするドキュメントがありません。',
    copyCode: 'コピー',
    codeCopied: 'コピー済み',
    search: '検索 (Ctrl+F)',
    viewSingle: 'シングルページ表示',
    viewDouble: '2ページ表示',
    viewPaging: 'ページ表示',
    zoomOut: '縮小 (Ctrl+-)',
    zoomIn: '拡大 (Ctrl++)',
    zoomReset: '元のサイズ (Ctrl+0)',
    zoomRatio: 'ズーム比率',

    // Search
    searchPlaceholder: '検索...',
    searchPrev: '前へ (Shift+Enter)',
    searchNext: '次へ (Enter)',
    searchClose: '閉じる (Esc)',

    // Recent Files
    recentEmpty: '最近のファイルはありません',
    clearList: 'リストをクリア',

    // Welcome Screen
    welcomeSubtitle: '超軽量マークダウンビューア',
    welcomeInstruction: 'Markdownファイルを開くか、ここにドラッグしてください。',
    dropMessage: 'ファイルをドロップ',

    // Notifications
    themeApplied: 'テーマが適用されました！',
    themeReset: 'テーマがリセットされました',
    themeSaved: 'テーマを保存しました！',
    themeImported: 'カスタムテーマをインポートしました！',
    previewApplied: 'プレビュー適用',
    noPrintDoc: '印刷するドキュメントがありません。',
    noPresentDoc: 'プレゼンテーションするドキュメントがありません。',
    fileReloaded: 'ファイルが変更され、再読み込みされました。',

    // Errors
    unsupportedFormat: 'サポートされていない形式',
    unsupportedFormatMsg: 'Markdown (.md, .markdown, .txt) またはテーマ (.json) ファイルのみサポートされています。',
    fileReadError: 'ファイルの読み込みに失敗しました',
    themeImportError: 'テーマのインポートに失敗しました',
    invalidTheme: '無効なテーマファイルです。',

    // Common
    close: '閉じる',
    confirm: 'OK',
    cancel: 'キャンセル',
    apply: '適用',
    preview: 'プレビュー',
    reset: 'リセット',
    import: 'インポート',
    export: 'エクスポート',
    removeFromList: 'リストから削除',

    // Presentation
    presentation: 'プレゼンテーション (F5)',
    prevSlide: '前のスライド (←)',
    nextSlide: '次のスライド (→)',
    exitPresentation: '終了 (Esc)',

    // TOC (Table of Contents)
    toc: '目次 (Ctrl+Shift+T)',
    tocTitle: '目次',
    tocEmpty: '見出しがありません',
    noDocForPresentation: 'プレゼンテーション用のドキュメントがありません。',

    // Help Menu
    help: 'ヘルプ',
    shortcuts: 'ショートカット',
    about: 'プログラム情報',

    // About Modal
    aboutTitle: 'プログラム情報',
    version: 'バージョン',
    developer: '開発',
    technology: '技術',
    license: 'ライセンス',

    // Shortcuts Modal
    shortcutsTitle: 'ショートカット',
    shortcutFile: 'ファイル',
    shortcutView: '表示',
    shortcutNav: 'ナビゲーション',
    scOpenFile: 'ファイルを開く',
    scCloseTab: 'タブを閉じる',
    scPrint: '印刷',
    scHome: 'ホームへ',
    scToggleTheme: 'テーマ切替',
    scZoomIn: '拡大',
    scZoomOut: '縮小',
    scZoomReset: '元のサイズ',
    scSearch: '検索',
    scToc: '目次',
    scPageNav: 'ページ移動',
    scNextTab: '次のタブ',
    scPresentation: 'プレゼンテーション',

    // Theme Editor
    themeEditorTitle: 'テーマカスタマイザー',
    tabUIEditor: 'UIエディター',
    tabCSSEditor: 'CSSエディター',
    tabSavedThemes: '保存済みテーマ',

    // Saved Themes
    themeNamePlaceholder: 'テーマ名を入力',
    saveTheme: 'テーマを保存',
    noSavedThemes: '保存済みテーマがありません',
    loadTheme: '読み込む',
    deleteTheme: '削除',
    confirmDeleteTheme: 'このテーマを削除しますか？',
    themeLoaded: 'テーマを読み込みました',
    themeDeleted: 'テーマが削除されました',
    enterThemeName: 'テーマ名を入力してください',
    themeSavedAs: 'テーマが保存されました',

    // Theme Editor Sections
    sectionColors: '🎨 基本色',
    sectionFont: '📝 フォント',
    sectionCode: '📦 コードブロック',
    sectionBlockquote: '💬 引用文',
    sectionTable: '📊 テーブル',
    sectionHeadings: '📰 見出し',
    sectionTextMark: '✏️ テキストマーク',
    sectionToolbar: '🔧 ツールバー',

    // Theme Editor Labels
    labelBgColor: '背景色',
    labelTextColor: 'テキスト色',
    labelAccentColor: 'アクセント色',
    labelBorderColor: '枠線色',
    labelBodyFont: '本文フォント',
    labelBaseFontSize: '基本フォントサイズ',
    labelLineHeight: '行の高さ',
    labelCodeFont: 'コードフォント',
    labelCodeFontDefault: 'デフォルト (Consolas)',
    labelBorderWidth: '枠線の太さ',
    labelHeaderBg: 'ヘッダー背景',
    labelHeaderText: 'ヘッダーテキスト',
    labelBorderRadius: '角丸',
    labelH1Color: 'H1色',
    labelH2Color: 'H2色',
    labelUseGradient: 'グラデーション使用',
    labelLinkColor: 'リンク色',
    labelBoldColor: '太字',
    labelItalicColor: '斜体',
    labelHighlightBg: 'ハイライト背景',
    labelHighlightText: 'ハイライトテキスト',
    labelListMarker: 'リストマーカー',
    labelToolbarBg: 'ツールバー背景',
    labelToolbarGradient: 'ツールバーグラデーション',
    labelTabbarBg: 'タブバー背景',

    // CSS Editor
    cssEditorInfo: '以下のテンプレートを参考にCSSを追加してください。コメント(/*)を削除すると適用されます。',
    cssPlaceholder: '/* カスタムCSS */',

    // Editor
    modeView: '表示モード',
    modeEdit: '編集モード',
    modeSplit: '分割モード',
    save: '保存 (Ctrl+S)',
    saved: '保存しました',
    unsavedChanges: '保存されていない変更があります。',
    confirmClose: '保存されていない変更があります。本当に閉じますか？',
    editorPlaceholder: 'マークダウンを入力...',

    // Plugins
    plugins: 'プラグイン',
    pluginSettings: 'プラグイン設定',
    noPlugins: '利用可能なプラグインがありません',
    builtIn: '内蔵',
    author: '開発者',
    settings: '設定',
    noSettings: '設定項目がありません',
    pluginEnabled: 'プラグインが有効化されました',
    pluginDisabled: 'プラグインが無効化されました',

    // VMD Export
    exportVmd: '読み取り専用ファイルとしてエクスポートしました。',
    exportVmdBtn: '読み取り専用エクスポート',
    exportVmdToMd: 'Markdownファイルとしてエクスポートしました。',
    exportVmdToMdBtn: 'MDでエクスポート',
    readOnly: '読み取り専用'
  }
};

export default i18n;
