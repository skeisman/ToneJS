/**
 * This controller manages the save as modal window.
 * @param $scope
 * @param appState
 * @param arrangementService
 * @constructor
 */
function SaveAs($scope, appState:IApplicationState, arrangementService:ArrangementService){
    $scope.title=appState.a.title;

    arrangementService.getArrangementList().then(function(value){
        $scope.arrangementList=value;
    });
    $scope.onItemClick=function(title){
        $scope.title=title;
    }
    $scope.onSaveClick=function($event){
        if($scope.title.length){
            appState.a.title = $scope.title;
            arrangementService.saveLocalArrangement(appState.a);
        }
    }
}
SaveAs["$inject"]=["$scope", "appState", "arrangementService"];