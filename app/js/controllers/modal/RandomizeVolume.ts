/**
 * This controller manages the randomize volume modal window.
 *
 * @param $scope
 * @param arrangementService
 * @param appState
 * @constructor
 */
function RandomizeVolume($scope, arrangementService:ArrangementService, appState:IApplicationState){

    $scope.amount=0.1;
    $scope.amountValues=(function(){
        var results=[]
        for(var i=1;i<=10;i++){
            results.push({
                text:i/10,
                value:i/10
            });
        }
        return results;
    })();
    $scope.okClick=function(){
        var triggers:ITriggerData[][]=arrangementService.getTriggers(
            appState.a,
            appState.a.sequence[appState.ps.currentSequenceIndex],
            appState.selection
        );
        arrangementService.randomizeVolume(triggers,$scope.amount);
        $scope.$emit("patternChange",appState.selection );
    }
}
RandomizeVolume["$inject"]=["$scope", "arrangementService", "appState"];