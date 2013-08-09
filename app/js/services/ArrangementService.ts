/**
 * Provides utility methods for editing song data.
 *
 * @param musicTheory
 * @param $http
 * @param $q
 *
 * @constructor
 */
class ArrangementService{
    static $inject=["musicTheory","$http","$q"];
    constructor(public musicTheory:MusicTheory, public $http:ng.IHttpService, public $q:ng.IQService){

    }

    fillTypes:string[]=[
        'Arpeggio ASC',
        'Arpeggio DESC',
        'Arpeggio ASC DESC',
        'Arpeggio DESC ASC',
        'Random'
    ];

    private static SONG_PREFIX:string="Song Name ";
    getArrangementList():ng.IPromise{
        var me=this;
        var defer:ng.IDeferred=me.$q.defer();

        var songList=localStorage.getItem("SongList")||"{}";
        songList=JSON.parse(songList);
        var songListArray=[];
        for(var p in songList){
            songListArray.push(p);
        }
        defer.resolve(songListArray);

        return defer.promise;
    }

    openArrangement(url:string):ng.IPromise{
        var me=this;
        var defer:ng.IDeferred=me.$q.defer();
        me.$http.get(url).success(function(data, status, headers, config){

            data.patterns=me.decompressPattern(data.patterns);
            defer.resolve(data);
        });
        return defer.promise;
    }

    openLocalArrangement(title:string): ng.IPromise {
        var me=this;
        var defer:ng.IDeferred=me.$q.defer();
        var song=localStorage.getItem( ArrangementService.SONG_PREFIX + title);
        if(song) song=me.decompressPattern(JSON.parse(song));

        defer.resolve(song);

        return defer.promise;
    }

    saveLocalArrangement(arrangement:IArrangementData) :void{
        arrangement.date=new Date().getTime();
        arrangement=angular.copy(arrangement);
        arrangement.patterns=this.compressPatterns(arrangement.patterns);
        var songList=localStorage.getItem("SongList")||"{}";
        songList=JSON.parse(songList);
        songList[arrangement.title]= true;
        console.log(JSON.stringify(arrangement));
        localStorage.setItem("SongList",JSON.stringify(songList));
        localStorage.setItem(ArrangementService.SONG_PREFIX+arrangement.title,JSON.stringify(arrangement));
    }

    compressPatterns(patterns:ITriggerData[][][]):any[][][]{
        patterns=angular.copy(patterns);
        var pattern:any[][];
        var trigger:any;
        for(var k=0;k<patterns.length;k++){
            pattern=patterns[k];
            for(var i=0;i<pattern.length;i++){
                for(var j=0;j<pattern[i].length;j++){
                    trigger=pattern[i][j];
                    pattern[i][j]=trigger.vol==0?0:trigger;
                }
            }
        }

        return patterns
    }
    decompressPattern(patterns:any[][][]):ITriggerData[][][]{
        var me=this;
        patterns=angular.copy(patterns);
        var pattern:any[][];
        var trigger:any;
        for(var k=0;k<patterns.length;k++){
            pattern=patterns[k];
            for(var i=0;i<pattern.length;i++){
                for(var j=0;j<pattern[i].length;j++){
                    trigger=pattern[i][j];
                    pattern[i][j]=trigger===0?me.createEmptyTrigger():trigger;
                }
            }
        }
        return patterns
    }

