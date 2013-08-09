/**
 * Highlights the current selection in the pattern grid.
 * Edits pattern notes.
 *
 * @param player
 * @param musicTheory
 * @param appState
 * @param arrangementService
 */
function TriggerSelectionEditor(player:Player, musicTheory:MusicTheory, appState:IApplicationState, arrangementService:ArrangementService) {
    return{
        restrict: "E",
        scope: {
            currentPattern:"=",
            scroll:'='
        },

        link: function ($scope:any, element:JQuery, attrs:any) {
            $scope.appState=appState;
            $scope.single=false;
            $scope.selectedTrigger=<ITriggerData>null;
            $scope.notes=generateNoteValues();
            $scope.volumes=generateVolumeValues();

            var menuEl=element.find('.selection-menu');
            menuEl.appendTo(document.body);
            var delay:number=0;


            $scope.$watch('scroll.scrollX',hideMenu);
            $scope.$watch('scroll.scrollY',hideMenu);
            $scope.$watch('appState.ps.currentTime',hideMenu);
            $scope.$watch("selectedTrigger.note",onNoteChange);
            $scope.$watch("selectedTrigger.vol",onVolumeChange);
            $scope.$watch('appState.selection',onSelectionChange);


            $scope.onCopyClick=function(){
                var triggers:ITriggerData[][]=arrangementService.getTriggers(
                    appState.a,
                    appState.a.sequence[appState.ps.currentSequenceIndex],
                    appState.selection
                );
                appState.copiedTriggers=  arrangementService.clonePattern( triggers);
            };

            $scope.onPasteClick=function(){
                if(!appState.copiedTriggers) return;

                arrangementService.pasteTriggers(
                    appState.copiedTriggers,
                    appState.a,
                    appState.a.sequence[appState.ps.currentSequenceIndex],
                    appState.selection.startChannel,
                    appState.selection.startPosition
                );
                $scope.$emit("patternChange");
            };

            $scope.onDeleteClick=function(){
                var triggers:ITriggerData[][]=arrangementService.getTriggers(
                    appState.a,
                    appState.a.sequence[appState.ps.currentSequenceIndex],
                    appState.selection
                );
                arrangementService.deleteTriggers(triggers);
                $scope.$emit("patternChange");
            };

            $scope.onLoopClick=function(){
                var triggers:ITriggerData[][]=arrangementService.getTriggers(
                    appState.a,
                    appState.a.sequence[appState.ps.currentSequenceIndex],
                    appState.selection
                );
                var patternLength=triggers[0].length;
                var emptyChannel=[];
                for(var i=0;i<appState.selection.startChannel;i++){
                    emptyChannel=[];
                    for(var j=0;j<patternLength;j++){
                        emptyChannel.push(arrangementService.createEmptyTrigger());
                    }
                    triggers.unshift(emptyChannel);
                }
                for( i=appState.selection.endChannel+1;i<appState.a.channels.length;i++){
                    emptyChannel=[];
                    for( j=0;j<patternLength;j++){
                        emptyChannel.push(arrangementService.createEmptyTrigger());
                    }
                    triggers.push(emptyChannel);
                }

                var time = arrangementService.getTimeForSequence(appState.a, appState.ps.currentSequenceIndex,appState.selection.startPosition);

                player.playPattern(triggers,time,100);
            };



            var lastVol:number=0.5;
            var lastNote:number=48;
            element.bind("mousedown touchstart", function (evt:JQueryEventObject) {
                evt.preventDefault();
                var originalEvent:any=evt.originalEvent;
                var touches:any[]=originalEvent.touches;
                if(!$scope.single){
                    $scope.$apply(function(){
                        appState.selection=null;
                    });

                    return;
                }

                var startX = touches ? touches[0].pageX : evt.pageX;
                var startY = touches ? touches[0].pageY : evt.pageY;
                var startVol = $scope.selectedTrigger.vol;
                var startNote = $scope.selectedTrigger.note;

                if (startVol == 0) {
                    $scope.$apply(function () {
                        startVol = $scope.selectedTrigger.vol = lastVol;
                        startNote = $scope.selectedTrigger.note = lastNote;
                    });
                }
                $(document.body).bind("touchmove mousemove", function (evt) {
                    evt.preventDefault();

                    var x:number = touches ? touches[0].pageX : evt.pageX;
                    var y:number = touches ? touches[0].pageY : evt.pageY;
                    var dx:number = x - startX;
                    var dy:number = startY - y;

                    var note:number = Math.round(startNote + dy / 10);
                    if (note > 96)note = 96;
                    if (note < 0)note = 0;

                    var vol:number = startVol + dx / 200;
                    if (vol < 0) vol = -0.1;
                    if (vol > 1) vol = 1;
                    vol = Math.round(vol * 100) / 100;

                    $scope.$apply(function () {
                        $scope.selectedTrigger.vol = vol;
                        if($scope.selectedTrigger.note!=note){
                            $scope.selectedTrigger.note = note;
                        }
                    });
                });

                $(document.body).bind("mouseup touchend touchcancel", function () {
                    $(document.body).unbind("mouseup touchend touchcancel touchmove mousemove")
                })

            });


            function hideMenu(){
                clearTimeout(delay);
                delay=setTimeout(showMenu,300);
                menuEl.hide();
            }

            function showMenu(){
                var selection=appState.selection;
                if(selection==null){
                    menuEl.hide();
                }else{

                    var offset=element.offset();
                    menuEl.css({
                        top:(offset.top+element.height()/2) +'px',
                        left:offset.left+'px',
                        'margin-top':(menuEl.height()/-2)+'px'
                    });
                    menuEl.fadeIn();
                }
            }

            function onNoteChange(){
                if($scope.selectedTrigger){
                    if($scope.selectedTrigger.vol>0){
                        lastNote = $scope.selectedTrigger.note;
                        lastVol =  $scope.selectedTrigger.vol;
                    }
                    player.playNote(appState.selection.startChannel, $scope.selectedTrigger);
                }
                $scope.$emit("patternChange",appState.selection );
            }

            function onVolumeChange(){
                if($scope.selectedTrigger){
                    lastVol = $scope.selectedTrigger.vol > 0 ? $scope.selectedTrigger.vol : lastVol;
                }
                $scope.$emit("patternChange",appState.selection );
            }

            function onSelectionChange(s){
                if(s==null){
                    element.css({display:'none'});
                }else{
                    element.css({
                        height:((1+(s.endChannel-s.startChannel))*appState.cellHeight)+'px',
                        width:((1+(s.endPosition - s.startPosition))*appState.cellWidth)+'px',
                        left:(s.startPosition*appState.cellWidth)+ 'px',
                        top:(s.startChannel*appState.cellHeight)+ 'px',
                        display:'block'
                    })
                }
                $scope.single= s && s.startChannel==s.endChannel && s.startPosition== s.endPosition;
                $scope.selectedTrigger=null;
                if($scope.single){
                    $scope.selectedTrigger= $scope.currentPattern[s.startChannel][s.startPosition];
                }
                hideMenu();
            }

            function generateVolumeValues(){
                var results=[];
                results.push({
                    value:-1,
                    text:"0FF"
                });
                for(var i=0;i<100;i++){
                    results.push({
                        value:i/100,
                        text:i
                    })
                }
                return results;
            }

            function generateNoteValues(){
                var results=[];
                for(var i=0;i<96;i++){
                    results.push({
                        value:i,
                        text:musicTheory.noteName(i)
                    })
                }
                return results;
            }

        }
    }
}
TriggerSelectionEditor["$inject"]=["player", "musicTheory", "appState", "arrangementService"];