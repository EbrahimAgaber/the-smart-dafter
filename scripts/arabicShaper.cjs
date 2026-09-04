/**
 * Pure CommonJS Arabic Contextual Shaper & Token-Level BiDi Engine for Node.js
 */

const ARABIC_GLYPHS = {
  0x0621: { isolated: 0xFE80, final: 0xFE80 },
  0x0622: { isolated: 0xFE81, final: 0xFE82 },
  0x0623: { isolated: 0xFE83, final: 0xFE84 },
  0x0624: { isolated: 0xFE85, final: 0xFE86 },
  0x0625: { isolated: 0xFE87, final: 0xFE88 },
  0x0626: { isolated: 0xFE89, final: 0xFE8A, initial: 0xFE8B, medial: 0xFE8C },
  0x0627: { isolated: 0xFE8D, final: 0xFE8E },
  0x0628: { isolated: 0xFE8F, final: 0xFE90, initial: 0xFE91, medial: 0xFE92 },
  0x0629: { isolated: 0xFE93, final: 0xFE94 },
  0x062A: { isolated: 0xFE95, final: 0xFE96, initial: 0xFE97, medial: 0xFE98 },
  0x062B: { isolated: 0xFE99, final: 0xFE9A, initial: 0xFE9B, medial: 0xFE9C },
  0x062C: { isolated: 0xFE9D, final: 0xFE9E, initial: 0xFE9F, medial: 0xFEA0 },
  0x062D: { isolated: 0xFEA1, final: 0xFEA2, initial: 0xFEA3, medial: 0xFEA4 },
  0x062E: { isolated: 0xFEA5, final: 0xFEA6, initial: 0xFEA7, medial: 0xFEA8 },
  0x062F: { isolated: 0xFEA9, final: 0xFEAA },
  0x0630: { isolated: 0xFEAB, final: 0xFEAC },
  0x0631: { isolated: 0xFEAD, final: 0xFEAE },
  0x0632: { isolated: 0xFEAF, final: 0xFEB0 },
  0x0633: { isolated: 0xFEB1, final: 0xFEB2, initial: 0xFEB3, medial: 0xFEB4 },
  0x0634: { isolated: 0xFEB5, final: 0xFEB6, initial: 0xFEB7, medial: 0xFEB8 },
  0x0635: { isolated: 0xFEB9, final: 0xFEBA, initial: 0xFEBB, medial: 0xFEBC },
  0x0636: { isolated: 0xFEBD, final: 0xFEBE, initial: 0xFEBF, medial: 0xFEC0 },
  0x0637: { isolated: 0xFEC1, final: 0xFEC2, initial: 0xFEC3, medial: 0xFEC4 },
  0x0638: { isolated: 0xFEC5, final: 0xFEC6, initial: 0xFEC7, medial: 0xFEC8 },
  0x0639: { isolated: 0xFEC9, final: 0xFECA, initial: 0xFECB, medial: 0xFECC },
  0x063A: { isolated: 0xFECD, final: 0xFECE, initial: 0xFECF, medial: 0xFED0 },
  0x0640: { isolated: 0x0640, final: 0x0640, initial: 0x0640, medial: 0x0640 },
  0x0641: { isolated: 0xFED1, final: 0xFED2, initial: 0xFED3, medial: 0xFED4 },
  0x0642: { isolated: 0xFED5, final: 0xFED6, initial: 0xFED7, medial: 0xFED8 },
  0x0643: { isolated: 0xFED9, final: 0xFEDA, initial: 0xFEDB, medial: 0xFEDC },
  0x0644: { isolated: 0xFEDD, final: 0xFEDE, initial: 0xFEDF, medial: 0xFEE0 },
  0x0645: { isolated: 0xFEE1, final: 0xFEE2, initial: 0xFEE3, medial: 0xFEE4 },
  0x0646: { isolated: 0xFEE5, final: 0xFEE6, initial: 0xFEE7, medial: 0xFEE8 },
  0x0647: { isolated: 0xFEE9, final: 0xFEEA, initial: 0xFEEB, medial: 0xFEEC },
  0x0648: { isolated: 0xFEED, final: 0xFEEE },
  0x0649: { isolated: 0xFEEF, final: 0xFEF0, initial: 0xFEF3, medial: 0xFEF4 },
  0x064A: { isolated: 0xFEF1, final: 0xFEF2, initial: 0xFEF3, medial: 0xFEF4 },
};

const LAM_ALEF_LIGATURES = {
  0x0622: { isolated: 0xFEF5, final: 0xFEF6 },
  0x0623: { isolated: 0xFEF7, final: 0xFEF8 },
  0x0625: { isolated: 0xFEF9, final: 0xFEFA },
  0x0627: { isolated: 0xFEFB, final: 0xFEFC },
};

function isDualJoining(code) {
  const g = ARABIC_GLYPHS[code];
  return Boolean(g && g.initial && g.medial);
}

function isRightJoining(code) {
  const g = ARABIC_GLYPHS[code];
  return Boolean(g && !g.initial && g.final && g.final !== g.isolated);
}

