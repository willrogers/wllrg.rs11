/* IIFE */
(function adventXwdModule(global) {
/* Draw a crossword on an HTML canvas. */
'use strict';

/* Set on page load. */
var YEAR;
/* Loaded dynamically from the CSS */
var TODAY_HIGHLIGHT;
var UNRELEASED;


/* Customised grid with extra highlighting for today's clues. */
function AdventGrid(width, height, cellSize, blackSquares, correctAnswer, messageSquares) {
    xwd.Grid.call(this, width, height, cellSize, blackSquares, correctAnswer);
    this.cluesForToday = [];
    this.highlight = true;
    this.correctlyClicked = 0;
    this.messageSquares = messageSquares;
}
var adventGridProto = Object.create(xwd.Grid.prototype);

adventGridProto.draw = function(ctx) {
    xwd.Grid.prototype.draw.call(this, ctx);
    if (this.highlight) {
        for (var i = 0; i < this.cluesForToday.length; i++) {
            this.highlightClue(ctx, this.cluesForToday[i], xwd.TODAY_HIGHLIGHT);
        }
        this.highlightClue(ctx, this.highlighted, xwd.HIGHLIGHT);
        this.highlightCell(ctx);
    } else {
        for (var i = 0; i < this.correctlyClicked; i++) {
            if (i < this.messageSquares.length) {
                var messageSquare = this.messageSquares[i];
                var msgSqCoord = xwd.coord(messageSquare[0], messageSquare[1]);
                xwd.fillSquare(ctx, this.cellSize, msgSqCoord, 'red');
            }
        }
    }
    this.drawNumbers(ctx);
    this.drawLetters(ctx);
};

adventGridProto.setCluesForToday = function(clues) {
    this.cluesForToday = clues;
};


adventGridProto.selectCell = function(cell, toggle) {
    if (this.highlight === true) {
        xwd.Grid.prototype.selectCell.call(this, cell, toggle);
    } else {
        if (this.messageSquares.length > 0) {
            var messageSquare = this.messageSquares[this.correctlyClicked];
            var msgSqCoord = xwd.coord(messageSquare[0], messageSquare[1]);
            if (msgSqCoord.equals(cell)) {
                console.log('Matched! ' + messageSquare);
                this.correctlyClicked += 1;
                this.emitEvent('message', {'detail': 'Highlighting the message...'});
                if (this.correctlyClicked === this.messageSquares.length) {
                    console.log('correct!');
                    this.emitEvent('xwd-finished', null);
                    return;
                }
            } else {
                this.correctlyClicked = 0;
                this.emitEvent('message', {'detail': 'Hidden message incorrect! Try again.'});
            }
        }
    }

}

adventGridProto.unfinish = function(ctx) {
    this.correctlyClicked = 0;
    this.highlight = true;
    this.removeHighlight();
    this.emitEvent('clue-selected', null);
    this.draw(ctx);
}

AdventGrid.prototype = adventGridProto;


function AdventCrossword(canvas, selectedClueDiv, allCluesDiv, clueJson, hiddenInput, checkButton, allContent, correctAnswer, messageSquares) {
    xwd.Crossword.call(this, canvas, selectedClueDiv, allCluesDiv, clueJson, hiddenInput, checkButton, allContent, correctAnswer);
    this.messageSquares = messageSquares;
}

/* Customised crossword able to withhold clues and highlight today's. */
var adventCrosswordProto = Object.create(xwd.Crossword.prototype);

adventCrosswordProto.onCorrect = function() {
    this.grid.highlight = false;
    this.grid.draw(this.ctx);
    this.grid.emitEvent('clue-selected', null);
    if (this.messageSquares.length > 0) {
        this.grid.emitEvent('message', {'detail': 'Now highlight the hidden message.'});
    } else {
        this.grid.emitEvent('xwd-finished', null);
    }
};

adventCrosswordProto.unfinish = function() {
    this.grid.emitEvent('clue-selected', null);
}

adventCrosswordProto.finished = function() {
    var parent = self.allContent.parentElement;
    //self.allContent.classList.add('removed');
    self.finalDiv = document.createElement('div');
    self.finalDiv.id = 'final-div';
    self.finalDiv.style['min-height'] = self.allContent.clientHeight + 'px';
    parent.appendChild(self.finalDiv);
    parent.removeChild(self.allContent);
    var backButton = document.createElement('a');
    backButton.id = 'final-back';
    backButton.textContent = 'back';
    backButton.onclick = function() {
        parent.removeChild(self.finalDiv);
        self.allContent.classList.remove('completed');
        self.grid.unfinish(self.ctx);
        parent.appendChild(self.allContent);
    }
    var msg1 = document.createElement('p');
    msg1.textContent = 'The grid is correct, but what is the hidden message?';
    var msg2 = document.createElement('p');
    msg2.textContent += 'Happy Christmas!';
    self.finalDiv.appendChild(msg1);
    self.finalDiv.appendChild(msg2);
    self.finalDiv.appendChild(backButton);
    scrollToTop();
}

adventCrosswordProto.createGrid = function() {
    this.grid = new AdventGrid(
        this.gridWidth,
        this.gridHeight,
        this.cellSize,
        BLACK_SQUARES,
        this.correctAnswer,
        this.messageSquares
    );
    this.grid.draw(this.ctx);
    this.grid.addListener(this.checkButton);
}

/* Run through all clue divs and make sure none are highlighted. */
adventCrosswordProto.clearSelectedDiv = function() {
    for (var direction of DIRECTIONS) {
        for (var i = 0; i < this.clueDivs.length; i++) {
            var div = this.clueDivs[direction][i];
            div.classList.remove('highlighted');
        }
    }
}

adventCrosswordProto.loadClues = function() {
    var cluesForToday = [];
    var complete = true;
    for (var i = 0; i < DIRECTIONS.length; i++) {
        var direction = DIRECTIONS[i];
        this.clueDivs[direction] = [];
        var dirDivId = DIRECTION_NAMES[i] + "Div";
        var dirDiv = this.allCluesDiv.querySelector(`#${dirDivId}`);
        var clues = this.clueJson[direction];
        for (var clueNum in clues) {
            var clueDivId = direction + clueNum;
            var clueDiv = dirDiv.querySelector(`#${clueDivId}`);
            var clue = clues[clueNum];
            /* Create div if it doesn't exist. */
            if (clueDiv === null) {
                clueDiv = this.createClueDiv(clueNum, direction, clue);
                dirDiv.appendChild(clueDiv);
                this.grid.addListener(clueDiv);
            }
            if (isClueForToday(clue)) {
                cluesForToday.push(xwd.clueName(direction, clueNum));
                clueDiv.classList.add('today');
            } else {
                clueDiv.classList.remove('today');
            }
            /* Fill in text. */
            var clueNumDiv = clueDiv.querySelector('.clue-number');
            clueNumDiv.textContent = `${clueNum}.`;
            if (this.grid.isClueFilled(clueNum, direction)) {
                clueNumDiv.classList.add('solved');
            } else {
                clueNumDiv.classList.remove('solved');
                complete = false;
            }
            var clueTextDiv = clueDiv.querySelector('.clue-text');
            clueTextDiv.textContent = `${this.clueToString(clues[clueNum])}`;
            if (clueDiv.textContent.indexOf('Released') !== -1) {
                clueDiv.classList.add('unreleased');
            } else {
                clueDiv.classList.remove('unreleased');
            }
            this.clueDivs[direction].push(clueDiv);
        }
    }
    this.grid.setCluesForToday(cluesForToday);
    if (complete) {
        console.log('complete');
        this.checkButton.classList.remove('hidden');
    } else {
        console.log('incomplete');
        this.checkButton.classList.add('hidden');
    }
};

adventCrosswordProto.clueToString = function(clue) {
    // Use template literals
    var clueString = '';
    if (isClueActive(clue)) {
        clueString = `${clue[0]}\u00a0(${clue[1]})`;
        if (isClueForToday(clue)) {
            clueString = `${clueString}\u00a0[new]`;
        }
    } else {
        clueString = `Released on ${clue[2]} December`;
    }
    return clueString;
}

AdventCrossword.prototype = adventCrosswordProto;

function isClueActive(clue) {
    const intYear = parseInt(YEAR);
    var dayOfMonth = new Date().getDate();
    var currentMonth = new Date().getMonth();
    var currentYear = new Date().getFullYear();
    return (currentYear > intYear || (currentMonth === 11 && dayOfMonth >= clue[2]));
}

function isClueForToday(clue) {
    const intYear = parseInt(YEAR);
    var dayOfMonth = new Date().getDate();
    var currentMonth = new Date().getMonth();
    var currentYear = new Date().getFullYear();
    return currentYear === intYear && currentMonth === 11 && dayOfMonth === clue[2];
}


function loadData(dataFile, xwdObj) {
    xwd.loadJson(dataFile, function(response) {
        var dataJson = JSON.parse(response);
        AC_SQUARES = dataJson["across-size"];
        DN_SQUARES = dataJson["down-size"];
        BLACK_SQUARES = dataJson["black-squares"];
        var clueJson = dataJson["clues"];
        xwdObj.clueJson = clueJson;
        xwdObj.loadClues();
        xwdObj.grid.draw(xwdObj.ctx);
    });
    /* Reload every minute to update without a page refresh. */
    setTimeout(loadData, 5 * 1000, dataFile, xwdObj);
}

function loadAll(dataFile) {
    xwd.loadJson(dataFile, function(response) {
        var dataJson = JSON.parse(response);
        AC_SQUARES = dataJson["across-size"];
        DN_SQUARES = dataJson["down-size"];
        BLACK_SQUARES = dataJson["black-squares"];
        var clueJson = dataJson["clues"];
        var canvas = document.getElementById('xwd');
        var clueText = document.getElementById('selected-clue-text');
        var hiddenInput = document.getElementById('hidden-input');
        var allClues = document.getElementById('all-clues');
        var checkButton = document.getElementById('check-button');
        var allContent = document.getElementById('crossword-content');
        var correctAnswer = dataJson["correct-answer"];
        var messageSquares = dataJson["message-squares"];
        var xwdObj = new AdventCrossword(
            canvas,
            clueText,
            allClues,
            clueJson,
            hiddenInput,
            checkButton,
            allContent,
            correctAnswer,
            messageSquares
        );
        xwdObj.setupCanvas();
        xwdObj.createGrid();
        xwdObj.setupGrid();
        xwdObj.grid.addListener(clueText);
        xwdObj.loadClues();
        xwdObj.grid.draw(xwdObj.ctx);
        /* Start automatic reload. */
        setTimeout(loadData, 5 * 1000, dataFile, xwdObj);
    });
}

/* The main entry point. */
function main() {
    var canvas = document.getElementById('xwd');
    YEAR = canvas.getAttribute('key');
    COOKIE_KEY = `grid-state-${YEAR}`;
    var style = getComputedStyle(document.body);
    xwd.HIGHLIGHT = style.getPropertyValue('--highlight-color');
    xwd.TODAY_HIGHLIGHT = style.getPropertyValue('--today-color');
    xwd.UNRELEASED = style.getPropertyValue('--unreleased-color');
    var dataFile = `/static/xwd${YEAR}.json`;
    loadAll(dataFile);
}

/* Exports */
var adventXwd = {};
adventXwd.AdventGrid = AdventGrid;
adventXwd.AdventCrossword = AdventCrossword;
adventXwd.main = main;
global.adventXwd = adventXwd;

}(window));
