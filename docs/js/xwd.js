var DIRECTIONS = ['ac', 'dn'];
var DIRECTION_NAMES = ['Across', 'Down'];

/* Set on page load. */
var KEY;
var COOKIE_KEY;
/* Loaded dynamically from the CSS */
var HIGHLIGHT;
/* Loaded from JSON. */
var AC_SQUARES;
var DN_SQUARES;
var BLACK_SQUARES;
/* Hard-coded */
var WHITE = 'white';
var BLACK = 'black';
var CELL_HIGHLIGHT = '#87d3ff';

/* IIFE */
(function xwdModule(global) {

'use strict';

var xwd = {};

/* Draw a crossword on an HTML canvas. */

/* See https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript */
String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};


var scrollToTop = function() {
    window.scroll({top: 0, left: 0, behavior: 'smooth' });
}


var loadJson = function(file, callback) {
    // see https://laracasts.com/discuss/channels/general-discussion/load-json-file-from-javascript
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', file, true);
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a
            // value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
          }
    };
    xobj.send(null);
}


function Coord(x, y) {
    this.x = x;
    this.y = y;
}

Coord.prototype.toString = function() {
    return this.x + ',' + this.y;
};

Coord.prototype.equals = function(other) {
    return this.x === other.x && this.y === other.y;

};

var coord = function(x, y) {
    return new Coord(x, y);
}

function coordFromString(str) {
    var parts = str.split(',');
    var x = parts[0] - 0;
    var y = parts[1] - 0;
    return coord(x, y);
}

function clueSeq(x, y, length, direction) {
    return {x: x, y: y, length: length, direction: direction};
}

var clueName = function(direction, number) {
    return {direction: direction, number: number};
}

function isLetter(str) {
      return str.length === 1 && (str.match(/[a-z]/i) || str.match(/[A-Z]/i));
}

function cellInArray(array, cell) {
    for (var k = 0; k < array.length; k++) {
        if (array[k][0] === cell.x && array[k][1] === cell.y) {
            return true;
        }
    }
    return false;
}

var fillSquare = function(ctx, cellSize, cell, color) {
    ctx.fillStyle = color;
    ctx.fillRect(cellSize * cell.x + 1, cellSize * cell.y + 1,
            cellSize - 1, cellSize - 1);
}

function cellInClue(clue, cell) {
    if (clue.direction === 'ac') {
        for (var i = clue.x; i < clue.x + clue.length; i++) {
            if (cell.x == i && cell.y == clue.y) {
                return true;
            }
        }
    }
    if (clue.direction === 'dn') {
        for (var i = clue.y; i < clue.y + clue.length; i++) {
            if (cell.x == clue.x && cell.y == i) {
                return true;
            }
        }
    }
    return false;
}

function colorClue(ctx, cellSize, color, clue) {
    if (clue.direction === 'ac') {
        for (var i = clue.x; i < clue.x + clue.length; i++) {
            fillSquare(ctx, cellSize, coord(i, clue.y), color);
        }
    }
    if (clue.direction === 'dn') {
        for (var i = clue.y; i < clue.y + clue.length; i++) {
            fillSquare(ctx, cellSize, coord(clue.x, i), color);
        }
    }
}

var Grid = function(width, height, cellSize, blackSquares, correctAnswer) {
    this.width = width;
    this.height = height;
    this.blackSquares = blackSquares;
    this.whiteSquares = [];
    this.cellSize = cellSize;
    this.correctAnswer = correctAnswer;
    this.eventListeners = [];
    /* each is a clueSeq */
    this.clues = {
        'ac': {},
        'dn': {}
    };
    if (typeof Cookies.get(COOKIE_KEY) === 'undefined') {
        this.letters = {};
    } else {
        this.letters = JSON.parse(Cookies.get(COOKIE_KEY));
    }
    this.highlight = true;
    /* A clueName. */
    this.highlighted = null;
    this.selectedCell = null;
    this.figureOutWhiteSquares();
    this.figureOutClues();
}

Grid.prototype.addListener = function(listener) {
    this.eventListeners.push(listener);
};

Grid.prototype.emitEvent = function(name, detail) {
    var event = new CustomEvent(name, detail, true, true);
    for (var i = 0; i < this.eventListeners.length; i++) {
        this.eventListeners[i].dispatchEvent(event);
    }
}