    createMockArrangement():IArrangementData {
        var me=this;
        var majorTones:number[] = me.musicTheory.chords.Major;
        var data:IArrangementData = {
            bpm: 80,
            title: "",
            description:'',
            channels: me.createMockChannels(10),
            highlight1:4,
            highlight2:16,
            patterns: [
                me.createMockPattern(10, 16, 1, me.musicTheory.transposeNotes(me.musicTheory.chords.Major, 36)),
                me.createMockPattern(10, 64, 2, me.musicTheory.transposeNotes(me.musicTheory.chords.Minor, 40)),
                me.createMockPattern(10, 12, 4, me.musicTheory.transposeNotes(me.musicTheory.chords.Minor, 38)),
                me.createMockPattern(10, 12, 1, me.musicTheory.transposeNotes(me.musicTheory.chords.Maj7, 36))
            ],
            sequence: [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
            date:new Date().getTime()
        };
        return data;
    }

    createEmptyArrangement():IArrangementData {
        var me=this;
        var data:IArrangementData = {
            bpm: 80,
            highlight1:4,
            highlight2:16,
            title: "",
            description:'',
            channels: me.createMockChannels(10),
            patterns: [
                me.createEmptyPattern(10, 16)
            ],
            sequence: [0,0],
            date:new Date().getTime()

        };
        return data;
    }

    createMockChannels(channelCount:number):IChannelData[] {
        var data:IChannelData[] = [];
        for (var i = 0; i < 3; i++) {
            data.push({
                vol: 1,
                pan: i%2==0?-0.1:0.1,
                source: {
                "name":"Drums I",
                "type": "wavTable",
                "data": [
                    {"note": 36,"url": "data/drums1/TTloBrushkit.mp3"},
                    {"note": 38,"url": "data/drums1/TThi2Brushkit.mp3"},
                    {"note": 40,"url": "data/drums1/TThiBrushkit.mp3"},
                    {"note": 42,"url": "data/drums1/CONGA1.mp3"},
                    {"note": 44,"url": "data/drums1/CONGA2.mp3"},
                    {"note": 48,"url": "data/drums1/bdBrushkit.mp3"},
                    {"note": 50,"url": "data/drums1/SD6Brushkit.mp3"},
                    {"note": 51,"url": "data/drums1/SD6Brushkit.mp3"},
                    {"note": 52,"url": "data/drums1/CLAP1.mp3"},
                    {"note": 56,"url": "data/drums1/HIHAT01.mp3"},
                    {"note": 57,"url": "data/drums1/HHosBrushkit.mp3"},
                    {"note": 58,"url": "data/drums1/HHo2Brushkit.mp3"},
                    {"note": 59,"url": "data/drums1/TAMB.mp3"},
                    {"note": 60,"url": "data/drums1/Cy1Brushkit.mp3"},
                    {"note": 62,"url": "data/drums1/Cy2Brushkit.mp3"},
                    {"note": 70,"url": "data/drums1/CYMBAL03.mp3"},
                    {"note": 72,"url": "data/drums1/CYMBAL08.mp3"}
                ]
            }
            });
        }
        for (; i < channelCount; i++) {
            data.push({
                vol: 0.2,
                pan: i%2==0?-0.1:0.1,
                source:{
                    "name":"Cello",
                    "type": "wavTable",
                    "data": [
                        {"note": 24,"url": "data/cello/12.mp3"},
                        {"note": 30,"url": "data/cello/18.mp3"},
                        {"note": 36,"url": "data/cello/24.mp3"},
                        {"note": 42,"url": "data/cello/30.mp3"},
                        {"note": 48,"url": "data/cello/36.mp3"},
                        {"note": 54,"url": "data/cello/42.mp3"},
                        {"note": 60,"url": "data/cello/48.mp3"},
                        {"note": 66,"url": "data/cello/54.mp3"},
                        {"note": 72,"url": "data/cello/60.mp3"}
                    ]
                }
            })
        }
        return data;
    }

    createMockPattern(channelCount:number, length:number, every:number, tones:number[]):ITriggerData[][] {
        var me=this;
        var results:ITriggerData[][] = me.createEmptyPattern(channelCount, length);
        var channelIndex = 0;
        var toneIndex = 0;
        for (var rowIndex = 0; rowIndex < length; rowIndex += every) {

            results[channelIndex][rowIndex].note = tones[toneIndex];
            results[channelIndex][rowIndex].vol = 1 - ((rowIndex / length) * .7);
            channelIndex++;
            if (channelIndex >= channelCount)  channelIndex = 0;
            toneIndex++;
            if (toneIndex >= tones.length) toneIndex = 0;
        }
        return results
    }

    createEmptyPattern(channelCount:number, length:number):ITriggerData[][] {
        var results:ITriggerData[][] = [];

        for (var i = 0; i < channelCount; i++) {
            results[i] = [];
            for (var j = 0; j < length; j++) {
                results[i][j] = this.createEmptyTrigger();
            }
        }
        return results;
    }

    clearPattern(arrangement:IArrangementData, patternIndex){
        var oldPattern:ITriggerData[][]=arrangement.patterns[patternIndex];
        var newPattern=this.createEmptyPattern(oldPattern.length, oldPattern[0].length);

        for(var i=0;i<oldPattern.length;i++){
            oldPattern[i]=newPattern[i];
        }
    }

    addEmptyPatternChannel(arrangement:IArrangementData, index){

        var patternLength:number;
        var triggerData:ITriggerData[];
        for(var i=0;i<arrangement.patterns.length;i++){
            triggerData=[];
            patternLength= arrangement.patterns[i][0].length;
            for(var j=0;j<patternLength;j++){
                triggerData.push(this.createEmptyTrigger());
            }
            arrangement.patterns[i].splice(index,0,triggerData);
        }
        return arrangement;
    }

    removePatternChannel(arrangement:IArrangementData,index:number){
        if(arrangement.channels.length<=1) return arrangement;

        for(var i=0;i<arrangement.patterns.length;i++){
            arrangement.patterns[i].splice(index,1);
        }
        return arrangement;
    }

    clearPatternChannel(arrangement:IArrangementData,index:number):IArrangementData{
        this.removePatternChannel(arrangement,index);
        this.addEmptyPatternChannel(arrangement,index);
        return arrangement;
    }


    transposeTriggers(triggers:ITriggerData[][],transpose:number){
        for(var i=0;i<triggers.length;i++){
            for(var j=0;j<triggers[i].length;j++){
                triggers[i][j].note+=transpose;
            }
        }
    }

    randomizeVolume(triggers:ITriggerData[][],amount:number){
        var vol:number;
        for(var i=0;i<triggers.length;i++){
            for(var j=0;j<triggers[i].length;j++){
                vol= triggers[i][j].vol
                if(vol>0){
                    vol+=(Math.random()*amount) - amount*0.5;
                    vol= vol<=0?triggers[i][j].vol:vol;
                    vol=Math.min(vol,1);
                    triggers[i][j].vol=vol;
                }
            }
        }
    }

    deleteTriggers(triggers:ITriggerData[][]){
        for(var i=0;i<triggers.length;i++){
            for(var j=0;j<triggers[i].length;j++){
                triggers[i][j].vol=0;
            }
        }

    }

    autoChord(triggers:ITriggerData[][],notes:number[],type:string){
        var me=this;
        var lastNumberIndex=0;
        var isAsc:bool=true;
        var getNextNote;

        function asc():number{
            lastNumberIndex++;
            if(lastNumberIndex==notes.length) lastNumberIndex=0;
            return notes[lastNumberIndex];
        }
        function desc():number{
            lastNumberIndex--;
            if(lastNumberIndex<=0) lastNumberIndex=notes.length-1;
            return notes[lastNumberIndex];
        }
        function ascDesc(){
            if(isAsc){
                if(lastNumberIndex+1==notes.length){
                    isAsc=false;
                    return desc();
                }
                return asc();
            }else{
                if(lastNumberIndex-1<=0){
                    isAsc=true;
                    return asc();
                }
                return desc();
            }
        }
        function random(){
            return notes[Math.floor(Math.random()*notes.length)];
        }
        switch(type){
            case me.fillTypes[0]:
                lastNumberIndex=-1;
                getNextNote=asc;
                break;
            case me.fillTypes[1]:
                lastNumberIndex=notes.length;
                getNextNote=desc;
                break;
            case me.fillTypes[2]:
                lastNumberIndex=-1;
                getNextNote=ascDesc;
                break;
            case me.fillTypes[3]:
                lastNumberIndex =notes.length
                isAsc=false;
                getNextNote=ascDesc;
            break;
            case me.fillTypes[4]:
                getNextNote=random;
            break;
        }

        for(var i=0; i<triggers[0].length;i++){
            for(var j=0;j<triggers.length;j++){
                if(triggers[j][i].vol>0){
                    triggers[j][i].note=getNextNote();
                }
            }
        }
    }

    setPatternLength(arrangement:IArrangementData,patternIndex:number,newLength:number){
        var me=this;
        var pattern:ITriggerData[][]=arrangement.patterns[patternIndex];
        var channel:ITriggerData[];
        for(var i=0;i<pattern.length;i++){
            channel= pattern[i];
            while(channel.length>newLength){
                channel.pop();
            }
            while(channel.length<newLength){
                channel.push(me.createEmptyTrigger());
            }
        }
    }

    createEmptyTrigger():ITriggerData{
        return <ITriggerData>{
            note:48,
            vol:0
        }
    }

    joinPatterns(pattern1:ITriggerData[][],pattern2:ITriggerData[][]){
        var me=this;
        pattern1=me.clonePattern(pattern1);
        pattern2=me.clonePattern(pattern2);
        for(var i=0;i<pattern1.length;i++){
            pattern1[i] = pattern1[i].concat(pattern2[i]);
        }
        return pattern1;
    }

    flattenArrangementPatterns(data:IArrangementData):ITriggerData[][] {
        var results:ITriggerData[][] = [];
        for (var i = 0; i < data.channels.length; i++) {
            results[i] = [];
        }
        var patternIndex:number;
        var pattern:ITriggerData[][];
        for (i = 0; i < data.sequence.length; i++) {
            patternIndex = data.sequence[i];
            pattern = data.patterns[patternIndex];
            var trigger:ITriggerData;
            for (var j = 0; j < pattern.length; j++) {
                for (var k = 0, kk = pattern[j].length; k < kk; k++) {
                    trigger = pattern[j][k];
                    results[j].push(<ITriggerData>{
                        note: trigger.note,
                        vol: trigger.vol
                    });
                }
            }
        }
        return results;
    }
    getArrangementDuration(arrangement):number {
        var duration:number = 0;
        var spr:number = this.getSecondsPerRow(arrangement.bpm);
        var patternIndex:number;
        var pattern:ITriggerData[][];
        for (var i = 0; i < arrangement.sequence.length; i++) {
            patternIndex = arrangement.sequence[i];
            pattern = arrangement.patterns[patternIndex];
            duration += pattern[0].length * spr;
        }

        return duration;
    }

    getTimeForSequence(arrangement:IArrangementData, sequenceIndex:number, rowIndex:number):number{
        var duration:number = 0;
        var spr:number = this.getSecondsPerRow(arrangement.bpm);
        var patternIndex:number;
        var pattern:ITriggerData[][];
        var patternDuration:number;

        for (var i = 0; i < sequenceIndex; i++) {
            patternIndex = arrangement.sequence[i];
            pattern = arrangement.patterns[patternIndex];
            patternDuration = pattern[0].length * spr;
            duration += patternDuration;
        }

        duration+=rowIndex*spr;

        return duration;
    }

    clonePattern(data:ITriggerData[][]):ITriggerData[][]{
        var clone=[];
        var channel:ITriggerData[];
        var cloneChannel:ITriggerData[]
        for(var i=0;i<data.length;i++){
            channel=data[i];
            cloneChannel=[];
            for(var j=0;j<channel.length;j++){
                cloneChannel.push(<ITriggerData>{note:channel[j].note,vol:channel[j].vol});
            }
            clone[i]=cloneChannel;

        }
        return clone;
    }

    getPlaybackStateForTime(arrangement:IArrangementData, time:number):IPlaybackState{
        var me=this;
        time=Math.max(time,.01);
        var playbackState:IPlaybackState=<IPlaybackState>{};
        playbackState.currentTime = time
        playbackState.totalDuration = me.getArrangementDuration(arrangement);
        var duration:number = 0;
        var spr:number = me.getSecondsPerRow(arrangement.bpm);
        var patternIndex:number;
        var pattern:ITriggerData[][];
        var patternDuration:number;
        for (var i = 0; i < arrangement.sequence.length; i++) {
            patternIndex = arrangement.sequence[i];
            pattern = arrangement.patterns[patternIndex];
            patternDuration = pattern[0].length * spr;
            duration += patternDuration;
            if (duration > time) {
                playbackState.currentSequenceIndex = i;
                playbackState.currentRowIndex = Math.round((time - (duration - patternDuration)) / spr);
                break;
            }
        }
        return playbackState;
    }

    getPatternForTime(arrangement:IArrangementData, time:number):ITriggerData[][]{
        var playbackState:IPlaybackState=this.getPlaybackStateForTime(arrangement,time);
        return arrangement.patterns[arrangement.sequence[playbackState.currentSequenceIndex]];
    }

    getSecondsPerRow(bpm):number {
        //seconds per beat
        var spb:number = 60 / bpm;
        //4 rows per beat
        return spb / 4;
    }

    getRowsPerSecond(bpm):number {
        //beats per second
        var bps = bpm / 60;
        //4 rows per beat
        return bps * 4;
    }

    getTriggers(arrangement:IArrangementData,patternIndex:number,selection:ISelectionState):ITriggerData[][]{
        var pattern:ITriggerData[][]=arrangement.patterns[patternIndex];
        var results:ITriggerData[][]=[];
        var channel:ITriggerData[]
        for(var i=selection.startChannel;i<=selection.endChannel;i++){
            channel=[];
            for(var j=selection.startPosition;j<=selection.endPosition;j++){
                channel.push(pattern[i][j]);
            }
            results.push(channel);
        }
        return results;
    }
    pasteTriggers(triggers:ITriggerData[][], arrangement:IArrangementData,patternIndex:number,channelIndex:number,posIndex:number){

        var pattern=arrangement.patterns[patternIndex];
        var triggers= this.clonePattern(triggers);

        for(var i=0; i < triggers.length; i++ ){
            if(i+channelIndex >=pattern.length)break;

            for(var j=0;j<triggers[i].length;j++){
                if(j+posIndex >=pattern[0].length)break;
                pattern[i+channelIndex][j+posIndex ]=triggers[i][j];
            }

        }

    }
}