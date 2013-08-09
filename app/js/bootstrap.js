/**
 * Created by sean on 8/8/13.
 */


//--------------------------------------------------
// Splash Screen
//--------------------------------------------------

$("#success").on("click",function(){
    $("#splash-screen").fadeOut(1000,function(){
        $("#splash-screen").remove();
    });
    $("#tonejs").css({
        visibility:''
    });

     window.onbeforeunload=function(){
        return "All unsaved work will be lost."
     }

});


//--------------------------------------------------
// Feature Detect
//--------------------------------------------------
if(!BrowserAudioContext.getInstance()){
    $("#fail").show();
}else{
    $("#success").css({
        display:'inline-block'
    });
    init();
}


/**
 * Called only if this browser is able to run this application.
 */
function init () {

    // Don't try to scroll on drag.
    $(document).bind("touchmove",function(e){
        e.preventDefault();
    });

    var cellWidth = 46;
    var cellHeight = 40;

    (function setCSSClasses(cellWidth,cellHeight){
        var styles = ".cellWidth{width:" + cellWidth + "px;} .cellHeight{height:" + cellHeight + "px}";
        var maxColumnCount = 256;
        var maxChannelCount = 128;
        var i = 0;
        for (i = 0; i < maxColumnCount; i++) {
            styles += ".c" + i + "{left:" + (i * cellWidth) + "px}";
        }
        for (i = 0; i < maxChannelCount; i++) {
            styles += ".r" + i + "{top:" + (i * cellHeight) + "px}";
        }
        $("<style>" + styles + "</style>").appendTo(document.body);
    })(cellWidth,cellHeight);

    var appInit = function ($routeProvider) {
        $routeProvider.when('/SongMenu', {
            templateUrl: 'partials/SongMenu.html',
            controller: SongMenu
        });
        $routeProvider.when('/PatternMenu', {
            templateUrl: 'partials/PatternMenu.html',
            controller: PatternMenu
        });
        $routeProvider.when('/ChannelMenu/:id', {
            templateUrl: 'partials/ChannelMenu.html',
            controller: ChannelMenu
        });
        $routeProvider.when('/OpenSong', {
            templateUrl: 'partials/OpenSong.html',
            controller: OpenSong
        });
        $routeProvider.when('/SaveAs', {
            templateUrl: 'partials/SaveAs.html',
            controller: SaveAs
        });
        $routeProvider.when('/TransposeNotes', {
            templateUrl: 'partials/TransposeNotes.html',
            controller: TransposeNotes
        });
        $routeProvider.when('/RandomizeVolume', {
            templateUrl: 'partials/RandomizeVolume.html',
            controller: RandomizeVolume
        });
        $routeProvider.when('/AutoChord', {
            templateUrl: 'partials/AutoChord.html',
            controller: AutoChord
        });
        $routeProvider.when('/Help', {
            templateUrl: 'partials/Help.html'
        });
    };

    appInit["$inject"] = ["$routeProvider"];

    var app = angular.module("tonejs", [], appInit);

    app.service("musicTheory", MusicTheory);
    app.service("instrumentService", InstrumentService);
    app.service("arrangementService", ArrangementService);
    app.service("player", Player);

    app.directive("sequenceEditor", SequenceEditor);
    app.directive("grid", Grid);
    app.directive("scrollbar", Scrollbar);
    app.directive("triggerSelectionEditor", TriggerSelectionEditor);
    app.directive("iScroll", IScroll);

    app.value("appState",{
        cellWidth:cellWidth,
        cellHeight:cellHeight,
        autoChordState:{}
    });

    angular.bootstrap(document.getElementById("tonejs"), ['tonejs']);

}
