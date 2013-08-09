/**
 * This controller manages the file menu.
 * @param $scope
 * @param appState
 * @param player
 * @param arrangementService
 * @param $location
 * @constructor
 */
function SongMenu($scope, appState:IApplicationState,player:Player, arrangementService:ArrangementService, $location:ng.ILocationService){
    $scope.onSaveClick =function($event){
        if(appState.a.title){
            arrangementService.saveLocalArrangement(appState.a);
        }else{
            $location.path("/SaveAs");
            $event.preventDefault();
        }
    }
    $scope.onNewClick=function($event){
        appState.a=arrangementService.createEmptyArrangement();
        player.setArrangement(appState.a);
        player.loadSources();
    }
}
SongMenu["$inject"]=["$scope", "appState", "player","arrangementService", "$location" ];