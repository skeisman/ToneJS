
/// <reference path="../interfaces/webaudioapi/waa-20120802.d.ts" />
/// <reference path="BrowserAudioContext.ts" />
/// <reference path="../services/ArrangementService.ts" />
/// <reference path="../models/ValueObjects.d.ts" />
/// <reference path="../utils/EventDispatcher.ts" />
/// <reference path="ISourcePlayer.ts" />
/// <reference path="SourceFactory.ts" />

/**
 * @constructor
 *
 * This class uses a collection of "triggers" (note data) to schedule audioNodes in the audioContext.
 *
 * @param {ArrangementService} arrangementService
 */
class Player extends EventDispatcher {
    private a:IArrangementData;
    public ps:IPlaybackState;

    private lastStartTime:number;
    private lastContextStartTime:number;
    private lastPreviewNode:AudioGainNode;

    private channelSourceMap:any={};
    private channelSources:ISourcePlayer[];
    private channelNodes:AudioNode[];
    private audioContext:webkitAudioContext;
    private compressorNode:DynamicsCompressorNode;
    private masterGainNode:AudioGainNode;

    public isPlaying:bool=false;
    public isLooping:bool=false;
    public isStereo:bool=false;
    private loopingPatternDuration:number;
    private playingPatternData:ITriggerData[][];
    private schedulingInterval:number;
    private updateInterval:number;

    static $inject=["arrangementService"];


    constructor(public arrangementService:ArrangementService) {
        super();
        var me=this;
        me.ps=<IPlaybackState>{
            isPlaying: false,
            currentTime: 0,
            currentPattern: [
                []
            ],
            currentPatternIndex: 0,
            currentRowIndex: 0,
            currentSequenceIndex: 0,
            totalDuration: 0
        };

        me.initAudioNodes();
    }

    /**
     * Set the arrangement data.
     * @param {IArrangementData} arrangement
     */
    public setArrangement(arrangement:IArrangementData) {
        var me=this;
        me.a = arrangement;
        me.seekTo(0);
        me.resetChannelNodes();
    }

    /**
     * Creates the basic required audio nodes for playback.
     */
    private initAudioNodes() {
        var me=this;
        me.audioContext = BrowserAudioContext.getInstance();
        me.masterGainNode = me.audioContext.createGainNode();
        me.masterGainNode.connect(me.audioContext.destination);
        me.compressorNode = me.audioContext.createDynamicsCompressor();
        me.compressorNode.connect(me.masterGainNode);
    }

    /**
     * Starts the playback with an optional start time.
     * If the timeStart parameter is omitted, playback will start at the last playing time.
     *
     * The playback process is described inline.
     *
     * @param {number} timeStart
     */
    public play(timeStart?:number):void {
        var me=this;
        if (!timeStart) {
            timeStart = me.ps.currentTime || 0;
        }

        if (me.isPlaying)
            me.stop();

        me.isLooping=false;
        me.resetChannelNodes();
        me.lastStartTime = timeStart;
        me.lastContextStartTime = me.audioContext.currentTime;
        var spr:number=me.arrangementService.getSecondsPerRow(me.a.bpm);

        me.isPlaying = true;
        me.fire("play", this);

        // join all the patterns together into one large pattern.
        me.playingPatternData= me.arrangementService.flattenArrangementPatterns(me.a);

        // Some browsers only allow you to create one audio context in a page.
        // Once created The me.audioContext.currentTime is constantly rolling forward.
        // All events must be scheduled relative to the audioContext.currentTime.

        // offset is the difference between the pattern's currenttime and the audioContext's currentTime.
        // An startTime is calculated for every trigger relative to the arrangement.
        // The offset is added to each trigger's start time to sync with the audioContext currentTime.
        var offset:number = me.lastContextStartTime - timeStart+ 0.3;
        me.playingPatternData = me.setTriggerTimes(me.playingPatternData, offset);

        // updates the playback data and fires a progress event once per position or every 30th of a second.
        me.updateInterval = setInterval(me.updatePlaybackState.bind(this), Math.max(spr*1000,33));

        // If we schedule all the audioNodes at the same time iOS performance suffers.
        // We add each upcoming audioNodes to the audioContext when it is about the play.
        me.schedulingInterval=setInterval(me.scheduleNotes.bind(this),500);
        me.updatePlaybackState();
        me.scheduleNotes();
    }