function hasArabic(text) {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

function shapeArabicWord(word) {
  if (!word) return '';
  const chars = [];
  for (let i = 0; i < word.length; i++) {
    const code = word.charCodeAt(i);
    if (code >= 0x064B && code <= 0x065F) continue;
    chars.push(code);
  }

  const result = [];
  let prevConnected = false;

  for (let i = 0; i < chars.length; i++) {
    const code = chars[i];
    const nextCode = i + 1 < chars.length ? chars[i + 1] : 0;

    if (code === 0x0644 && nextCode in LAM_ALEF_LIGATURES) {
      const lig = LAM_ALEF_LIGATURES[nextCode];
      if (prevConnected) {
        result.push(String.fromCharCode(lig.final));
      } else {
        result.push(String.fromCharCode(lig.isolated));
      }
      prevConnected = false;
      i++;
      continue;
    }

    const glyph = ARABIC_GLYPHS[code];
    if (!glyph) {
      result.push(String.fromCharCode(code));
      prevConnected = false;
      continue;
    }

    const nextCanConnectBefore = nextCode !== 0 && (isDualJoining(nextCode) || isRightJoining(nextCode));

    if (isDualJoining(code)) {
      if (prevConnected && nextCanConnectBefore) {
        result.push(String.fromCharCode(glyph.medial || glyph.isolated));
        prevConnected = true;
      } else if (prevConnected) {
        result.push(String.fromCharCode(glyph.final));
        prevConnected = false;
      } else if (nextCanConnectBefore) {
        result.push(String.fromCharCode(glyph.initial || glyph.isolated));
        prevConnected = true;
      } else {
        result.push(String.fromCharCode(glyph.isolated));
        prevConnected = false;
      }
    } else if (isRightJoining(code)) {
      if (prevConnected) {
        result.push(String.fromCharCode(glyph.final));
      } else {
        result.push(String.fromCharCode(glyph.isolated));
      }
      prevConnected = false;
    } else {
      result.push(String.fromCharCode(glyph.isolated));
      prevConnected = false;
    }
  }

  return result.join('');
}

const BRACKET_MIRRORS = {
  '(': ')',
  ')': '(',
  '[': ']',
  ']': '[',
  '{': '}',
  '}': '{',
  '<': '>',
  '>': '<',
  '«': '»',
  '»': '«',
};

function tokenizeForBidi(text) {
  const tokens = [];
  let i = 0;
  const n = text.length;

  while (i < n) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      let space = '';
      while (i < n && /\s/.test(text[i])) {
        space += text[i];
        i++;
      }
      tokens.push({ type: 'WHITESPACE', value: space });
      continue;
    }

    if (ch in BRACKET_MIRRORS) {
      tokens.push({ type: 'PUNCTUATION', value: ch });
      i++;
      continue;
    }

    if (hasArabic(ch)) {
      let arabicStr = '';
      while (i < n && (hasArabic(text[i]) || (text[i].charCodeAt(0) >= 0x064B && text[i].charCodeAt(0) <= 0x065F))) {
        arabicStr += text[i];
        i++;
      }
      tokens.push({ type: 'ARABIC', value: arabicStr });
      continue;
    }

    let ltrStr = '';
    while (
      i < n &&
      !/\s/.test(text[i]) &&
      !(text[i] in BRACKET_MIRRORS) &&
      !hasArabic(text[i])
    ) {
      ltrStr += text[i];
      i++;
    }

    if (ltrStr) {
      tokens.push({ type: 'LTR_CONTENT', value: ltrStr });
    }
  }

  return tokens;
}

function shapeBidi(text, isRtl) {
  if (!text) return '';
  const str = String(text);
  const targetRtl = isRtl !== undefined ? isRtl : hasArabic(str);

  if (!targetRtl && !hasArabic(str)) {
    return str;
  }

  if (str.includes('\n')) {
    return str.split('\n').map((line) => shapeBidi(line, targetRtl)).join('\n');
  }

  const tokens = tokenizeForBidi(str);
  if (tokens.length === 0) return '';

  if (targetRtl) {
    const reversedTokens = [...tokens].reverse();
    const resultTokens = reversedTokens.map((token) => {
      if (token.type === 'ARABIC') {
        const shaped = shapeArabicWord(token.value);
        return shaped.split('').reverse().join('');
      } else if (token.type === 'PUNCTUATION') {
        return BRACKET_MIRRORS[token.value] || token.value;
      } else {
        return token.value;
      }
    });
    return resultTokens.join('');
  } else {
    const resultTokens = tokens.map((token) => {
      if (token.type === 'ARABIC') {
        const shaped = shapeArabicWord(token.value);
        return shaped.split('').reverse().join('');
      }
      return token.value;
    });
    return resultTokens.join('');
  }
}

module.exports = {
  shapeBidi,
  shapeArabic: (t) => shapeBidi(t, true),
  shapeArabicWord,
  hasArabic,
};
