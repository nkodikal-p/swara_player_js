const noteMap = {
    '\'S': 'C3', '\'r': 'Db3', '\'R': 'D3', '\'g': 'Eb3', '\'G': 'E3', '\'m': 'F3', '\'M': 'Gb3', '\'P': 'G3', '\'d': 'Ab3', '\'D': 'A3', '\'n': 'Bb3', '\'N': 'B3', 'S': 'C4', 'r': 'Db4', 'R': 'D4', 'g': 'Eb4', 'G': 'E4', 'm': 'F4', 'M': 'Gb4', 'P': 'G4', 'd': 'Ab4', 'D': 'A4', 'n': 'Bb4', 'N': 'B4', 'S\'': 'C5', 'r\'': 'Db5', 'R\'': 'D5', 'g\'': 'Eb5', 'G\'': 'E5', 'm\'': 'F5', 'M\'': 'Gb5', 'P\'': 'G5', 'd\'': 'Ab5', 'D\'': 'A5', 'n\'': 'Bb5', 'N\'': 'B5', 'S\'\'': 'C6', '-': 'SILENCE'
}; // Map of Indian notes to Western notes

// handle transpose changes
let transpose = 0; // Default transpose value

function updateTransposeDisplay() {
    document.getElementById('transposeValue').textContent = transpose;
}

document.getElementById('decreaseTranspose').addEventListener('click', function () {
    transpose -= 1; // Decrease transpose
    updateTransposeDisplay(); // Update the display
});

document.getElementById('increaseTranspose').addEventListener('click', function () {
    transpose += 1; // Increase transpose
    updateTransposeDisplay(); // Update the display
});

// get the transpose value from the input field
updateTransposeDisplay();

// Create a function to play a click sound for the metronome
function playClick() {
    // Create an oscillator for a beep sound
    const oscillator = new Tone.Oscillator({
        type: 'square', // This type gives a clear click sound
        frequency: 2000 // Frequency in Hz for the beep sound
    }).toDestination();

    // Short duration for the click sound
    const duration = 0.005; // Duration in seconds

    // Start the oscillator and stop it after the duration to make a click sound
    oscillator.start();
    oscillator.stop(`+${duration}`);
}

// Create a function to transpose the note by a given number of semitones
function getShiftedNote(note, transpose) {
    if (note === '-') transpose = 0; // do not transpose the '-' note which is a pause
    const notes = Object.keys(noteMap); // Get all notes as an array
    const noteIndex = notes.indexOf(note); // Find the index of the current note
    if (noteIndex === -1) return null; // Return null if note is not found

    const shiftedIndex = (noteIndex + transpose); // Calculate the new index 
    return noteMap[notes[shiftedIndex]]; // Return the shifted note from noteMap
}

// function to play the score
function playScore() {

    var scoreLines = document.getElementById('score_text').innerText.split(/[\n\r]+/); // get the score text and split it by new lines

    var bpm = parseInt(document.getElementById('bpm').value, 10); // get the 'bpm' value
    // if bpm is not a number or less than 1, set it to 60
    if (isNaN(bpm) || bpm < 1) {
        bpm = 60;
        document.getElementById('bpm').value = bpm;
    }

    var taal = parseInt(document.getElementById('taal').value, 10); // Get the 'taal' value
    // if taal is not a number or less than 1, set it to 4
    if (isNaN(taal) || taal < 1) {
        taal = 4;
        document.getElementById('taal').value = taal;
    }

    const beatDuration = (60 / bpm) * 1000; // Duration of a single beat in milliseconds
    
    const synth = new Tone.Synth().toDestination();
    const synthSilent = new Tone.Synth().chain(new Tone.Volume(-64), Tone.Destination); // Silence is 64dB lower volume

    let segmentStartTime = 0; // Start time for each segment
    let cumSegIndex = 0; // Keep track of cumulative segment index for metronome

    scoreLines.forEach((line, lineIndex) => {
        let segments = line.trim().split(/\s+/); // Split each line into segments by whitespace

        segments.forEach((segment,segIndex) => {
            let notes = segment.split(','); // Split each segment into notes by comma
            let noteDuration = beatDuration / notes.length; // Duration for each note within a segment

            notes.forEach((note, noteIndex) => { // Iterate over each note in the segment
                setTimeout(() => {

                  
                    // Play the note or silence based on the note
                    if (note === '-') {
                        synthSilent.triggerAttackRelease('C1', noteDuration / 1000, Tone.now());
                        console.log(`Playing: Silence for ${noteDuration / 1000}s at ${Tone.now()}s`);
                    } else {
                        var musicalNote = getShiftedNote(note, transpose); // Convert Indian note to Western note from noteMap
                        console.log(`Playing: ${note} ${musicalNote} for ${noteDuration / 1000}s segment ${cumSegIndex} modulo ${Math.abs(cumSegIndex % taal) } in line ${lineIndex}`);
                        synth.triggerAttackRelease(musicalNote, noteDuration / 1000, Tone.now());
                        // Play click sound every 'taal' notes if metronome is on
                        if (document.getElementById('metronomeOn').checked && Math.abs(cumSegIndex % taal) <= 0.001) {
                            //console.log(`Playing click at  for segment ${cumSegIndex} in line ${lineIndex} note ${note}`);
                            playClick();
                        }
                    }
                    cumSegIndex += 1/notes.length; // Increment cumulative segment index

                }, segmentStartTime + noteIndex * noteDuration);

            });
           
            segmentStartTime += beatDuration; // Increment start time for the next segment

        });
    });
}



