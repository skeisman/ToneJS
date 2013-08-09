/**
 * Provides utility methods for working with musical scales/chords/notes
 * 
 * @constructor
 */
class MusicTheory {
    notes:string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'OFF'];
    scale:any = {
        "Major": [0, 2, 4, 5, 7, 9, 11],
        "Natural Minor": [0, 2, 3, 5, 7, 8, 10],
        "Harmonic Minor": [0, 2, 3, 5, 7, 8, 11],
        "Mixolydian Augmented": [0, 2, 4, 5, 8, 9, 10],
        "Harmonic Major": [0, 2, 4, 5, 8, 9, 11],
        "Lydian Minor": [0, 2, 4, 6, 7, 8, 10],
        "Lydian Dominant": [0, 2, 4, 6, 7, 9, 10],
        "Lydian": [0, 2, 4, 6, 7, 9, 11],
        "Lydian Augmented": [0, 2, 4, 6, 8, 9, 10],
        "Leading Whole Tone": [0, 2, 4, 6, 8, 10, 11],
        "Rock 'n Roll": [0, 3, 4, 5, 7, 9, 10],
        "Hungarian Major": [0, 3, 4, 6, 7, 9, 10],
        "Pentatonic Major": [0, 2, 4, 7, 9],
        "Pentatonic Minor": [0, 3, 5, 7, 10],
        "Spanish 8 Tone": [0, 1, 3, 4, 5, 6, 8, 10],
        "Flamenco": [0, 1, 3, 4, 5, 7, 8, 10],
        "Symmetrical": [0, 1, 3, 4, 6, 7, 9, 10],
        "Diminished": [0, 2, 3, 5, 6, 8, 9, 11],
        "Whole Tone": [0, 2, 4, 6, 8, 10],
        "Augmented": [0, 3, 4, 7, 8, 11],
        "Ultra Locrian": [0, 1, 3, 4, 6, 8, 9],
        "Super Locrian": [0, 1, 3, 4, 6, 8, 10],
        "Indian": [0, 1, 3, 4, 7, 8, 10],
        "Locrian": [0, 1, 3, 5, 6, 8, 10],
        "Phrygian": [0, 1, 3, 5, 7, 8, 10],
        "Neapolitan Minor": [0, 1, 3, 5, 7, 8, 11],
        "Javanese": [0, 1, 3, 5, 7, 9, 10],
        "Neapolitan Major": [0, 1, 3, 5, 7, 9, 11],
        "Todi (Indian)": [0, 1, 3, 6, 7, 8, 11],
        "Persian": [0, 1, 4, 5, 6, 8, 11],
        "Oriental": [0, 1, 4, 5, 6, 9, 10],
        "Phrygian Major": [0, 1, 4, 5, 7, 8, 10],
        "Double Harmonic": [0, 1, 4, 5, 7, 8, 11],
        "Marva (Indian)": [0, 1, 4, 6, 7, 9, 11],
        "Enigmatic": [0, 1, 4, 6, 8, 10, 11],
        "Locrian Natural 2nd": [0, 2, 3, 5, 6, 8, 10],
        "Dorian": [0, 2, 3, 5, 7, 9, 10],
        "Melodic Minor (Asc)": [0, 2, 3, 5, 7, 9, 11],
        "Hungarian Gypsy": [0, 2, 3, 6, 7, 8, 10],
        "Hungarian Minor": [0, 2, 3, 6, 7, 8, 11],
        "Romanian": [0, 2, 3, 6, 7, 9, 10],
        "Locrian Major": [0, 2, 4, 5, 6, 8, 10],
        "Hindu": [0, 2, 4, 5, 7, 8, 10],
        "Ethiopian": [0, 2, 4, 5, 7, 8, 11],
        "Mixolydian": [0, 2, 4, 5, 7, 9, 10]
    };

    chords:any = {
        "69": [0, 2, 4, 7, 9],
        "Major": [0, 4, 7],
        "Minor": [0, 3, 7],
        "7": [0, 4, 7, 10],
        "m7": [0, 3, 7, 10],
        "Maj7": [0, 4, 7, 11],
        "7b5": [0, 4, 6, 10],
        "7#5": [0, 4, 8, 10],
        "m7b5": [0, 3, 6, 10],
        "7b9": [0, 1, 4, 7, 10],
        "6": [0, 4, 7, 9],
        "m6": [0, 3, 7, 9],
        "9": [0, 2, 4, 7, 10],
        "m9": [0, 2, 3, 7, 10],
        "maj9": [0, 2, 4, 7, 11],
        "add9": [0, 2, 4, 7],
        "sus2": [0, 2, 7],
        "sus4": [0, 5, 7],
        "dim": [0, 3, 6],
        "dim7": [0, 3, 6, 9],
        "aug": [0, 4, 8]

    };

    public getChordsFromScale(scale:number[], root:number):IChordInfo[] {
        var results:IChordInfo[] = [];

        var chords = this.chords;
        for (var chordName in chords) {
            var chord:number[] = chords[chordName];
            var ch:number[] = chord;
            for (var i:number = 0; i < scale.length; i++) {
                var found:Boolean = true;
                ch = this.rotateNotes(chord, scale[i])
                for (var j:number = 0; j < ch.length; j++) {
                    if (scale.indexOf(ch[j]) == -1) {
                        found = false
                        break;
                    }
                }

                if (found) {
                    var n2:number[] = this.rotateNotes(ch, root)
                    var r = (scale[i] + root) % 12;
                    var n:string = (this.notes[r]) + " " + chordName+ " (";
                    for (var k:number = 0; k < n2.length; k++) {
                        n += this.notes[n2[k]] + " ";
                    }
                    n+=")"
                    results.push({pos: i, root: r, label: n, notes: n2 });
                }

            }
        }
        results = <IChordInfo[]>results.sort(function (a, b) {
            return a.pos > b.pos ? 1 : a.pos < b.pos ? -1 : 0
        });

        return results
    }

    public noteName(note:number):string {
        var toneName:string = this.notes[note % 12]
        var result:string
        if (toneName.length == 2) {
            result = toneName + "" + Math.floor(note / 12)
        } else {
            result = toneName + " " + Math.floor(note / 12)
        }
        return result
    }

    public rotateNotes(notes:number[], value:number):number[] {
        var results:number[] = [];
        for (var i:number = 0; i < notes.length; i++) {
            results.push((notes[i] + value) % 12)
        }
        results = <number[]>results.sort(function (a, b) {
            return a > b ? 1 : a < b ? -1 : 0
        })
        return results
    }

    public transposeNotes(notes:number[], value:number):number[] {
        var results:number[] = [];
        for (var i:number = 0; i < notes.length; i++) {
            results.push((notes[i] + value))
        }
        return results
    }

}