Grid.prototype.figureOutWhiteSquares = function() {
    for (var i = 0; i < AC_SQUARES; i++) {
        for (var j = 0; j < DN_SQUARES; j++) {
            var cell = coord(i, j);
            if (!cellInArray(this.blackSquares, cell)) {
                this.whiteSquares.push([i, j]);
            }
        }
    }
};

Grid.prototype.drawNumbers = function(ctx) {
    ctx.fillStyle = BLACK;
    for (var i = 0; i < 2; i++) {
        var direction = DIRECTIONS[i];
        for (var clueNumber in this.clues[direction]) {
            if (this.clues[direction].hasOwnProperty(clueNumber)) {
                var clue = this.clues[direction][clueNumber];
                this.drawNumber(ctx,
                                clueNumber,
                                coord(clue.x, clue.y));
            }
        }
    }
};

Grid.prototype.drawLetters = function(ctx) {
    ctx.fillStyle = BLACK;
    for (var key in this.letters) {
        var letter = this.letters[key];
        this.drawLetter(ctx,
                        letter,
                        coordFromString(key));
    }
};

Grid.prototype.lettersToString = function() {
    var letterString = '';
    for (var i = 0; i < AC_SQUARES; i++) {
        for (var j = 0; j < DN_SQUARES; j++) {
            var crd = coord(i, j);
            if (crd in this.letters) {
                letterString += this.letters[crd];
            }
        }
    }
    return letterString;
}

Grid.prototype.drawNumber = function(ctx, number, cell) {
    ctx.fillStyle = BLACK;
    var fontSize = Math.round(this.cellSize * 0.35);
    ctx.font = fontSize + 'px serif';
    ctx.textBaseline = 'hanging';
    ctx.textAlign = 'left';
    ctx.fillText(number, this.cellSize * (cell.x + 0.1), this.cellSize * (cell.y + 0.1));
};

Grid.prototype.drawLetter = function(ctx, letter, cell) {
    ctx.fillStyle = BLACK;
    var fontSize = Math.round(this.cellSize * 0.7);
    ctx.font = fontSize + 'px sans';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(letter, this.cellSize * (cell.x + 0.5) + 1, this.cellSize * (cell.y + 0.5) + 1);
};

Grid.prototype.isClueFilled = function(clueNum, direction) {
    var clue = this.clues[direction][clueNum];
    if (clue == null) {
        return;
    }
    if (direction === "ac") {
        for (var i = clue.x; i < clue.x + clue.length; i++) {
            var crd = coord(i, clue.y);
            if (!(crd in this.letters) || this.letters[crd] === "") {
                return false;
            }
        }
        return true;
    } else {
        for (var j = clue.y; j < clue.y + clue.length; j++) {
            var crd = coord(clue.x, j);
            if (!(crd in this.letters) || this.letters[crd] === "") {
                return false;
            }
        }
        return true;
    }
}

Grid.prototype.figureOutClues = function() {
    /* Collect clues and write in numbers */
    var clueNumber = 1;
    /* loop from right to left then top to bottom */
    for (var j = 0; j < DN_SQUARES; j++) {
        for (var i = 0; i < AC_SQUARES; i++) {
            var cell = coord(i, j);
            var acrossCount = 0;
            var downCount = 0;
            if (cellInArray(this.whiteSquares, cell)) {
                /* Start of across clue */
                if (i === 0 || !cellInArray(this.whiteSquares, coord(i - 1, j))) {
                    acrossCount = 1;
                    for (var l = i + 1; l < AC_SQUARES; l++) {
                        if (cellInArray(this.whiteSquares, coord(l, j))) {
                            acrossCount += 1;
                        } else {
                            break;
                        }
                    }
                    if (acrossCount > 1) {
                        this.clues.ac[clueNumber] = clueSeq(i, j, acrossCount, 'ac');
                    }
                }
                /* Start of down clue */
                if (j === 0 || !cellInArray(this.whiteSquares, coord(i, j - 1))) {
                    downCount = 1;
                    for (var l = j + 1; l < DN_SQUARES; l++) {
                        if (cellInArray(this.whiteSquares, coord(i, l))) {
                            downCount += 1;
                        } else {
                            break;
                        }
                    }
                    if (downCount > 1) {
                        this.clues.dn[clueNumber] = clueSeq(i, j, downCount, 'dn');
                    }
                }
                if (acrossCount > 1 || downCount > 1) {
                    clueNumber += 1;

                }
            }
        }
    }
};

