/**
 * This controller manages the event bus.
 * Events that pop up to this controller do not start with "on"
 * Event names that are broadcast down start with "on"
 *
 * @param $scope
 * @param player
 * @param arrangementService
 * @param appState
 * @constructor
 */
function Main($scope, player:Player, arrangementService:ArrangementService, appState:IApplicationState) {

    $scope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
            if(fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    $scope.appState=appState;

    appState.a=arrangementService.createEmptyArrangement();
    player.setArrangement(appState.a);
    appState.ps=arrangementService.getPlaybackStateForTime(appState.a,0);
    player.on("playbackStateChanged", function(eName:string,state:IPlaybackState){
        var me=this;
        appState.ps=state;
        $scope.$broadcast("onPlaybackStateChange",state);
    });

    arrangementService.openArrangement("data/demoSong.json").then(function(data){
        appState.a= <IArrangementData>data;
        player.setArrangement(appState.a);
        player.loadSources();
    });


    $scope.$on("patternChange",function(e:ng.IAngularEvent, selection?:ISelectionState){
        $scope.$broadcast("onPatternChange",selection);
    });

    $scope.$on("seek",function(e:ng.IAngularEvent, time:number){
       player.seekTo(time);
    });

    $scope.$on("play",function(e:ng.IAngularEvent,time:number){
        player.play(time);
    });

    $scope.$on("stop",function(e:ng.IAngularEvent){
        player.stop();
    });

    $scope.$on("loop",function(e:ng.IAngularEvent, pattern:ITriggerData[][], time:number){
        player.playPattern(pattern,time,30);
    });


}

Main["$inject"]=["$scope", "player", "arrangementService", "appState"];
