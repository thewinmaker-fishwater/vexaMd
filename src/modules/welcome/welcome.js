/**
 * Welcome HTML generator
 * Extracted from main.js getWelcomeHTML()
 */

import { i18n } from '../../i18n.js';

export function getWelcomeHTML(currentLanguage) {
  const lang = i18n[currentLanguage];
  return `
  <div class="welcome">
    <div class="welcome-logo">
      <img src="/logo.png" alt="Vexa MD" width="120">
    </div>
    <h1>Vexa MD</h1>
    <p class="subtitle">${lang.welcomeSubtitle}</p>
    <p>${lang.welcomeInstruction}</p>
    <p><kbd>Ctrl</kbd>+<kbd>O</kbd> 열기 &nbsp; <kbd>Ctrl</kbd>+<kbd>D</kbd> 테마 &nbsp; <kbd>Ctrl</kbd>+<kbd>P</kbd> 인쇄 &nbsp; <kbd>Ctrl</kbd>+<kbd>F</kbd> 검색 &nbsp; <kbd>Esc</kbd> 홈</p>
    <div id="home-favorites" class="home-recent" style="display:none">
      <h3>${lang.favorites || '즐겨찾기'}</h3>
      <div id="home-favorites-list"></div>
    </div>
    <div id="home-recent" class="home-recent">
      <h3>${lang.recentFiles}</h3>
      <div id="home-recent-list"></div>
    </div>
  </div>
`;
}
