function Pattern($scope, arrangementService:ArrangementService, appState:IApplicationState) {
    $scope.appState=appState;
    $scope.patternLengths=generatePatternLengths();
    $scope.positionLabels=[];

    $scope.scroll={
        scrollX:0,
        scrollY:0,
        maxScrollX:0,
        maxScrollY:0
    }

    $scope.$on("onPlaybackStateChange",updatePatternState);
    $scope.$on("onPatternChange",updatePatternState);
    $scope.$watch("patternLength",onPatternLengthChange);
    $scope.$watch("appState.a.sequence[appState.ps.currentSequenceIndex]",updatePatternState);

    $scope.$watch("currentPattern[0].length",function(value){
        $scope.positionLabels=generatePositionLabels(value);
    });

    function updatePatternState(){
        $scope.safeApply(function(){
            $scope.currentPattern=appState.a.patterns[appState.a.sequence[appState.ps.currentSequenceIndex]];
            $scope.patternLength = $scope.currentPattern[0].length;
        })
    }

    function generatePositionLabels(count):string[]{
        var results=[];
        var index:string;
        for(var i= 0,ii=count;i<ii;i++){
            index= i.toString()
            while(index.length<3){
                index='0'+index;
            }
            results.push(index);
        }
        return results;
    }

    function generatePatternLengths(){
        var min=12;
        var max=256;
        var results=[];
        for(var i=min; i<=max;i+=4){
            results.push(i);
        }
        return results;
    }

    function onPatternLengthChange(value){
        if(!value)return;
        var currentPatternIndex=appState.a.sequence[appState.ps.currentSequenceIndex]
        var currentPattern=appState.a.patterns[appState.a.sequence[appState.ps.currentSequenceIndex]];

        if(value!=currentPattern[0].length){
            arrangementService.setPatternLength(appState.a,currentPatternIndex, value );
            var time = arrangementService.getTimeForSequence(appState.a, appState.ps.currentSequenceIndex,appState.ps.currentRowIndex);
            $scope.$emit("seek",time);
            $scope.$emit("patternChange");
        }
    }

}
Pattern["$inject"]=["$scope", "arrangementService", "appState"];

