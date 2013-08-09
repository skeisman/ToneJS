module.exports=function(config){
    config.set({
        basePath:'../',
        frameworks:['jasmine'],
        autoWatch:true,
        browsers:['Chrome'],
        files: [
        'app/lib/angular/angular.js',
        'app/lib/angular/angular-*.js',
        'test/lib/angular/angular-mocks.js',
        'app/js/**/*.js',
        'test/unit/**/*.js'
        ],
        exclude:['app/js/bootstrap.js']

    })
};