    /**
     * Plays a short section of the arrangement.
     * Allows looping playback.
     *
     * @param {ITriggerData[][]} pattern
     * @param {number} timeStart
     * @param {number} loop
     */
    public playPattern(pattern:ITriggerData[][], timeStart:number, loop:number){
        var me=this;

        if (me.isPlaying)
            me.stop();

        me.resetChannelNodes();

        me.lastStartTime = timeStart;
        me.lastContextStartTime = me.audioContext.currentTime;
        var spr:number=me.arrangementService.getSecondsPerRow(me.a.bpm);

        me.isPlaying = true;
        me.fire("play", this);


        var patternData= me.arrangementService.clonePattern( pattern);
        if(loop){
            for(var i=0;i<loop;i++){
                patternData= me.arrangementService.joinPatterns(patternData,pattern);
            }
            me.isLooping=true;
        }
        me.playingPatternData=patternData;
        me.loopingPatternDuration= spr* pattern[0].length;
        var offset:number = me.lastContextStartTime+0.3;
        me.playingPatternData = me.setTriggerTimes(me.playingPatternData, offset);
        me.updateInterval = setInterval(me.updatePlaybackState.bind(this), Math.max(spr*1000,33));
        me.schedulingInterval=setInterval(me.scheduleNotes.bind(this),500);
        me.updatePlaybackState();
        me.scheduleNotes();
    }

    /**
     * If you schedule too many future audioNodes, iOS performance suffers greatly.
     * This adds audioNodes to the audioContext that must be executed soon.
     */
    private scheduleNotes(){
        var me=this;
        var node:AudioNode;
        var source:ISourcePlayer;
        var trigger:ITriggerData;
        var patternData:ITriggerData[][]=me.playingPatternData;
        var channel:ITriggerData[];
        var contextCurrentTime=me.audioContext.currentTime;
        for (var i = 0; i < patternData.length; i++) {
            node = me.channelNodes[i];
            source = me.channelSources[i];
            channel= patternData[i];
            trigger=<ITriggerData>channel.shift();

            while(trigger && !trigger.timeStart){
                trigger=<ITriggerData>channel.shift();
            }
            while(trigger && trigger.timeStart < contextCurrentTime+1){
                if (trigger && trigger.vol > 0 && trigger.timeStart > contextCurrentTime) {
                    source.play(trigger, node);
                }
                trigger=<ITriggerData>channel.shift();
                while(trigger && !trigger.timeStart){
                    trigger=<ITriggerData>channel.shift();
                }
            }
            if (trigger && trigger.vol > 0 && trigger.timeStart > contextCurrentTime) {
                channel.unshift(trigger);
            }

        }
    }

    /**
     * When you disconnect an audioNode from the context, all of its children are also disconnected.
     * This allows you to cancel all future audioNodes that have not yet played.
     * This also allows the browser to garbage collect all unused nodes.
     */
    private resetChannelNodes(){
        var me=this;
        if(me.channelNodes){
            for (var i = 0; i < me.channelNodes.length; i++) {
                me.channelNodes[i].disconnect();
            }
        }

        me.channelNodes = [];

        var splitter:AudioChannelMerger;
        var merger:AudioChannelMerger;
        var left:AudioGainNode;
        var right:AudioGainNode;
        var channelData:IChannelData;

        for (var i = 0; i < me.a.channels.length; i++) {
            channelData=me.a.channels[i];
            if(me.isStereo){
                splitter = me.audioContext.createChannelMerger();
                left=me.audioContext.createGainNode();
                //between 0-1;
                var pan=(1+Number(channelData.pan))*0.5;
                var pi_2=Math.PI/2;
                var vol=Number(channelData.vol);
                left.gain.value=Math.sin(pan*pi_2)* vol;
                right=me.audioContext.createGainNode();
                right.gain.value=Math.cos(pan*pi_2)*vol;
                splitter.connect(left);
                splitter.connect(right);
                merger= me.audioContext.createChannelMerger(2);
                left.connect(merger,0,0);
                right.connect(merger,0,1);
                merger.connect(me.compressorNode);
                me.channelNodes.push(splitter);
            }else{
                left=me.audioContext.createGainNode();
                left.gain.value=channelData.vol;
                left.connect(me.compressorNode);
                me.channelNodes.push(left);
            }

        }
    }

