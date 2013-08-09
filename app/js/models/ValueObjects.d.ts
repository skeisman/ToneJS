/// <reference path="../interfaces/webaudioapi/waa-20120802.d.ts" />

/*
    This file contains definitions for all of the value object that are used in this application.
    You can cast JSON objects to these interfaces to improve code completion and type checking.
 */

/**
 * Used to store the state of the AutoChord modal menu when it is not visible.
 */
interface IAutoChordState {
    root:number;
    scale:number[];
    chord:number[];
    octaveStart:number;
    octaveEnd:number;
    fill:string;
}

/**
 * Describes the currently pattern selection
 */
interface ISelectionState {
    startChannel:number;
    endChannel:number;
    startPosition:number;
    endPosition:number;
    lastPosition:number;
    lastChannel:number;
}

/**
 * Stores commonly used values and the state of this application.
 */
interface IApplicationState {
    copiedTriggers:ITriggerData[][];
    cellWidth:number;
    cellHeight:number;
    highlights:number[];
    selection:ISelectionState;
    autoChordState:IAutoChordState;
    a:IArrangementData;
    ps:IPlaybackState;
}

/**
 * Describes the scroll state for a scrollable area
 */
interface IScrollState {
    scrollX:number;
    scrollY:number;
    maxScrollX:number;
    maxScrollY:number;
}

/**
 * Describes a note.
 */
interface ITriggerData {
    note:number;
    vol:number;
    timeStart:number;
    timeEnd:number;
}

/**
 * Describes an Instrument
 */
interface ISourceData {
    name:string;
    type:string;
    data:any;
}

/**
 * Describes a playback channel
 */
interface IChannelData{
    vol:number;
    pan:number;
    source:ISourceData;
}

/**
 * Describes a single sample that is used inside of a WavTable ISourcePlayer.
 */
interface IWav {
    note:number;
    url:string;
    audioBuffer:AudioBuffer;
}

/**
 * Describes a whole musical composition.
 */
interface IArrangementData{
    sequence:number[];
    patterns:ITriggerData[][][];
    channels:IChannelData[];
    bpm:number;
    title:string;
    date:number;
    highlight1:number;
    highlight2:number;
}

/**
 * Describes the audio players playback progress.
 */
interface IPlaybackState{
    currentTime:number;
    currentRowIndex:number;
    currentSequenceIndex:number;
    totalDuration:number;
}

/**
 * Describes an individual chord.
 */
interface IChordInfo {
    pos:number;
    root:number;
    label:string;
    notes:number[];
}


