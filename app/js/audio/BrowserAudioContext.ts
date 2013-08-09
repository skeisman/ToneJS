/// <reference path="../interfaces/webaudioapi/waa-20120802.d.ts" />
/**
 * Gets a singleton reference to the browser audio context.
 * Some browsers do not allow multiple audioContexts.
 */
class BrowserAudioContext {
    static instance:webkitAudioContext;

    static getInstance():webkitAudioContext {
        if (!instance) {
            try{
                instance = new webkitAudioContext();
            }catch(e){
                console.log(e);
            }
        }
        return instance
    }
}
