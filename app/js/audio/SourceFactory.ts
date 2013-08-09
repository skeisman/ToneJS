
/// <reference path="../models/ValueObjects.d.ts" />
/// <reference path="ISourcePlayer.ts" />
/// <reference path="WavTable.ts" />

/**
 * Creates each instrument
 * There is currently only one type of instrument.
 * In the future we may add additional types like synths
 */
class SourceFactory {
    static WAV_TABLE = "wavTable";
    static SYNTH = "synth";
    static createInstance(data:ISourceData):ISourcePlayer {
        var instance:ISourcePlayer;
        switch (data.type) {
            case WAV_TABLE:
                instance = new WavTable(data);
                break;
            case SYNTH:
                // TODO create synth
                break;
        }
        return instance;
    }
}

