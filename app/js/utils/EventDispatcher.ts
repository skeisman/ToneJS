/// <reference path="IEventDispatcher.ts" />
/**
 * Simple observer pattern.
 */
class EventDispatcher implements IEventDispatcher{
    private _listeners:any[];

    constructor() {
        this._listeners = [];
    }

    public hasListener(type:string, listener:Function):bool {
        var exists:bool = false;
        for (var i = 0; i < this._listeners.length; i++) {
            if (this._listeners[i].type === type && this._listeners[i].listener === listener) {
                exists = true;
            }
        }
        return exists;
    }

    public on(typeStr:string, listenerFunc:Function):void {
        if (this.hasListener(typeStr, listenerFunc)) {
            return;
        }

        this._listeners.push({type: typeStr, listener: listenerFunc});
    }

    public off(typeStr:string, listenerFunc:Function):void {
        for (var i = 0; i < this._listeners.length; i++) {
            if (this._listeners[i].type === typeStr && this._listeners[i].listener === listenerFunc) {
                this._listeners.splice(i, 1);
            }
        }
    }

    public fire(typeStr:string, data:any):void {
        for (var i = 0; i < this._listeners.length; i++) {
            if (this._listeners[i].type === typeStr) {
                this._listeners[i].listener.call(this, typeStr, data);
            }
        }
    }
}
