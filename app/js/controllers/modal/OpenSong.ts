/**
 * This controller manages the open song modal window.
 * @param $scope
 * @param player
 * @param appState
 * @param arrangementService
 * @constructor
 */
function OpenSong($scope, player:Player, appState:IApplicationState, arrangementService:ArrangementService){
    $scope.title="";

    arrangementService.getArrangementList().then(function(value){
        $scope.arrangementList=value;
    });
    $scope.onItemClick=function(title){
        $scope.title=title;
    }
    $scope.onOpenClick=function($event){
        if($scope.title.length){
            arrangementService.openLocalArrangement($scope.title).then(function(value){
                appState.a=<IArrangementData>value;
                player.setArrangement(appState.a);
                player.loadSources();
            });
        }
    }
}
OpenSong["$inject"]= ["$scope", "player", "appState", "arrangementService"]