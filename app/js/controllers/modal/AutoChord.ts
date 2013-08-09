/**
 * This controller manages the AutoChord modal window.
 *
 * @param $scope
 * @param player
 * @param arrangementService
 * @param musicTheory
 * @param appState
 * @constructor
 */
function AutoChord($scope,player:Player, arrangementService:ArrangementService, musicTheory:MusicTheory, appState:IApplicationState){
    $scope.selection= appState.selection;

    $scope.fillValues = arrangementService.fillTypes;
    $scope.rootValues = generateRootValues();
    $scope.scaleValues = generateScaleValues();
    $scope.octaveValues = generateOctaveValues();

    var state=appState.autoChordState;
    state.root=state.root || 0;
    state.fill=state.fill||arrangementService.fillTypes[0];
    state.scale=state.scale||$scope.scaleValues[0].value
    $scope.chordValues = updateChordValues();
    state.chord=state.chord||$scope.chordValues[0].value;
    state.octaveStart=state.octaveStart||3;
    state.octaveEnd=state.octaveEnd||5;
    $scope.state=state;

    $scope.$watch("state.root",updateChordValues);
    $scope.$watch("state.scale",updateChordValues);

    $scope.okClick=function(){
        var triggers:ITriggerData[][]=arrangementService.getTriggers(
            appState.a,
            appState.a.sequence[appState.ps.currentSequenceIndex],
            appState.selection
        );
        var chord=state.chord;
        var notes=[];
        var start =Math.min(state.octaveStart,state.octaveEnd);
        var end = Math.max(state.octaveStart,state.octaveEnd);

        for(var i=start; i<=end;i++){
            notes=notes.concat(musicTheory.transposeNotes(chord,i*12));
        }

        arrangementService.autoChord(triggers,notes,state.fill);
        $scope.$emit("patternChange",appState.selection );

    }

    $scope.onPreviewClick=function(){
        var chord=state.chord;
        var notes=[];
        var start=Math.min( state.octaveStart,state.octaveEnd);
        var end= Math.max (state.octaveStart,state.octaveEnd);

        for(var i=start; i<=end;i++){
            notes=notes.concat(musicTheory.transposeNotes(chord,i*12));
        }

        var triggers=[];
        for(i=0;i<10;i++){
            triggers.push(<ITriggerData>{
                note:48,
                vol:0.5
            });
        }

        arrangementService.autoChord([triggers],notes,state.fill);
        var channelIndex=0;
        if(appState.selection)
         channelIndex=appState.selection.startChannel;

        player.playNote(channelIndex,triggers.shift());
        player.playNote(channelIndex,triggers.shift());
        player.playNote(channelIndex,triggers.shift());

        var interval=setInterval(function(){
            player.playNote(channelIndex,triggers.shift());
            if(triggers.length==0)clearInterval(interval);
        },160);
    };

    /**
     * Retrieves all chords for the root + scale combination.
     * @returns {IChordInfo[]}
     */
    function updateChordValues():IChordInfo[]{
        var results:IChordInfo[]=musicTheory.getChordsFromScale(state.scale, state.root);
        var value=JSON.stringify(state.chord);
        state.chord= results[0].notes;
        for(var i=0;i<results.length;i++){
            if(JSON.stringify(results[i].notes)==value){
                state.chord= results[i].notes;
                break;
            }
        }
        $scope.chordValues=results;
        return results;
    }

    function generateScaleValues(){
        var results=[];
        var scales=musicTheory.scale;
        for(var p in scales){
            results.push({
                text:p,
                value:scales[p]
            });
        }
        return results
    }

    function generateRootValues(){
        var results=[];
        for(var i=0;i<12;i++){
            results.push({
                text:musicTheory.notes[i],
                value:i
            });
        }
        return results;
    }

    function generateOctaveValues(){
        var results=[];
        for(var i=1;i<8;i++){
            results.push(i);
        }
        return results;
    }
}
AutoChord["$inject"]=["$scope", "player", "arrangementService", "musicTheory", "appState"]