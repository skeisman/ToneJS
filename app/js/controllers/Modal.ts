function Modal($scope:any) {
    $scope.showModal = false;
    $scope.$on("$routeChangeStart", function (evt:ng.IAngularEvent, route:ng.ICurrentRoute) {
        if (route) {
            $scope.showModal = true;
        } else {
            $scope.showModal = false;
        }
        $scope.$emit("stop");
    });
}
Modal["$inject"]=["$scope"];