/**
 * 五声音阶 — 宫商角徵羽（相对宫的半音）
 */

export const GONG_SEMITONES = Object.freeze([0, 2, 4, 7, 9]);

export const MODE_ROOT_DEGREE = Object.freeze({
  gong: 1,
  shang: 2,
  jue: 3,
  zhi: 5,
  yu: 6,
});

export const DEGREE_ORDER = Object.freeze([1, 2, 3, 5, 6]);

/** @param {number} degree 1|2|3|5|6 */
export function degreeToSemitone(degree) {
  const i = DEGREE_ORDER.indexOf(degree);
  if (i < 0) throw new Error(`invalid degree: ${degree}`);
  return GONG_SEMITONES[i];
}

/**
 * @param {number} gongMidi 宫音 MIDI
 * @param {number} degree
 * @param {number} [octaveOffset]
 */
export function degreeToMidi(gongMidi, degree, octaveOffset = 0) {
  return gongMidi + degreeToSemitone(degree) + octaveOffset * 12;
}

/**
 * Expand compact pattern: [degree, beats] or [degree, beats, octave]
 * into schedule entries with cumulative beat times.
 * @param {Array<[number, number]|[number, number, number]|null>} pattern
 * @param {number} gongMidi
 */
export function expandPattern(pattern, gongMidi) {
  let beat = 0;
  const notes = [];
  for (const item of pattern) {
    if (item == null) {
      beat += 1;
      continue;
    }
    const [degree, dur, oct = 0] = item;
    if (degree === 0) {
      beat += dur;
      continue;
    }
    notes.push({
      midi: degreeToMidi(gongMidi, degree, oct),
      beat,
      duration: dur,
      degree,
    });
    beat += dur;
  }
  return { notes, totalBeats: beat };
}