Grid.prototype.draw = function(ctx) {
    ctx.fillStyle = BLACK;
    ctx.strokeStyle = BLACK;
    ctx.fillRect(0, 0, this.width, this.height);
    /* Draw in the white squares. */
    for (var i = 0; i < AC_SQUARES; i++) {
        for (var j = 0; j < DN_SQUARES; j++) {
            var cell = coord(i, j);
            if (cellInArray(this.whiteSquares, cell)) {
                fillSquare(ctx, this.cellSize, cell, WHITE);
            }
        }
    }
    if (this.highlight) {
        this.highlightClue(ctx, this.highlighted, HIGHLIGHT);
        this.highlightCell(ctx);
    }
    this.drawNumbers(ctx);
    this.drawLetters(ctx);
};

Grid.prototype.removeHighlight = function() {
    this.highlighted = null;
    this.selectedCell = null;
}

Grid.prototype.selectCell = function(cell, toggle) {
    this.selectedCell = cell;
    this.highlightClueFromCell(cell, toggle);
};

Grid.prototype.onClick = function(event, canvas, ctx) {
    var x = Math.floor((event.pageX - canvas.offsetLeft - 2) /
            this.cellSize);
    var y = Math.floor((event.pageY - canvas.offsetTop - 2) /
            this.cellSize);
    var cell = coord(x, y);
    if (cellInArray(this.whiteSquares, cell)) {
        this.selectCell(cell, true);
    }
    this.draw(ctx);
};

Grid.prototype.selectNextCell = function(back) {
    var step = back? -1: 1;
    if (this.highlighted !== null) {
        if (this.highlighted.direction === 'ac') {
            var next = coord(this.selectedCell.x + step, this.selectedCell.y);
            if (cellInArray(this.whiteSquares, next)) {
                this.selectCell(next, false);
            }
        } else {
            var next = coord(this.selectedCell.x, this.selectedCell.y + step);
            if (cellInArray(this.whiteSquares, next)) {
                this.selectCell(next, false);
            }
        }
    }
};

Grid.prototype.onPress = function(ctx, event, char) {
    var lastChar = null;
    if (this.selectedCell !== null) {
        /* virtual keyboard; rely on passed char */
        if (event.keyCode === 229) {
            if (char === 'backspace'){
                lastChar = 'Backspace';
            } else {
                lastChar = char.toUpperCase();
            }
        } else if (isLetter(event.key)) {
            lastChar = event.key.toUpperCase();
        } else {
            lastChar = event.key;
        }

        if (lastChar === 'Backspace') {
            this.letters[this.selectedCell] = '';
            this.selectNextCell(true);
        } else if (lastChar === 'ArrowLeft') {
            event.preventDefault();
            var next = coord(this.selectedCell.x - 1, this.selectedCell.y);
            if (cellInArray(this.whiteSquares, next)) {
                this.selectCell(next, false);
            }
        } else if (lastChar === 'ArrowRight') {
            event.preventDefault();
            var next = coord(this.selectedCell.x + 1, this.selectedCell.y);
            if (cellInArray(this.whiteSquares, next)) {
                this.selectCell(next, false);
            }
        } else if (lastChar === 'ArrowUp') {
            event.preventDefault();
            var next = coord(this.selectedCell.x, this.selectedCell.y - 1);
            if (cellInArray(this.whiteSquares, next)) {
                this.selectCell(next, false);
            }
        } else if (lastChar === 'ArrowDown') {
            event.preventDefault();
            var next = coord(this.selectedCell.x, this.selectedCell.y + 1);
            if (cellInArray(this.whiteSquares, next)) {
                this.selectCell(next, false);
            }
        } else if (lastChar === 'Tab') {
            var matched = false;
            for (var i = 0; i < 2; i++) {
                var direction = DIRECTIONS[i];
                for (var clue in this.clues[direction]) {
                    if (this.clues[direction].hasOwnProperty(clue)) {
                        if (matched) {
                            this.setHighlightedClue(direction, clue);
                            matched = false;
                            break;
                        } else {
                            if (direction === this.highlighted.direction && clue === this.highlighted.number) {
                                matched = true;
                            }
                        }
                    }
                }
            }
        } else if (isLetter(lastChar)) {
            this.letters[this.selectedCell] = lastChar.toUpperCase();
            this.selectNextCell(false);
        }
    }
    /* Let's keep the cookies forever. */
    Cookies.set(COOKIE_KEY, JSON.stringify(this.letters), { expires: new Date(9999, 11, 31) } );
    this.draw(ctx);
};

