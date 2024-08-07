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

                    // Highlight the current note
                    document.getElementById(`score_text`).innerHTML = scoreLines.map((l, li) => {
                        if (li === lineIndex) {
                            return l.split(/[\s]+/).map((n, ni) => ni === segIndex ? `<span style="background-color: lightblue;">${n}</span>` : n).join(' ');
                        }
                        return l;
                    }).join('<br>');
                  
                    // Play the note or silence based on the note
                    if (note === '-') {
                        synthSilent.triggerAttackRelease('C1', noteDuration / 1000, Tone.now());
                        //console.log(`Playing: Silence for ${noteDuration / 1000}s at ${Tone.now()}s`);
                    } else {
                        var musicalNote = getShiftedNote(note, transpose); // Convert Indian note to Western note from noteMap
                        //console.log(`Playing: ${note} ${musicalNote} for ${noteDuration / 1000}s segment ${cumSegIndex} modulo ${Math.abs(cumSegIndex % taal) } in line ${lineIndex}`);
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
    const synthSilent = new Tone.Synth().chain(new Tone.Volume(-64), Tone.Destination); // Silence is 64dB lower volume

    const synthHalfVolume = new Tone.Synth().chain(new Tone.Volume(-6), Tone.Destination); // basenote 8dB lower volume

    // Play base note for the entire duration 
    synthHalfVolume.triggerAttackRelease(baseNote, totalDuration / 1000, Tone.now());

    gamenotes.forEach((note, index) => {
        var musicalNote = getShiftedNote(note, transpose); // Convert Indian note to Western note from noteMap

        setTimeout(() => {
            if (musicalNote === 'SILENCE') {
                synthSilent.triggerAttackRelease('C1', 0.3, Tone.now()); // Play a silent note
            }
            else {// Play musical note at full volume
            synthFullVolume.triggerAttackRelease(musicalNote, 1, Tone.now() + index);
            }
        }, index * 1000); // Add 500ms delay before playing the first note

    });

}

// function to play the game
let score = 0; // Initialize the score to 0
function playGame() {

    // Delete all text in the score_text
    document.getElementById('score_text').innerHTML = '';
    // switch off metronome
    document.getElementById('metronomeOn').checked = false;

    var level = document.getElementById('level-select').value; // Get the selected level
    var n_b_notes = ['R', 'G', 'm', 'P', 'D', 'N', 'S\'']; // notes for novice and beginner levels
    var i_notes = ['r', 'R', 'g', 'G', 'm', 'M', 'P', 'd', 'D', 'n', 'N', 'S\'']; // notes for intermediate level
    var a_notes = ['\'m', '\'M', '\'P', '\'D', '\'N', 'S', 'r', 'R', 'g', 'G', 'm', 'M', 'P', 'd', 'D', 'n', 'N', 'S\'', 'R\'', 'G\'', 'm\'', 'P\'']; // notes for advanced level
    var randomNote1 = n_b_notes[Math.floor(Math.random() * n_b_notes.length)];
    var randomNote2 = n_b_notes[Math.floor(Math.random() * n_b_notes.length)];
    var randomNote3 = i_notes[Math.floor(Math.random() * i_notes.length)];
    var randomNote4 = a_notes[Math.floor(Math.random() * a_notes.length)];
    if (level === 'novice') {
        var challenge = ['-',randomNote1];
        playgameAudio(challenge);
    } else if (level === 'beginner') {
        var challenge = ['-', randomNote1, randomNote2];
        playgameAudio(challenge);
    } else if (level === 'intermediate') {
        var challenge = ['-', randomNote1, randomNote2, randomNote3];
        playgameAudio(challenge);
    } else if (level === 'advanced') {
        var challenge = ['-', randomNote1, randomNote2, randomNote3, randomNote4];
        playgameAudio(challenge);
    }
    //setTimeout(() => {
    // reveal musical note
    //document.getElementById('score_text').innerHTML = challenge.join(' ');
    //}, challenge.length * 2500);

    // Calculate the total duration of the challenge
    var totalDuration = challenge.length * 1000; // Assuming each note takes 2500ms

    // answer is challenge without the first element
    let answer = challenge.slice(1).join(' ');

    // Set a timeout to prompt the user after the challenge has finished playing
    setTimeout(() => {
       
        // Prompt the user to enter an answer
        var userAnswer = prompt('Enter your answer:');
        // Call addShowAnswer with the current challenge
        addShowAnswer(userAnswer, answer);

    }, totalDuration);

    // Function to count the number of alphabets in a string
    function countAlphabets(str) {
        const matches = str.match(/[a-zA-Z]/g);
        return matches ? matches.length : 0;
    }

    // Function to add the user's answer and the correct answer to the score_text element
    function addShowAnswer(userAnswer,answer) {
            // Get the number of alphabets in the answer
             const numAlphabets = countAlphabets(answer);

            // check if user entered the correct answer and print it in score_text
            if (userAnswer === answer) {

                // Increase the score by 10*num of notes
                score += 10 * numAlphabets; // Increase the score by 10*num of notes
                document.getElementById('score_text').innerHTML = `Correct! <br> <br> Swaras: ${answer} <br> <br> Score: ${score}`;

            }
            else {
                document.getElementById('score_text').innerHTML = `Swaras: &nbsp &nbsp &nbsp${answer} <br> <br> You entered: ${userAnswer} <br> <br> Score: ${score}`;
            }
      
            
    }

   

}


// Function to update the score_text element
function updateScoreText(text) {
    const scoreTextElement = document.getElementById('score_text');
    const selection = window.getSelection(); // Get the current selection
    if (selection.rangeCount === 0 || !scoreTextElement.contains(selection.anchorNode)) {
        scoreTextElement.focus(); // Focus the text area if it's not focused
    }
    const range = selection.getRangeAt(0); // Get the range of the selection
    range.deleteContents();


        let textNode;

    if (text === 'Clear') {
        // put cursor at the beginning of the score text
        range.setStart(scoreTextElement, 0);
        range.setEnd(scoreTextElement, 0);
        selection.removeAllRanges();
        selection.addRange(range); // Add the updated range to the selection       
        // Clear the score text
        scoreTextElement.innerHTML = '';
        return;
    }

    else if (text === ',') {
        // if previous character is a space, remove the space
        if (range.startOffset > 0 && range.startContainer.textContent[range.startOffset - 1] === ' ') {
            //console.log('removing space');
            range.setStart(range.startContainer, range.startOffset - 1);
            range.deleteContents();
        }
        textNode = document.createTextNode(text);
    }
    else if (text === '⤶') {
        // Enter key inserts a new line
        textNode = document.createElement("br");
    }
    else  {
        // Create a text node with the selected text
        textNode = document.createTextNode(text + ' '); 
        }

    range.insertNode(textNode); // Insert the text node into the range
    // Move the cursor to the end of the inserted text
    range.setStart(textNode, textNode.length);
    range.setEnd(textNode, textNode.length);
    selection.removeAllRanges();
    selection.addRange(range); // Add the updated range to the selection


}


// Add event listeners to the buttons
document.querySelectorAll('.scoreButton').forEach(button => {
    button.addEventListener('click', function () {
        const text = this.getAttribute('data-text');
        updateScoreText(text);
    });
});


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