    /**
     * Plays a single note using the loaded instruments.
     *
     * @param {number} channelIndex
     * @param {ITriggerData} trigger
     */
    public playNote(channelIndex:number, trigger:ITriggerData){
        var me=this;
        if(trigger.vol<=0)return;

        if(!me.channelNodes)  {
            me.resetChannelNodes()
        }
        if(me.lastPreviewNode){
            me.lastPreviewNode.gain.exponentialRampToValueAtTime(0,me.audioContext.currentTime+0.5);
        }
        var source:ISourcePlayer= me.channelSources[channelIndex];
        var channel:AudioNode= me.channelNodes[channelIndex];
        var trigger:ITriggerData={
            note:trigger.note,
            vol:trigger.vol,
            timeStart:me.audioContext.currentTime+.02,
            timeEnd:null
        };
        me.lastPreviewNode= source.play(trigger,channel);
    }

    /**
     * This method is called at an arbitrary interval to recalculate the current playback state.
     * The playback state allows other classes to monitor the playback progress.
     */
    private updatePlaybackState():void {
        var me=this;

        var totalDuration = me.arrangementService.getArrangementDuration(me.a);
        var currentTime = me.lastStartTime + (me.audioContext.currentTime - me.lastContextStartTime);
        if(me.isLooping){
            currentTime= me.lastStartTime + (me.audioContext.currentTime - me.lastContextStartTime)% me.loopingPatternDuration;
        }
        if (currentTime > totalDuration) {
            //past the end of the arrangement
            //stop
            currentTime = 0;
            me.resetChannelNodes();
            clearInterval(me.schedulingInterval);
            clearInterval(me.updateInterval);
            me.isPlaying = false;
            me.fire("stop", this);
        }
        me.seekTo(currentTime);
    }

    /**
     * Causes the playback to jump to a specific location.
     *
     * @param {number} time
     */
    public seekTo(time:number):void {
        var me=this;
        me.ps=me.arrangementService.getPlaybackStateForTime(me.a,time);
        me.fire("playbackStateChanged", me.ps);
    }

    /**
     * stops the playback
     */
    public stop():void {
        var me=this;
        if(!me.isPlaying)return;
        if (!me.channelNodes)return;

        me.resetChannelNodes();
        clearInterval(me.updateInterval);
        clearInterval(me.schedulingInterval);

        me.updatePlaybackState();
        me.isLooping=false;
        me.isPlaying = false;
        me.fire("stop", this);
    }

    /**
     * Tells each instrument to load/initialize
     */
    public loadSources():void {
        var me=this;
        me.channelSources = [];
        var channels:IChannelData[] = me.a.channels;
        var channel:IChannelData;
        var sourceData:ISourceData;
        var sourcePlayer:ISourcePlayer;
        var toLoad = 0;

        for (var i = 0; i < channels.length; i++) {
            channel = channels[i];
            sourceData=channel.source;
            sourcePlayer=me.channelSourceMap[sourceData.name];
            if(!sourcePlayer){
                sourcePlayer = SourceFactory.createInstance(channel.source);
                sourcePlayer.on("load", function(){
                    toLoad--;
                    if (toLoad == 0) {
                        me.fire("load", this);
                    }
                });
                toLoad++;
                sourcePlayer.load();
            }
            me.resetChannelNodes();
            me.channelSourceMap[sourceData.name]= sourcePlayer;
            me.channelSources[i] = sourcePlayer;
        }
    }

    /**
     * Calculates the time offset of each trigger and adds an offset to that value.
     *
     * @param {ITriggerData[][]} data
     * @param {number} offset
     * @returns {ITriggerData[][]}
     */
    private setTriggerTimes(data:ITriggerData[][], offset:number):ITriggerData[][] {
        var me=this;
        var spr:number = me.arrangementService.getSecondsPerRow(me.a.bpm);
        var channelTriggers:ITriggerData[];
        var lastActiveTrigger:ITriggerData;
        var trigger:ITriggerData;
        for (var i = 0; i < data.length; i++) {
            channelTriggers = data[i];
            lastActiveTrigger = null;
            for (var j = 0, jj = channelTriggers.length; j < jj; j++) {
                trigger = channelTriggers[j];
                if (trigger.vol) {
                    trigger.timeStart = j * spr + offset;
                    if (lastActiveTrigger) {
                        lastActiveTrigger.timeEnd = trigger.timeStart;
                    }

                    lastActiveTrigger = trigger;
                }
            }
        }
        return data;
    }

}