Grid.prototype.emitSelectedEvent = function() {
    this.emitEvent('clue-selected', { 'detail':
        {
            'direction': this.highlighted.direction,
            'clueNumber': this.highlighted.number
        }
    });
};

/** Highlight the clue containing the specified cell */
Grid.prototype.highlightClueFromCell = function(cell, toggle) {
    var cluesContainingCell = [];
    for (var i = 0; i < 2; i++) {
        var direction = DIRECTIONS[i];
        for (var clueNumber in this.clues[direction]) {
            if (this.clues[direction].hasOwnProperty(clueNumber)) {
                var clue = this.clues[direction][clueNumber];
                if (cellInClue(clue, cell)) {
                    cluesContainingCell.push(clueName(direction, clueNumber));
                }
            }
        }
    }
    if (cluesContainingCell.length === 0) {
        console.log('cell in no clues?');
    } else if (cluesContainingCell.length == 1) {
        this.highlighted = cluesContainingCell[0];
        this.emitSelectedEvent();
    } else {
        /* do we toggle? */
        if (this.highlighted === null) {
            this.highlighted = cluesContainingCell[0];
            this.emitSelectedEvent();
        } else {
            if (toggle) {
                if (this.highlighted.direction === cluesContainingCell[0].direction && this.highlighted.number === cluesContainingCell[0].number) {
                    this.highlighted = cluesContainingCell[1];
                    this.emitSelectedEvent();
                } else {
                    this.highlighted = cluesContainingCell[0];
                    this.emitSelectedEvent();
                }
            }
        }
    }
};

Grid.prototype.setHighlightedClue = function(direction, number) {
    this.highlighted = clueName(direction, number);
    var clue = this.clues[this.highlighted.direction][this.highlighted.number];
    if (clue == null) {
        return;
    }
    this.selectedCell = coord(clue.x, clue.y);
    this.emitSelectedEvent();
};

Grid.prototype.highlightClue = function(ctx, clue, color) {
    if (clue !== null) {
        var clue = this.clues[clue.direction][clue.number];
        if (clue == null) {
            return;
        }
        colorClue(ctx, this.cellSize, color, clue);
    }
};

Grid.prototype.highlightCell = function(ctx) {
    if (this.selectedCell !== null) {
        fillSquare(ctx, this.cellSize, this.selectedCell, CELL_HIGHLIGHT);
    }
};

Grid.prototype.isCorrect = function() {
    console.log(`Hashcode is ${this.lettersToString().hashCode()}`);
    return this.lettersToString().hashCode() === this.correctAnswer;
}

