/**
 * This controller manages the pattern options modal window.
 *
 * @param $scope
 * @param arrangementService
 * @param appState
 * @constructor
 */
function PatternMenu($scope,arrangementService:ArrangementService, appState:IApplicationState){
    var currentPatternIndex = appState.a.sequence[appState.ps.currentSequenceIndex]
    var currentPattern=appState.a.patterns[currentPatternIndex];

    $scope.title="Edit Pattern " + currentPatternIndex;
    $scope.patternLength=currentPattern[0].length;

    $scope.onClearClick=function(){
        currentPatternIndex = appState.a.sequence[appState.ps.currentSequenceIndex]
        currentPattern=appState.a.patterns[currentPatternIndex];
        arrangementService.clearPattern(appState.a,currentPatternIndex);
        $scope.$emit("patternChange");
    }
    $scope.onPasteClick=function(){
        if(!appState.copiedTriggers) return;

        arrangementService.pasteTriggers(
            appState.copiedTriggers,
            appState.a,
            appState.selection.startPosition,
            appState.selection.startChannel,
            appState.ps.currentRowIndex
        );
        $scope.$emit("patternChange");
    }
}
PatternMenu["$inject"]=["$scope","arrangementService", "appState"]