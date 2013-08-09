'use strict';

/* jasmine specs for services go here */
describe("services",function(){
    var musicTheory= new MusicTheory();

    describe('MusicTheory', function(){

        it('should convert a note number into a note name',function(){
            expect(musicTheory.noteName(12)).toEqual("C 1");
            expect(musicTheory.noteName(13)).toEqual("C#1");
            expect(musicTheory.noteName(37)).toEqual("C#3");
        });

        it("should transpose an array of notes by a value",function(){
            expect(musicTheory.transposeNotes([1,2,3,4],2)).toEqual([3,4,5,6]);
            expect(musicTheory.transposeNotes([6,5,4,3,2],-2)).toEqual([4,3,2,1,0]);
        });

    });
});

