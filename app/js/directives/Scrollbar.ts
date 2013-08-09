/**
 * Creates a generic scrollbar.
 */
function Scrollbar() {
    return{
        restrict: "E",
        scope:{
            scroll:'=',
            direction:'='
        },
        template:'<div class="wrapper"><div class="handle" ng-style="handleStyle()" ></div></div>',

        link: function ($scope:any, element:JQuery, attrs:any) {
            var handle=element.find('.handle');
            var wrapper= element.find('.wrapper');
            var minScroll=5;
            var startMouse:number;
            var startHandle:number=5;
            var lastMouse:number;

            if(attrs.direction=='H'){
                element.addClass('horizontal');
                handle.bind('mousedown touchstart',function(evt:JQueryEventObject){
                    var originalEvent:any=evt.originalEvent;
                    var touches:any[]=originalEvent.touches;
                    evt.preventDefault();
                    startMouse=(touches ? touches[0].pageX : evt.pageX);
                    startHandle=parseFloat(handle.css("left"));
                    var maxScroll= element.width()-(minScroll*2)-handle.width();
                    $(document.body).bind("touchmove mousemove", function (evt) {
                        evt.preventDefault();
                        lastMouse=(touches ? touches[0].pageX : evt.pageX);
                        var value=startHandle + lastMouse - startMouse - minScroll;
                        var scroll=(value/maxScroll)*$scope.scroll.maxScrollX;
                        scroll=Math.max(0,scroll);
                        scroll=Math.min(scroll, $scope.scroll.maxScrollX)
                        $scope.$apply(function(){
                            $scope.scroll.scrollX=Math.round(scroll)
                        })

                    });

                    $(document.body).bind("mouseup touchend touchcancel", function (evt) {
                        $(document.body).unbind("mouseup touchend touchcancel touchmove mousemove");

                    });
                });

            }else{
                element.addClass('vertical');

                handle.bind('mousedown touchstart',function(evt){
                    var originalEvent:any=evt.originalEvent;
                    var touches:any[]=originalEvent.touches;
                    startMouse=(touches ? touches[0].pageY : evt.pageY);
                    startHandle=parseFloat(handle.css("top"));
                    var maxScroll= element.height()-(minScroll*2)-handle.height();
                    $(document.body).bind("touchmove mousemove", function (evt) {
                        lastMouse=(touches ? touches[0].pageY : evt.pageY);
                        var value=startHandle + lastMouse - startMouse - minScroll;
                        var scroll=(value/maxScroll)*$scope.scroll.maxScrollY;
                        scroll=Math.max(0,scroll);
                        scroll=Math.min(scroll, $scope.scroll.maxScrollY)
                        $scope.$apply(function(){
                            $scope.scroll.scrollY=Math.round(scroll)
                        })

                    });

                    $(document.body).bind("mouseup touchend touchcancel", function (evt) {
                        $(document.body).unbind("mouseup touchend touchcancel touchmove mousemove");

                    });
                });
            }


            $scope.handleStyle=function(){
                var maxScrollSize;
                var styles:any={};
                element.css({opacity:1});
                var scroll:IScrollState=$scope.scroll;
                var maxScroll:number;
                if(attrs.direction=='H'){
                    if(scroll.maxScrollX==0){
                        styles.display="none";
                        element.css({opacity:0.3});
                    }
                    maxScroll= element.width()-(minScroll*2)-handle.width();
                    styles.left=Math.round(minScroll+(scroll.scrollX/scroll.maxScrollX)*maxScroll)+"px";
                }else{
                    if(scroll.maxScrollY==0){
                        styles.display="none";
                        element.css({opacity:0.3});
                    }
                    maxScroll= element.height()-(minScroll*2)-handle.height();
                    styles.top=Math.round(minScroll+(scroll.scrollY/scroll.maxScrollY)*maxScroll)+"px";
                }
                return styles;
            }

        }
    }
}