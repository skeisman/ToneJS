/**
 * Creates a sequence editor.
 *
 * @param appState
 * @param arrangementService
 *
 */
function SequenceEditor( appState:IApplicationState, arrangementService:ArrangementService) {
    return{
        restrict: "E",
        scope: false,

        link: function ($scope:any, element:JQuery, attrs:any) {

            var wrapperEl= element.find(".wrapper");

            $scope.appState=appState;

            $scope.availablePatterns=[];
            $scope.$watch("appState.a.patterns.length",function(value){
                $scope.availablePatterns=getAvailablePatterns();
            });
            $scope.$watch("appState.a",function(value){
                $scope.availablePatterns=getAvailablePatterns();
            });

            $scope.$watch("appState.ps.currentSequenceIndex",function(value){
                var elWidth=element.width()
                var cellWidth=appState.cellWidth;
                var cellHeight=appState.cellHeight;
                var totalWidth= appState.a.sequence.length* cellWidth;
                var left=cellWidth;
                if(totalWidth>elWidth){
                    left=value*cellWidth*-1+(elWidth/2);
                    if(left>cellWidth) left=cellWidth;

                    if(totalWidth>elWidth && left< elWidth-totalWidth-cellWidth){
                        left=elWidth-totalWidth-cellWidth;
                    }
                }
                wrapperEl.css({
                    "-webkit-transform":"translate("+left+"px,0)"
                });
            })

            $scope.add = function () {
                var currentPatternIndex = appState.a.sequence[appState.ps.currentSequenceIndex]
                var currentPattern=appState.a.patterns[currentPatternIndex];
                appState.a.sequence.splice(appState.ps.currentSequenceIndex,0, currentPatternIndex);
            };

            $scope.clone = function () {
                //clone the current pattern;
                var currentPatternIndex = appState.a.sequence[appState.ps.currentSequenceIndex]
                var currentPattern=appState.a.patterns[currentPatternIndex];

                var pattern:any= $.extend(true,{},{pattern: currentPattern})
                pattern= pattern.pattern;
                appState.a.sequence.push(appState.a.patterns.length)
                appState.a.patterns.push(pattern);
                var time = arrangementService.getTimeForSequence(appState.a,appState.a.sequence.length-1,0);
                $scope.$emit("seek", time);
            };

            $scope.remove = function () {
                if(appState.a.sequence.length>1) {
                    appState.a.sequence.splice(appState.ps.currentSequenceIndex,1);
                    var index= appState.ps.currentSequenceIndex;
                    if(appState.ps.currentSequenceIndex>=appState.a.sequence.length){
                        index--;
                    }
                    var time = arrangementService.getTimeForSequence(appState.a,index,0);
                    $scope.$emit("seek", time);
                }

            };

            $scope.loop=function(){

                var currentPatternIndex = appState.a.sequence[appState.ps.currentSequenceIndex]
                var triggers:ITriggerData[][]=appState.a.patterns[currentPatternIndex];
                var patternLength=triggers[0].length;
                var emptyChannel=[];
                var time = arrangementService.getTimeForSequence(appState.a, appState.ps.currentSequenceIndex,0);
                $scope.$emit("loop", triggers, time);
            }

            function getAvailablePatterns ():number[]{
                var results=[];
                for(var i=0;i<appState.a.patterns.length;i++){
                    results.push(i);
                }
                return results;
            }

            $scope.onSequenceClick=function(){
                $scope.$emit("stop");
                var time = arrangementService.getTimeForSequence(appState.a,this.$index,0);
                $scope.$emit("seek", time);
            };
        }
    }
}

SequenceEditor["$inject"]=["appState", "arrangementService"]