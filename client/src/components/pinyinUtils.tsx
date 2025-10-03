import React from "react";

/**
 * Convert numeric-tone pinyin to diacritics.
 * - Supports 1–4 tones; 5 or 0 = neutral (no mark).
 * - Handles ü written as "ü", "u:" or "v".
 * - Applies correct placement rules (a/e priority, "ou" -> o, "iu/ui" -> second vowel).
 * - Preserves capitalization (e.g., Zhong1 -> Zhōng).
 */
export function pinyinNumericToAccents(input) {
  if (!input) return "";

  const toneMarks = {
    a: ["ā", "á", "ǎ", "à"],
    e: ["ē", "é", "ě", "è"],
    i: ["ī", "í", "ǐ", "ì"],
    o: ["ō", "ó", "ǒ", "ò"],
    u: ["ū", "ú", "ǔ", "ù"],
    "ü": ["ǖ", "ǘ", "ǚ", "ǜ"],
  };

  const vowels = ["a", "e", "i", "o", "u", "ü"];

  // Replace all syllables ending with a tone number
  return input.replace(
    /([A-Za-züv:]+?)([1-5]|0)(?=\b|[^A-Za-zü:])/g,
    (_, rawSyllable, toneStr) => {
      const tone = parseInt(toneStr, 10);
      // neutral tone: just drop the number and normalize ü forms
      if (tone === 5 || tone === 0) {
        return normalizeUmlaut(rawSyllable);
      }

      // Normalize ü variants inside the syllable
      let syllable = normalizeUmlaut(rawSyllable);

      // Decide which vowel to mark
      const lower = syllable.toLowerCase();

      // Find index to mark based on pinyin rules
      const idx = findMarkedVowelIndex(lower);

      if (idx === -1) return syllable; // nothing to mark

      const charToMark = syllable[idx];
      const lowerChar = lower[idx];

      // Safety: if target isn't a vowel, return unchanged
      if (!vowels.includes(lowerChar)) return syllable;

      // Get diacritic for tone (1–4)
      const mark = toneMarks[lowerChar][tone - 1];

      // Preserve case
      const markedChar =
        charToMark === charToMark.toUpperCase() ? mark.toUpperCase() : mark;

      return syllable.slice(0, idx) + markedChar + syllable.slice(idx + 1);
    }
  );

  // --- helpers ---

  function normalizeUmlaut(s) {
    // accept ü, u:, U:, v, V
    return s
      .replace(/u:/g, "ü")
      .replace(/U:/g, "Ü")
      .replace(/v/g, "ü")
      .replace(/V/g, "Ü");
  }

  function findMarkedVowelIndex(lower) {
    // Rule 1: if 'a' present -> mark 'a'
    let i = lower.indexOf("a");
    if (i !== -1) return i;

    // Rule 2: else if 'e' present -> mark 'e'
    i = lower.indexOf("e");
    if (i !== -1) return i;

    // Rule 3: else if contains "ou" -> mark 'o'
    i = lower.indexOf("ou");
    if (i !== -1) return i;

    // Rule 4: in "iu" or "ui", mark the second vowel
    const iu = lower.indexOf("iu");
    if (iu !== -1) return iu + 1;
    const ui = lower.indexOf("ui");
    if (ui !== -1) return ui + 1;

    // Fallback: first vowel left-to-right
    for (let k = 0; k < lower.length; k++) {
      if ("aeiouü".includes(lower[k])) return k;
    }
    return -1;
  }
}

/* ---- Minimal demo component ---- */
export default function PinyinConverter() {
  const [src, setSrc] = React.useState("shi2 ta1 men5 Zhong1guo2 lü4 lv4 lu:4 liu2 gui4");
  const out = React.useMemo(() => pinyinNumericToAccents(src), [src]);

  return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      <h1 className="text-2xl font-semibold">Pinyin Tone Converter</h1>
      <textarea
        className="w-full p-3 rounded-xl border outline-none"
        rows={4}
        value={src}
        onChange={(e) => setSrc(e.target.value)}
        placeholder="Type pinyin with numbers (e.g., ni3 hao3, Zhong1guo2)"
      />
      <div className="p-3 rounded-xl bg-gray-50 border">
        <div className="text-sm text-gray-500 mb-1">Converted:</div>
        <div className="text-lg break-words">{out}</div>
      </div>
    </div>
  );
}