var Crossword = function(
    canvas,
    selectedClueDiv,
    allCluesDiv,
    clueJson,
    hiddenInput,
    checkButton,
    allContent,
    correctAnswer)
{
    this.selectedClueDiv = selectedClueDiv;
    this.allCluesDiv = allCluesDiv;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.clueJson = clueJson;
    this.hiddenInput = hiddenInput;
    this.clueDivs = {'ac': [], 'dn': []};
    this.checkButton = checkButton;
    this.allContent = allContent;
    this.correctAnswer = correctAnswer;
    self = this;
    checkButton.onclick = function() {
        console.log('correct? ' + self.grid.isCorrect());
        if (self.grid.isCorrect()) {
            self.onCorrect();
        } else {
            self.grid.emitEvent('message', {'detail': 'Grid is not correct.'});
        }
        scrollToTop();
    }

    checkButton.addEventListener('xwd-finished', function(event) {
        if (self.grid.isCorrect()) {
            self.allContent.classList.add('completed');
            setTimeout(self.finished, 2000);
        }
    });
    selectedClueDiv.addEventListener('clue-selected', function(event) {
        if (event.detail != null && 'direction' in event.detail) {
            if (clueJson[event.detail.direction].hasOwnProperty(event.detail.clueNumber)) {
                var direction = event.detail.direction === 'ac' ? 'across' : 'down';
                var clueString = self.clueToString(clueJson[event.detail.direction][event.detail.clueNumber]);
                var clueText = `${event.detail.clueNumber} ${direction}: ${clueString}`;
                selectedClueDiv.textContent = clueText;
                selectedClueDiv.classList.add('highlighted');
            } else {
                selectedClueDiv.textContent = 'No clue data';
                selectedClueDiv.classList.remove('highlighted');
            }
        } else {
            selectedClueDiv.textContent = 'No clue selected';
            selectedClueDiv.classList.remove('highlighted');
        }
    });
    selectedClueDiv.addEventListener('message', function(event) {
        selectedClueDiv.textContent = event.detail;
        selectedClueDiv.classList.add('highlighted');
    });
    /* Create header divs for the clue columns. */
    for (var direction of DIRECTION_NAMES) {
        var dirDiv = document.createElement("div");
        dirDiv.setAttribute("class", "clue-container");
        dirDiv.id = direction + "Div";
        this.allCluesDiv.appendChild(dirDiv);
        var titleDiv = document.createElement("div");
        titleDiv.setAttribute("class", "clue-header");
        titleDiv.textContent = direction;
        dirDiv.appendChild(titleDiv);
    }
    this.allCluesDiv.addEventListener('letter-entered', this.loadClues);
}

Crossword.prototype.onCorrect = function() {
    this.grid.removeHighlight();
    this.grid.emitEvent('clue-selected', null);
    this.grid.emitEvent('message', {'detail': 'Congratulations!'});
}

Crossword.prototype.clueToString = function(clue) {
    // Use template literals
    return `${clue[0]}\u00a0(${clue[1]})`;
}

/* Run through all clue divs and make sure none are highlighted. */
Crossword.prototype.clearSelectedDiv = function() {
    for (var direction of DIRECTIONS) {
        for (var i = 0; i < this.clueDivs.length; i++) {
            var div = this.clueDivs[direction][i];
            div.classList.remove('highlighted');
        }
    }
}

Crossword.prototype.createClueDiv = function(clueNum, direction, clue) {
    var self = this;
    var clueDiv = document.createElement("div");
    var numberDiv = document.createElement("div");
    numberDiv.setAttribute("class", "clue-number");
    var clueTextDiv = document.createElement("div");
    clueTextDiv.setAttribute("class", "clue-text");
    clueDiv.id = direction + clueNum;
    clueDiv.setAttribute("class", "clue-wrapper");
    clueDiv.setAttribute("clueNum", clueNum);
    clueDiv.setAttribute("direction", direction);
    clueDiv.addEventListener('clue-selected', function(event) {
        if (event.detail != null &&
            event.detail.direction !== null &&
            event.detail.direction === this.getAttribute("direction") &&
            event.detail.clueNumber === this.getAttribute("clueNum")) {
            this.classList.add('highlighted');
        } else {
            this.classList.remove('highlighted');
        }
        self.grid.draw(self.ctx);
    });
    clueDiv.addEventListener('click', function(event) {
        var targetDiv = event.currentTarget;
        self.grid.setHighlightedClue(
            targetDiv.getAttribute('direction'),
            targetDiv.getAttribute('clueNum')
        );
        self.clearSelectedDiv();
        self.grid.draw(self.ctx);
        self.hiddenInput.focus();
        targetDiv.classList.add('highlighted');
    });
    clueDiv.appendChild(numberDiv);
    clueDiv.appendChild(clueTextDiv);
    return clueDiv;
}

