/**
 * This controller manages the transpose notes modal window.
 * @param $scope
 * @param arrangementService
 * @param appState
 * @constructor
 */
function TransposeNotes($scope, arrangementService:ArrangementService, appState:IApplicationState){

    $scope.onUpClick=function(){
        var triggers:ITriggerData[][]=arrangementService.getTriggers(
            appState.a,
            appState.a.sequence[appState.ps.currentSequenceIndex],
            appState.selection
        );
        arrangementService.transposeTriggers(triggers,1);
        $scope.$emit("patternChange",appState.selection );
    }
    $scope.onDownClick=function(){
        var triggers:ITriggerData[][]=arrangementService.getTriggers(
            appState.a,
            appState.a.sequence[appState.ps.currentSequenceIndex],
            appState.selection
        );
        arrangementService.transposeTriggers(triggers,-1);
        $scope.$emit("patternChange",appState.selection );
    }

}
TransposeNotes["$inject"]= ["$scope", "arrangementService", "appState"];