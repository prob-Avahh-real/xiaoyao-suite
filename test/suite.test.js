import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSuite, SUITE_META, movementCount, getMovement } from '../src/suite.js';
import { expandPattern, degreeToMidi, degreeToSemitone } from '../src/theory.js';

describe('theory', () => {
  it('maps pentatonic degrees to semitones', () => {
    assert.equal(degreeToSemitone(1), 0);
    assert.equal(degreeToSemitone(6), 9);
  });

  it('expands half-beat patterns', () => {
    const { notes, totalBeats } = expandPattern(
      [
        [3, 0.5],
        [5, 0.5],
        [0, 1],
      ],
      60
    );
    assert.equal(totalBeats, 2);
    assert.equal(notes.length, 2);
    assert.equal(notes[1].midi, degreeToMidi(60, 5));
    assert.equal(notes[1].beat, 0.5);
  });
});

describe('suite', () => {
  it('has seven movements', () => {
    assert.equal(movementCount(), 7);
    assert.equal(buildSuite().length, 7);
    assert.equal(SUITE_META.movements, 7);
  });

  it('each movement has melody and epigraph', () => {
    for (const m of buildSuite()) {
      assert.ok(m.melody.length > 0, `${m.id} melody`);
      assert.ok(m.tempo > 0);
      assert.ok(m.durationSec > 0);
      assert.ok(m.epigraph.length > 0);
      assert.ok(m.drones.length >= 1);
    }
  });

  it('wraps movement index', () => {
    assert.equal(getMovement(-1).id, 'you');
    assert.equal(getMovement(7).id, 'ming');
  });

  it('follows 冥化抟笑椿御游 order', () => {
    const titles = buildSuite().map((m) => m.title);
    assert.deepEqual(titles, ['冥', '化', '抟', '笑', '椿', '御', '游']);
  });
});
