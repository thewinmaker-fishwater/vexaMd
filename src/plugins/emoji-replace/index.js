/**
 * Emoji Replace Plugin for Vexa MD
 *
 * Replaces :shortcode: patterns in rendered content with Unicode emoji.
 */

import { Plugin } from '../../core/plugin.js';

// Common emoji shortcodes → Unicode
const EMOJI_MAP = {
  // Smileys
  smile: '😄', grinning: '😀', laughing: '😆', joy: '😂',
  rofl: '🤣', wink: '😉', blush: '😊', innocent: '😇',
  heart_eyes: '😍', kissing: '😗', thinking: '🤔', shushing: '🤫',
  zipper_mouth: '🤐', raised_eyebrow: '🤨', neutral: '😐', expressionless: '😑',
  unamused: '😒', rolling_eyes: '🙄', grimacing: '😬', relieved: '😌',
  pensive: '😔', sleepy: '😪', sleeping: '😴', mask: '😷',
  thermometer: '🤒', head_bandage: '🤕', nauseated: '🤢', sneezing: '🤧',
  dizzy: '😵', cowboy: '🤠', party: '🥳', sunglasses: '😎',
  nerd: '🤓', monocle: '🧐', confused: '😕', worried: '😟',
  frowning: '☹️', open_mouth: '😮', hushed: '😯', astonished: '😲',
  flushed: '😳', pleading: '🥺', cry: '😢', sob: '😭',
  scream: '😱', sweat: '😓', tired: '😫', angry: '😠',
  rage: '😡', cursing: '🤬', devil: '😈', skull: '💀',
  poop: '💩', clown: '🤡', ghost: '👻', alien: '👽',
  robot: '🤖', cat: '😺', heart_cat: '😻', scream_cat: '🙀',
  // Gestures
  wave: '👋', raised_hand: '✋', ok_hand: '👌', pinching: '🤏',
  v: '✌️', crossed_fingers: '🤞', love_you: '🤟', rock: '🤘',
  thumbsup: '👍', thumbsdown: '👎', fist: '✊', clap: '👏',
  handshake: '🤝', pray: '🙏', muscle: '💪', writing: '✍️',
  // Hearts
  heart: '❤️', orange_heart: '🧡', yellow_heart: '💛', green_heart: '💚',
  blue_heart: '💙', purple_heart: '💜', black_heart: '🖤', white_heart: '🤍',
  broken_heart: '💔', sparkling_heart: '💖', heartbeat: '💓', two_hearts: '💕',
  // Objects
  star: '⭐', star2: '🌟', sparkles: '✨', zap: '⚡',
  fire: '🔥', boom: '💥', rainbow: '🌈', sun: '☀️',
  moon: '🌙', cloud: '☁️', rain: '🌧️', snow: '❄️',
  umbrella: '☂️', wind: '🌬️', tornado: '🌪️', fog: '🌫️',
  // Symbols
  check: '✅', x: '❌', warning: '⚠️', question: '❓',
  exclamation: '❗', no_entry: '⛔', prohibited: '🚫', recycle: '♻️',
  white_check_mark: '✅', ballot_box_with_check: '☑️',
  heavy_check_mark: '✔️', heavy_multiplication_x: '✖️',
  plus: '➕', minus: '➖', arrow_right: '➡️', arrow_left: '⬅️',
  arrow_up: '⬆️', arrow_down: '⬇️', point_right: '👉', point_left: '👈',
  point_up: '👆', point_down: '👇',
  // Common
  rocket: '🚀', tada: '🎉', trophy: '🏆', medal: '🏅',
  gift: '🎁', balloon: '🎈', bulb: '💡', book: '📖',
  books: '📚', memo: '📝', pencil: '✏️', lock: '🔒',
  unlock: '🔓', key: '🔑', hammer: '🔨', wrench: '🔧',
  gear: '⚙️', link: '🔗', paperclip: '📎', scissors: '✂️',
  folder: '📁', file_folder: '📂', trash: '🗑️', mailbox: '📫',
  clock: '🕐', hourglass: '⏳', alarm: '⏰', calendar: '📅',
  chart: '📊', bar_chart: '📊', chart_up: '📈', chart_down: '📉',
  magnifying_glass: '🔍', microscope: '🔬', telescope: '🔭',
  computer: '💻', phone: '📱', email: '📧', globe: '🌍',
  flag: '🏁', checkered_flag: '🏁', triangular_flag: '🚩',
  // Food
  coffee: '☕', tea: '🍵', beer: '🍺', wine: '🍷',
  pizza: '🍕', burger: '🍔', fries: '🍟', sushi: '🍣',
  apple: '🍎', banana: '🍌', watermelon: '🍉', grapes: '🍇',
  // Nature
  dog: '🐕', cat2: '🐈', tree: '🌳', flower: '🌸',
  rose: '🌹', seedling: '🌱', leaf: '🍃', fallen_leaf: '🍂',
  cactus: '🌵', palm: '🌴', mushroom: '🍄',
  // Numbers
  '100': '💯', '1234': '🔢',
  zero: '0️⃣', one: '1️⃣', two: '2️⃣', three: '3️⃣',
  four: '4️⃣', five: '5️⃣', six: '6️⃣', seven: '7️⃣',
  eight: '8️⃣', nine: '9️⃣', ten: '🔟',
  // Miscellaneous
  info: 'ℹ️', tip: '💡', note: '📝', important: '❗',
  caution: '⚠️', bug: '🐛', construction: '🚧', eyes: '👀',
  thinking_face: '🤔', ok: '🆗', new: '🆕', free: '🆓',
  sos: '🆘', cool: '🆒', up: '🆙', soon: '🔜', top: '🔝',
};

export default class EmojiReplacePlugin extends Plugin {
  static id = 'emoji-replace';
  static name = 'Emoji Replace';
  static version = '1.0.0';
  static description = 'Converts :shortcodes: to emoji';
  static author = 'Vexa MD Team';

  static capabilities = { markdown: true, ui: false, toolbar: false, settings: false };
  static defaultSettings = {};

  async init() {
    this._on('content:rendered', () => this.replaceEmojis());
    this._on('file:loaded', () => setTimeout(() => this.replaceEmojis(), 100));
    setTimeout(() => this.replaceEmojis(), 500);
  }

  replaceEmojis() {
    const content = document.querySelector('#content');
    if (!content) return;

    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (/:[\w+]+:/.test(node.textContent)) {
        textNodes.push(node);
      }
    }

    for (const textNode of textNodes) {
      // Skip code blocks
      if (textNode.parentElement?.closest('pre, code')) continue;

      const replaced = textNode.textContent.replace(/:([a-z0-9_]+):/g, (match, code) => {
        return EMOJI_MAP[code] || match;
      });

      if (replaced !== textNode.textContent) {
        textNode.textContent = replaced;
      }
    }
  }

  async destroy() {
    await super.destroy();
  }
}
