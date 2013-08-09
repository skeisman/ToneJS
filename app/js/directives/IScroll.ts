function IScroll() {
    return{
        restrict: "E",

        link: function ($scope:any, element:JQuery, attrs:any) {
            new iScroll(element[0]);
        }
    }

}