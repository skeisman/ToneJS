/// <reference path="../models/ValueObjects.d.ts" />
/// <reference path="../interfaces/webaudioapi/waa-20120802.d.ts" />
/// <reference path="ISourcePlayer.ts" />
/// <reference path="BrowserAudioContext.ts" />
/// <reference path="../utils/EventDispatcher.ts" />

/**
 * This class represents an instrument that is composed of one or more audio samples.
 * When a note is played, the sample with the closest natural pitch is retrieved, and then played back faster or slower
 * to raise or lower the pitch to match the request.
 */
class WavTable extends EventDispatcher implements ISourcePlayer {

    isLoaded:bool;
    wavs:IWav[];
    loadingQueue:IWav[];
    loadingItem:IWav;

    constructor(public sourceData:ISourceData) {
        super();
        this.wavs = this.sourceData.data;
    }

    play(trigger:ITriggerData, destination:AudioNode):AudioGainNode {
        var wav:IWav = this.getClosestWav(trigger.note);
        var delta:number = trigger.note - wav.note;
        var rate:number = Math.pow(2, delta / 12);
        var source:AudioBufferSourceNode = destination.context.createBufferSource();
        source.buffer = wav.audioBuffer;
        source.playbackRate.value = rate;
        source.noteOn(trigger.timeStart);
        var gain:AudioGainNode = destination.context.createGainNode();
        gain.gain.value = trigger.vol;

        if (trigger.timeEnd) {
            gain.gain.setValueAtTime(trigger.vol,trigger.timeEnd-0.1);
            gain.gain.exponentialRampToValueAtTime (0,trigger.timeEnd);
            source.noteOff(trigger.timeEnd);
        }
        source.connect(gain);
        gain.connect(destination);

        return gain;
    }

    getClosestWav(index:number) {
        var closest:number = -1000;
        var wav:IWav;
        for (var i = 0; i < this.wavs.length; i++) {
            wav = this.wavs[i];
            if (wav.note == index) {
                return wav;
            } else {
                closest = Math.abs(wav.note - index) < Math.abs(closest - index) ? wav.note : closest;
            }

        }
        return this.getClosestWav(closest);
    }

    load():void {
        this.loadingQueue = <IWav[]>this.wavs.concat();
        this.loadNext();
    }

    loadNext() {
        if (this.loadingQueue.length) {
            this.loadingItem = <IWav>this.loadingQueue.pop();
            var req:XMLHttpRequest = new XMLHttpRequest();
            req.open("GET", this.loadingItem.url);
            req.responseType = "arraybuffer";
            req.onload = this.onFileLoaded.bind(this);
            req.send();
        } else {
            this.fire("load", this);
        }
    }

    onFileLoaded(e:Event):void {
        var target:XMLHttpRequest = <XMLHttpRequest>e.target;
        var arrayBuffer:ArrayBuffer = target.response;
        BrowserAudioContext.getInstance().decodeAudioData(arrayBuffer, this.onDecode.bind(this));
    }

    onDecode(audioBuffer:AudioBuffer):void {
        this.loadingItem.audioBuffer = audioBuffer;
        this.loadNext();
    }

    getSourceData():ISourceData {
        var data:ISourceData;
        return data;
    }
}
