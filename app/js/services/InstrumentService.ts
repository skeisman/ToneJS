class InstrumentService {
    instruments:ISourceData[];
    static $inject=["$http","$q"];
    constructor(public $http:ng.IHttpService,public $q:ng.IQService){

    }

    getInstruments():ng.IPromise{
        var me=this;
        var defer:ng.IDeferred=me.$q.defer();
        if(me.instruments){
            defer.resolve(me.instruments);
        }else{
            me.$http.get("data/instruments.json").success(function(data, status, headers, config){
                me.instruments=data.data;
                defer.resolve(me.instruments);
            });
        }

        return defer.promise;
    }
}