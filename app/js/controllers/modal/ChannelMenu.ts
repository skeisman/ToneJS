/**
 * This controller manages the channel settings modal window.
 * @param $scope
 * @param $route
 * @param player
 * @param arrangementService
 * @param appState
 * @param instrumentService
 * @constructor
 */
function ChannelMenu($scope, $route, player:Player, arrangementService:ArrangementService, appState:IApplicationState, instrumentService:InstrumentService ) {

    var channelIndex:any= $route.current.params.id;
    if(channelIndex=="add"){
        // create a new channel.
        // clone the last channel in the arrangement.
        $scope.channelData= angular.copy(appState.a.channels[appState.a.channels.length-1]);
        $scope.title="Create New Channel";
        $scope.channelIndex= appState.a.channels.length;
    }else{
        channelIndex=parseFloat(channelIndex);
        $scope.channelIndex=channelIndex
        $scope.title="Edit Channel "+channelIndex+" Settings";
        $scope.channelData=appState.a.channels[channelIndex];
    }

    $scope.volValues=generateVolValues();
    $scope.panValues=generatePanValues();
    $scope.channelSource=$scope.channelData.source;
    $scope.vol=$scope.channelData.vol;
    $scope.pan=$scope.channelData.pan;
    $scope.sources=[];
    $scope.selectedSource=0;



    $scope.okClick=function(){
        $scope.channelData.vol= $scope.vol;
        $scope.channelData.pan= $scope.pan;
        $scope.channelData.source = $scope.channelSource;
        if(channelIndex=="add"){
            appState.a.channels.push($scope.channelData);
            arrangementService.addEmptyPatternChannel(appState.a,appState.a.channels.length);
            $scope.$emit("patternChange" );

        }
        player.loadSources();
    }

    instrumentService.getInstruments().then(function (value){
        var instruments:ISourceData[]=<any>value;
        for(var i=0;i< instruments.length;i++){
            if(instruments[i].name==$scope.channelData.source.name){
                $scope.channelSource=instruments[i];
                break;
            }
        }
        $scope.sources=instruments;
    });


    function generateVolValues(){
        var results=[];
        for(var i=0; i<=100;i+=10){
            results.push({
                text: i.toString(),
                value:i/100
            });
        }
        return results;
    }

    function generatePanValues(){
        var results=[];
        for(var i=-100; i<=100;i+=10){
            results.push({
                text: i.toString(),
                value:i/100
            });
        }
        return results;
    }
}
ChannelMenu["$inject"]=["$scope", "$route",  "player", "arrangementService", "appState", "instrumentService"];