// function to play game audio
function playgameAudio(gamenotes) {
    if (gamenotes.length === 0) return; // Exit if there are no game notes

    var baseNote = getShiftedNote('S', transpose); // Base note is always 'S' (with transpose)


    const totalDuration = gamenotes.length * 2000; // Total duration based on number of notes and delay

    // Create synth instances
    const synthFullVolume = new Tone.Synth().toDestination();
    const synthHalfVolume = new Tone.Synth().chain(new Tone.Volume(-6), Tone.Destination); // basenote 8dB lower volume

    // Play base note for the entire duration 
    synthHalfVolume.triggerAttackRelease(baseNote, totalDuration / 1000, Tone.now());

    gamenotes.forEach((note, index) => {
        var musicalNote = getShiftedNote(note, transpose); // Convert Indian note to Western note from noteMap

        setTimeout(() => {
            // Play musical note at full volume
            synthFullVolume.triggerAttackRelease(musicalNote, 1, Tone.now() + index);
        }, index * 1000 + 500); // Add 500ms delay before playing the first note
    });
}

// function to play the game
function playGame() {

    // Delete all text in the score_text
    document.getElementById('score_text').innerHTML = '';
    // switch off metronome
    document.getElementById('metronomeOn').checked = false;

    var level = document.getElementById('level-select').value; // Get the selected level
    var n_b_notes = ['R', 'G', 'm', 'P', 'D', 'N', 'S\''];
    var i_notes = ['r', 'R', 'g', 'G', 'm', 'M', 'P', 'd', 'D', 'n', 'N', 'S\''];
    var a_notes = ['\'m', '\'M', '\'P', '\'D', '\'N', 'S', 'r', 'R', 'g', 'G', 'm', 'M', 'P', 'd', 'D', 'n', 'N', 'S\'', 'R\'', 'G\'', 'm\'', 'P\''];
    var randomNote1 = n_b_notes[Math.floor(Math.random() * n_b_notes.length)];
    var randomNote2 = n_b_notes[Math.floor(Math.random() * n_b_notes.length)];
    var randomNote3 = i_notes[Math.floor(Math.random() * i_notes.length)];
    var randomNote4 = a_notes[Math.floor(Math.random() * a_notes.length)];
    if (level === 'novice') {
        var challenge = [randomNote1];
        playgameAudio(challenge);
    } else if (level === 'beginner') {
        var challenge = [randomNote1, randomNote2];
        playgameAudio(challenge);
    } else if (level === 'intermediate') {
        var challenge = [randomNote1, randomNote2, randomNote3];
        playgameAudio(challenge);
    } else if (level === 'advanced') {
        var challenge = [randomNote1, randomNote2, randomNote3, randomNote4];
        playgameAudio(challenge);
    }
    //setTimeout(() => {
    // reveal musical note
    //document.getElementById('score_text').innerHTML = challenge.join(' ');
    //}, challenge.length * 2500);



    // Call addShowAnswerButton with the current challenge
    addShowAnswerButton(challenge);

    function addShowAnswerButton(challenge) {
        let showAnswerButton = document.getElementById('showAnswerButton');
        if (!showAnswerButton) {
            // Create the 'Show Answer' button if it doesn't exist
            showAnswerButton = document.createElement('button');
            showAnswerButton.textContent = 'Show Answer';
            showAnswerButton.id = 'showAnswerButton';
            // Insert the 'Show Answer' button after the 'Name that Swara' button
            nameThatSwaraButton.insertAdjacentElement('afterend', showAnswerButton);
        } else {
            // If the button already exists, just update its position
            nameThatSwaraButton.insertAdjacentElement('afterend', showAnswerButton);
        }
        // Add the 'answer-button' class to the element for css styling
        showAnswerButton.classList.add('answer-button');

        // Update the event listener every time addShowAnswerButton is called
        showAnswerButton.onclick = function () {
            document.getElementById('score_text').innerHTML = challenge.join(' ');
        };
        // Update the event listener every time addShowAnswerButton is called
        showAnswerButton.onclick = function () {
            document.getElementById('score_text').innerHTML = challenge.join(' ');
        };
    }


}

// below code is for the audio context to avoid the warnings
// Define a variable to hold the AudioContext
let audioContext;

// Function to create or resume the AudioContext
function createOrResumeAudioContext() {
    if (!audioContext) {
        // Create the AudioContext if it doesn't exist
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } else if (audioContext.state === 'suspended') {
        // Resume the AudioContext if it's suspended
        audioContext.resume();
    }
}

// Add an event listener to the document or a specific element to handle user interaction
document.addEventListener('click', createOrResumeAudioContext);
