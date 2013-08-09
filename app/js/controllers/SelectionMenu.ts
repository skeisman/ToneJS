/**
 * This controller manages the menu adjacent to grid selections.
 *
 * @param $scope
 * @param appState
 * @param arrangementService
 * @constructor
 */
function SelectionMenu($scope, appState:IApplicationState, arrangementService:ArrangementService){

    $scope.onCopyClick=function(){
        var triggers:ITriggerData[][]=arrangementService.getTriggers(
            appState.a,
            appState.a.sequence[appState.ps.currentSequenceIndex],
            appState.selection
        );
        appState.copiedTriggers=  arrangementService.clonePattern( triggers);
    }

    $scope.onPasteClick=function(){
        if(!appState.copiedTriggers) return;

        arrangementService.pasteTriggers(
            appState.copiedTriggers,
            appState.a,
            appState.a.sequence[appState.ps.currentSequenceIndex],
            appState.selection.startChannel,
            appState.selection.startPosition
        );
        $scope.$emit("patternChange",appState.selection );
    }

    $scope.onDeleteClick=function(){
        var triggers:ITriggerData[][]=arrangementService.getTriggers(
            appState.a,
            appState.a.sequence[appState.ps.currentSequenceIndex],
            appState.selection
        );
        arrangementService.deleteTriggers(triggers);
        $scope.$emit("patternChange",appState.selection );
    }

}
SelectionMenu["$inject"]=["$scope", "appState", "arrangementService"];