Crossword.prototype.loadClues = function() {
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
            /* Fill in text. */
            var clueNumDiv = clueDiv.querySelector('.clue-number');
            clueNumDiv.textContent = `${clueNum}.`;
            if (this.grid.isClueFilled(clueNum, direction)) {
                clueNumDiv.classList.add('solved');
            } else {
                clueNumDiv.classList.remove('solved');
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
};

Crossword.prototype.setupCanvas = function() {
    var pixelWidth = this.canvas.clientWidth;
    var pixelHeight = this.canvas.clientHeight;

    // Set this.canvas attributes to the correct number of pixels on the device.
    this.canvas.setAttribute('width', pixelWidth * window.devicePixelRatio);
    this.canvas.setAttribute('height', pixelHeight * window.devicePixelRatio);
    // Ensure canvas size is correct according to CSS.
    this.canvas.style.width = pixelWidth;
    this.canvas.style.height = pixelHeight;
    // Draw using the correct number of pixels by scaling the context.
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    this.cellSize = Math.floor(Math.min(pixelWidth / AC_SQUARES, pixelHeight / DN_SQUARES));
    this.gridWidth = this.cellSize * AC_SQUARES + 1;
    this.gridHeight = this.cellSize * DN_SQUARES + 1;
};

Crossword.prototype.createGrid = function() {
    this.grid = new Grid(this.gridWidth, this.gridHeight, this.cellSize, BLACK_SQUARES, this.correctAnswer);
    this.grid.draw(this.ctx);
};

Crossword.prototype.setupGrid = function() {
    var self = this;
    /* Add click listener to react to events */
    this.canvas.addEventListener('click', function(event) {
        self.grid.onClick(event, self.canvas, self.ctx);
        self.hiddenInput.style.position = 'absolute';
        self.hiddenInput.style.left = event.pageX + 'px';
        self.hiddenInput.style.top = event.pageY + 'px';
        self.hiddenInput.focus();
    });

    this.hiddenInput.value = ' ';
    /* Add keypress listener to react to keyboard events.
     * Other possible events to listen for are keypress, keydown
     * and input. */
    this.hiddenInput.addEventListener('keyup', function(event) {
        event.preventDefault();
        var char = '';
        if (self.hiddenInput.value === '') {
            char = 'backspace';
        } else {
            char = self.hiddenInput.value.charAt(1);
        }
        self.grid.onPress(self.ctx, event, char);
        self.hiddenInput.value = ' ';
    });
};



function loadData(dataFile, xwd) {
    loadJson(dataFile, function(response) {
        var dataJson = JSON.parse(response);
        AC_SQUARES = dataJson["across-size"];
        DN_SQUARES = dataJson["down-size"];
        BLACK_SQUARES = dataJson["black-squares"];
        var clueJson = dataJson["clues"];
        xwd.clueJson = clueJson;
        xwd.loadClues();
        xwd.grid.draw(xwd.ctx);
    });
    /* Reload every minute to update without a page refresh. */
    setTimeout(loadData, 5 * 1000, dataFile, xwd);
}

function loadAll(dataFile) {
    loadJson(dataFile, function(response) {
        var dataJson = JSON.parse(response);
        AC_SQUARES = dataJson["across-size"];
        DN_SQUARES = dataJson["down-size"];
        BLACK_SQUARES = dataJson["black-squares"];
        var clueJson = dataJson["clues"];
        var correctAnswer = dataJson["correct-answer"];
        var canvas = document.getElementById('xwd');
        var clueText = document.getElementById('selected-clue-text');
        var hiddenInput = document.getElementById('hidden-input');
        var allClues = document.getElementById('all-clues');
        var checkButton = document.getElementById('check-button');
        var allContent = document.getElementById('crossword-content');
        var xwd = new Crossword(
            canvas,
            clueText,
            allClues,
            clueJson,
            hiddenInput,
            checkButton,
            allContent,
            correctAnswer
        );
        xwd.setupCanvas();
        xwd.createGrid();
        xwd.setupGrid();
        xwd.grid.addListener(clueText);
        xwd.loadClues();
        xwd.grid.draw(xwd.ctx);
        /* Start automatic reload. */
        setTimeout(loadData, 5 * 1000, dataFile, xwd);
    });
}

/* The main entry point. */
xwd.main = function() {
    var canvas = document.getElementById('xwd');
    KEY = canvas.getAttribute('key');
    COOKIE_KEY = `grid-state-${KEY}`;
    var style = getComputedStyle(document.body);
    HIGHLIGHT = style.getPropertyValue('--highlight-color');
    var dataFile = `{{ '/static/xwd${KEY}.json' | url}}`;
    loadAll(dataFile);
}

/* Exports */
xwd.coord = coord;
xwd.fillSquare = fillSquare;
xwd.clueName = clueName;
xwd.loadJson = loadJson;
xwd.Grid = Grid;
xwd.Crossword = Crossword;
global.xwd = xwd;
global.scrollToTop = scrollToTop;

/* Only support browsers. */
}(window));
