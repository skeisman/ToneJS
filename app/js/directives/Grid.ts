interface ITriggerRenderer {
   position:number;
   channel:number;
   trigger:ITriggerData;
   renderer:JQuery;
}

interface IRect{
    w:number;
    h:number;
    x:number;
    y:number;
}

/**
 * Draws the note grid.
 * This directive only renders notes that might be visible.
 * It uses a custom virtualized rendering strategy.
 *
 * Automatically scrolls during playback.
 * Creates note selections.
 *
 * @param musicTheory
 * @param appState
 * @param arrangementService
 *
 */
function Grid( musicTheory:MusicTheory, appState:IApplicationState, arrangementService:ArrangementService) {
    return{
        restrict: "E",
        scope: {
            scroll:'=',
            currentPattern:'='
        },

        link: function ($scope:any, element:JQuery, attrs:any) {
            var triggersEl:JQuery = element.find(".triggers");
            var gridBackgroundEl:JQuery = element.find(".grid-background");
            var playheadEl:JQuery= element.find(".playhead");
            var contentEl:JQuery=element.find(".content");

            $scope.appState = appState;
            $scope.selectedTrigger = null;
            $scope.selectedTriggerIndex=0;
            $scope.selectedChannelIndex=0;


            $scope.$watch("currentPattern", function(){
                appState.selection=null;
                refreshGrid();
            });

            $scope.$watch("appState.ps.currentTime", function(){
                scrollToCurrentTime();
            });

            $scope.$on("onPatternChange",function(e:ng.IAngularEvent,selection){
                refreshGrid(selection);
            });


            $scope.$watch("scroll.scrollX",function(value){
                if(lastViewport && Math.abs(value - lastViewport.x) > bufferX/2 ){
                    renderViewport();
                }
                element.scrollLeft(value);
            });

            $scope.$watch("scroll.scrollY",function(value){
                if(lastViewport && Math.abs(value - lastViewport.y) > bufferY/2 ){
                    renderViewport();
                }
                element.scrollTop(value);

            });



            //--------------------------------------------------------------
            // SCROLLING
            //--------------------------------------------------------------
            function scrollToCurrentTime(){
                if(!$scope.currentPattern) return;
                var x = appState.ps.currentRowIndex*appState.cellWidth;
                var y = appState.selection?appState.selection.lastChannel*appState.cellHeight:0;
                $scope.scroll= scrollIntoView(x,y,$scope.scroll);
            }

            function scrollIntoView(x,y,scrollState:IScrollState):IScrollState{
                var currentPattern:ITriggerData[][]= $scope.currentPattern;
                var cellWidth=appState.cellWidth;
                var cellHeight=appState.cellHeight;
                var gridWidth= currentPattern[0].length*cellWidth;
                var gridHeight=currentPattern.length*cellHeight;
                var paddingX=cellWidth*2;
                var paddingY = cellHeight*2;
                var viewportWidth = element.width();
                var viewportHeight = element.height();
                var maxScrollX=Math.max(gridWidth+cellWidth -viewportWidth,0);
                var maxScrollY=Math.max(gridHeight+cellHeight-viewportHeight,0);

                var scrollX=scrollState.scrollX;
                var scrollY=scrollState.scrollY;
                if(gridWidth > viewportWidth){
                   if(x > scrollX+viewportWidth-paddingX-cellWidth){
                    scrollX=x+paddingX+cellWidth-viewportWidth;
                   }else if(x < scrollX+paddingX){
                       scrollX= x- paddingX;
                   }
                   if(scrollX<0) {
                        scrollX=0;
                   }
                }

                if(gridHeight>viewportHeight){
                    if(y > scrollY+viewportHeight-paddingY-cellHeight){
                        scrollY=y+paddingY+cellHeight-viewportHeight;
                    }else if(y < scrollY+paddingY){
                        scrollY= y- paddingY;
                    }
                    if(scrollY<0) {
                        scrollY=0;
                    }
                }
                return {
                    scrollY:Math.round(Math.min(scrollY,maxScrollY)),
                    scrollX:Math.round(Math.min(scrollX,maxScrollX)),
                    maxScrollX:maxScrollX,
                    maxScrollY:maxScrollY
                }

            }


            //--------------------------------------------------------------
            // RENDERING
            //--------------------------------------------------------------

            function refreshGrid(selection?:ISelectionState){
                var currentPattern:ITriggerData[][]= $scope.currentPattern;
                if(!currentPattern) return;

                if(!selection){
                    playheadEl.height(currentPattern.length * appState.cellHeight -1);
                    triggersEl.css({
                        width:(appState.cellWidth*(currentPattern[0].length+1))+"px",
                        height:(appState.cellHeight*(currentPattern.length+1))+"px"
                    });
                    gridBackgroundEl.css({
                        width:(appState.cellWidth*(currentPattern[0].length))+"px",
                        height:(appState.cellHeight*(currentPattern.length))+"px"
                    });
                    activeRenderersList=[];
                    activeRenderers=(function(){
                        var results=[];
                        for(var i=0;i<currentPattern.length;i++){
                            results[i]=[];
                        }
                        return results;
                    })();
                    triggersEl.html("");

                    renderViewport();
                }else{
                    var trigger:ITriggerData;
                    for(var i=selection.startChannel;i<=selection.endChannel;i++){
                        for(var j=selection.startPosition; j<=selection.endPosition;j++){
                            trigger=currentPattern[i][j];
                            var r:ITriggerRenderer=activeRenderers[i][j];
                            if(trigger.vol!=0 && r==null){
                                var el:JQuery=$('<div class="grid-trigger cellWidth cellHeight c'+j+' r'+i+'">'+renderTrigger(trigger)+'</div>').appendTo(triggersEl);
                                var renderer={
                                    position:j,
                                    channel:i,
                                    renderer:el,
                                    trigger:trigger
                                }
                                activeRenderersList.push(renderer);
                                activeRenderers[i][j]=renderer;
                            }else if(r){
                                r.trigger=trigger;
                                r.renderer.html(renderTrigger(trigger));
                            }
                        }
                    }
                }
            }

            var bufferX:number=400;
            var bufferY:number=600;
            var lastViewport:IRect;
            var activeRenderers:ITriggerRenderer[][];
            var activeRenderersList:ITriggerRenderer[];
            var renderBufferTime
            function renderViewport(){
                window["webkitCancelAnimationFrame"](renderBufferTime);
                renderBufferTime=window["webkitRequestAnimationFrame"](function(){
                var start= new Date();
                var currentPattern:ITriggerData[][]= $scope.currentPattern;
                var rect:IRect={
                    x: element.scrollLeft(),
                    y:element.scrollTop(),
                    w:element.width(),
                    h:element.height()
                }

                var startChannel=Math.max(0,Math.floor((rect.y-bufferY)/appState.cellHeight));
                var endChannel=Math.min(currentPattern.length-1,Math.floor((rect.y+rect.h+bufferY)/appState.cellHeight));
                var startPosition=Math.max(0,Math.floor((rect.x-bufferX)/appState.cellWidth));
                var endPosition=Math.min(currentPattern[0].length,Math.floor((rect.x+rect.w+bufferX)/appState.cellWidth));
                var active:ITriggerRenderer[]=[];

                var renderer:ITriggerRenderer;
                //remove unused nodes
                for(var i=0;i<activeRenderersList.length;i++){
                    renderer= activeRenderersList[i];
                    if( renderer.position<startPosition || renderer.channel<startChannel || renderer.channel> endChannel || renderer.position>endPosition || renderer.trigger.vol==0){
                        renderer.renderer.remove();
                        activeRenderers[renderer.channel][renderer.position]=null;
                    }else{
                        active.push(renderer);
                    }
                }
                activeRenderersList=active;

               //add new nodes
                var trigger:ITriggerData;
                var newNodes=[];
                for(var i=startChannel; i<=endChannel;i++){
                    for(var j=startPosition;j<=endPosition;j++){
                        renderer=activeRenderers[i][j];
                        trigger=currentPattern[i][j];
                        if(trigger && trigger.vol!=0 && renderer==null){
                            var el:JQuery=$('<div class="grid-trigger cellWidth cellHeight c'+j+' r'+i+'">'+renderTrigger(trigger)+'</div>');
                            newNodes.push(el)
                            renderer={
                                position:j,
                                channel:i,
                                renderer:el,
                                trigger:trigger
                            }
                            activeRenderersList.push(renderer);
                            activeRenderers[i][j]=renderer;
                        }
                    }
                }
                triggersEl.append(newNodes);
                lastViewport=rect;
                });
            }

            function renderTrigger(input:ITriggerData):string{
                if (input && input.vol > 0) {
                    var vol= Math.min(Math.floor(input.vol*100),99);
                    return musicTheory.noteName(input.note) + " " + vol;
                } else if (input && input.vol < 0) {
                    return "OFF";
                }
                return "";
            }


            //--------------------------------------------------------------
            // SELECTION
            //--------------------------------------------------------------
            var startMouseX:number = 0;
            var startMouseY:number = 0;
            var lastMouseX:number=0;
            var lastMouseY:number=0;
            var lastNote:number = 48;
            var lastVol:number = 0.5;
            var selectionInterval:number=0;
            var tapStart:number;

            var touchEnabled=false;
            if('ontouchstart' in window){
                touchEnabled=true;
            }
            triggersEl.on(touchEnabled?"touchstart":"mousedown",function(evt:JQueryEventObject){
                var originalEvent:any=evt.originalEvent;
                var touches:any[]=originalEvent.touches;
                evt.preventDefault();
                $scope.$emit("stop");
                var gridOffset=contentEl.offset();
                lastMouseX=(touches ? touches[0].pageX : evt.pageX);
                lastMouseY=(touches ? touches[0].pageY : evt.pageY);

                startMouseX= lastMouseX-gridOffset.left;
                startMouseY= lastMouseY- gridOffset.top;

                tapStart=evt.timeStamp;
                updateSelection();
                clearInterval(selectionInterval);

                selectionInterval=setTimeout(function(){
                    clearInterval(selectionInterval);
                    updateSelection();
                    selectionInterval=setInterval(updateSelection,100);
                },300);


                $(document.body).bind(touchEnabled?"touchmove":"mousemove", function (evt:JQueryEventObject) {
                    var originalEvent:any=evt.originalEvent;
                    var touches:any[]=originalEvent.touches;
                    evt.preventDefault();
                    lastMouseX = (touches ? touches[0].pageX : evt.pageX);
                    lastMouseY = (touches ? touches[0].pageY : evt.pageY);
                });
                $(document.body).bind("mouseup touchend touchcancel", function (evt:JQueryEventObject) {
                    var time = arrangementService.getTimeForSequence(appState.a, appState.ps.currentSequenceIndex,appState.selection.startPosition);
                    $scope.$emit("seek",time);

                    clearInterval(selectionInterval);
                    $(document.body).unbind("mouseup touchend touchcancel touchmove mousemove");
                });
            });

            function updateSelection(){
                var currentPattern:ITriggerData[][]=$scope.currentPattern;
                var gridOffset=contentEl.offset();
                var pos1=Math.floor((startMouseX)/appState.cellWidth);
                var pos2=Math.floor((lastMouseX-gridOffset.left)/appState.cellWidth);
                var maxPos=currentPattern[0].length-1;
                pos1=Math.min(pos1,maxPos);
                pos2=Math.min(pos2,maxPos);
                pos1=Math.max(pos1,0);
                pos2=Math.max(pos2,0);
                var ch1=Math.floor((startMouseY)/appState.cellHeight);
                var ch2=Math.floor((lastMouseY-gridOffset.top)/appState.cellHeight);
                var maxChannel= currentPattern.length-1;
                ch1=Math.min(ch1,maxChannel);
                ch2=Math.min(ch2,maxChannel);
                ch1=Math.max(ch1,0);
                ch2=Math.max(ch2,0);

                var menuPosition="";
                if(pos2>pos1 || Math.min(pos1,pos2)==0){
                    menuPosition+="right ";
                }
                if(Math.min(ch1,ch2)==0 && Math.abs(ch1-ch2)<3){
                    menuPosition+="top";
                }
                if(Math.max(ch1,ch2)==maxChannel && Math.abs(ch1-ch2)<3){
                    menuPosition+="bottom";
                }

                $scope.$apply(function(){
                    appState.selection={
                        startChannel :Math.min(ch1,ch2),
                        endChannel :Math.max(ch1,ch2),
                        startPosition :Math.min(pos1,pos2),
                        endPosition :Math.max(pos1,pos2),
                        lastPosition:pos2,
                        lastChannel:ch2
                    };
                    $scope.scroll=scrollIntoView(pos2*appState.cellWidth,ch2*appState.cellHeight, $scope.scroll);
                });

            }

            //--------------------------------------------------------------
            // HIGHLIGHTING
            //--------------------------------------------------------------
            var maxPatternLength=32;
            var styleNode:JQuery;
            $scope.$watch("currentPattern[0].length",function(value){
                if(value>maxPatternLength){
                    maxPatternLength=value
                    updateGridHighlights();
                }
            });

            $scope.$watch("appState.a.highlight1",updateGridHighlights);
            $scope.$watch("appState.a.highlight2",updateGridHighlights);

            
            function updateGridHighlights(){

                if(styleNode){
                    styleNode.remove();
                }
                var styles='';
                styles+='.position-labels .label:nth-child('+appState.a.highlight1+'n+1){background-color:#DEF;}';
                styles+='.position-labels div.label:nth-child('+appState.a.highlight2+'n+1){background-color:#C2DBF3;}';
                styleNode=$("<style>"+styles+"</style>").appendTo(document.body);

                var h1= appState.a.highlight1;
                var h2= appState.a.highlight2;
                var html="";
                for(var i=0;i<maxPatternLength;i++){
                    if( i%h2 == 0){
                        html+='<div class="h2 cellWidth c'+i+'"></div>'
                    }else if(i%h1==0){
                        html+='<div class="h1 cellWidth c'+i+'"></div>'
                    }
                }
                gridBackgroundEl.html(html);
            }

        }

    }
}
Grid["$inject"]=["musicTheory", "appState", "arrangementService"];