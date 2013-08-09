/**
 * This controller manages the playback controls above the grid.
 *
 * @param $scope
 * @param player
 * @param arrangementService
 * @constructor
 */
function Playback($scope, player:Player, arrangementService:ArrangementService){
    $scope.pl=player;

    $scope.togglePlay = function() {
        if (player.isPlaying) {
            player.stop();
        } else {
            player.play();
        }
    };
    $scope.tempoValues=(function(){
        var results=[];
        for(var i=50;i<250;i+=5){
            results.push(i);
        }
        return results;
    })();
    $scope.highlightValues=(function(){
        var results=[];
        for(var i=2;i<64;i++){
            results.push(i);
        }
        return results;
    })();

}
Playback["$inject"]=["$scope","player", "arrangementService"];