import type { Sequence } from 'csdm/common/types/sequence';
import { createReducer } from '@reduxjs/toolkit';
import {
  addSequence,
  deleteSequence,
  deleteSequences,
  generatePlayerDeathsSequences,
  generatePlayerKillsSequences,
  generatePlayerRoundsSequences,
  generatePlayerSequences,
  replaceSequences,
  updateSequence,
} from './sequences-actions';
import { buildPlayerEventSequences } from './build-player-event-sequences';
import { buildPlayerRoundsSequences } from './build-player-rounds-sequences';
import { PlayerSequenceEvent } from './player-sequence-event';
import { assertNever } from 'csdm/common/assert-never';

export type SequencesByDemoFilePath = { [demoFilePath: string]: Sequence[] | undefined };

const initialState: SequencesByDemoFilePath = {};

export const sequencesReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(addSequence, (state, action) => {
      const { sequence, demoFilePath } = action.payload;
      const sequences = state[demoFilePath] ?? [];
      const sequenceAlreadyExists = sequences.some(({ number, startTick, endTick }) => {
        return number === sequence.number || (startTick === sequence.startTick && endTick === sequence.endTick);
      });
      if (sequenceAlreadyExists) {
        return;
      }

      sequences.push(sequence);
      state[demoFilePath] = sequences;
    })
    .addCase(deleteSequence, (state, action) => {
      const sequences = state[action.payload.demoFilePath] ?? [];
      state[action.payload.demoFilePath] = sequences.filter(
        (sequence) => sequence.number !== action.payload.sequence.number,
      );
    })
    .addCase(updateSequence, (state, action) => {
      const sequences = state[action.payload.demoFilePath] ?? [];
      const sequenceToUpdateIndex = sequences.findIndex(
        (sequence) => sequence.number === action.payload.sequence.number,
      );
      if (sequenceToUpdateIndex > -1) {
        sequences[sequenceToUpdateIndex] = action.payload.sequence;
      }
    })
    .addCase(deleteSequences, (state, action) => {
      state[action.payload.demoFilePath] = [];
    })
    .addCase(replaceSequences, (state, action) => {
      state[action.payload.demoFilePath] = action.payload.sequences;
    })
    .addCase(generatePlayerKillsSequences, (state, action) => {
      const { match, steamId } = action.payload;
      const sequences = buildPlayerEventSequences({
        event: PlayerSequenceEvent.Kills,
        match,
        steamId,
        perspective: action.payload.perspective,
        startSecondsBeforeEvent: 5,
        showOnlyDeathNotices: true,
      });
      state[match.demoFilePath] = sequences;
    })
    .addCase(generatePlayerDeathsSequences, (state, action) => {
      const { match, steamId } = action.payload;
      const sequences = buildPlayerEventSequences({
        event: PlayerSequenceEvent.Deaths,
        match,
        steamId,
        perspective: action.payload.perspective,
        startSecondsBeforeEvent: 5,
        showOnlyDeathNotices: true,
      });
      state[match.demoFilePath] = sequences;
    })
    .addCase(generatePlayerSequences, (state, action) => {
      const { match, steamId, event, weapons, startSecondsBeforeEvent, endSecondsAfterEvent } = action.payload;
      switch (event) {
        case PlayerSequenceEvent.Rounds: {
          state[match.demoFilePath] = buildPlayerRoundsSequences(
            match,
            steamId,
            startSecondsBeforeEvent,
            endSecondsAfterEvent,
          );
          break;
        }
        case PlayerSequenceEvent.Kills:
        case PlayerSequenceEvent.Deaths: {
          state[match.demoFilePath] = buildPlayerEventSequences({
            event,
            match,
            steamId,
            perspective: action.payload.perspective,
            startSecondsBeforeEvent,
            showOnlyDeathNotices: true,
            weapons,
          });
          break;
        }
        default:
          return assertNever(event, `Unknown player sequence event: ${event}`);
      }
    })
    .addCase(generatePlayerRoundsSequences, (state, action) => {
      const { match, steamId } = action.payload;
      const sequences = buildPlayerRoundsSequences(match, steamId, 0, 0);
      state[match.demoFilePath] = sequences;
    });
});
