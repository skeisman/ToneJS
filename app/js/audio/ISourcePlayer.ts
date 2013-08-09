/// <reference path="../utils/IEventDispatcher.ts" />
/// <reference path="../models/ValueObjects.d.ts" />
/**
 * Describes an instrument.
 */
interface ISourcePlayer extends IEventDispatcher {
    isLoaded:bool;
    play(trigger:ITriggerData, destination:AudioNode):AudioGainNode;
    load():void;
    getSourceData():ISourceData;
}