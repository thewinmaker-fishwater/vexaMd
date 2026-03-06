/**
 * Text Utilities - 단어 수, 글자 수, 읽기 시간 계산
 * 상태바와 플러그인에서 공유하는 통합 로직
 */

/**
 * 단어 수 카운트 (CJK 언어 지원)
 * - 한글/CJK 문자: 각각 1단어
 * - 라틴/기타: 공백 구분
 */
export function countWords(text) {
  if (!text.trim()) return 0;
  const cjkCount = (text.match(/[\uAC00-\uD7AF\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF]/g) || []).length;
  const latinText = text.replace(/[\uAC00-\uD7AF\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF]/g, ' ');
  const latinWords = latinText.trim() ? latinText.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
  return cjkCount + latinWords;
}

/**
 * 글자 수 카운트 (공백 제외)
 */
export function countChars(text) {
  return text.replace(/\s/g, '').length;
}

/**
 * 읽기 시간 계산 (분)
 * - 한국어: ~500 CPM
 * - CJK (중국어/일본어): ~400 CPM
 * - 라틴/기타: ~200 WPM
 */
export function calcReadingTime(text) {
  if (!text.trim()) return 0;
  const koChars = (text.match(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g) || []).length;
  const cjkChars = (text.match(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF]/g) || []).length;
  const wordText = text.replace(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF]/g, ' ');
  const words = wordText.trim() ? wordText.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
  return (koChars / 500) + (cjkChars / 400) + (words / 200);
}
