interface IEventDispatcher {
    hasListener(type:string, listener:Function):bool;
    on (typeStr:string, listenerFunc:Function):void;
    off (typeStr:string, listenerFunc:Function):void;
    fire (type:string, data:any):void;
}