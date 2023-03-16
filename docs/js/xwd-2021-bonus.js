/* IIFE */
(function adventBonusModule(global) {

const PART2 = '/xwd2021pt2.html';
const COMPLETE_COOKIE_KEY = "2021-complete";

var checkComplete = function() {

    const complete = Cookies.get(COMPLETE_COOKIE_KEY) === "true"
    if (complete) {
        const preambleDiv = document.getElementById("preamble");
        preambleDiv.innerHTML = "";
        const continueButton = document.createElement('a');
        continueButton.textContent = "Continue to part 2"
        continueButton.classList.add("xwd-button");
        continueButton.href = PART2;
        preambleDiv.appendChild(continueButton)
    }
}

/* Override with custom behaviour for ths year. */
adventXwd.AdventCrossword.prototype.finished = function() {
    const parent = self.allContent.parentElement;
    self.finalDiv = document.createElement('div');
    self.finalDiv.id = 'final-div';
    self.finalDiv.style['min-height'] = self.allContent.clientHeight + 'px';
    parent.appendChild(self.finalDiv);
    parent.removeChild(self.allContent);
    const backButton = document.createElement('a');
    backButton.id = 'final-back';
    backButton.textContent = 'Back';
    backButton.classList.add('xwd-button');
    backButton.onclick = function() {
        parent.removeChild(self.finalDiv);
        self.allContent.classList.remove('completed');
        self.grid.unfinish(self.ctx);
        parent.appendChild(self.allContent);
    }

    if (window.location.href.endsWith(PART2)) {
        const finalMessagePt1 = document.createElement('p');
        finalMessagePt1.id = "final-msg-1";
        finalMessagePt1.textContent = 'Welcome to 2022!';
        const finalMessagePt2 = document.createElement('p');
        finalMessagePt2.id = "final-msg-2";
        finalMessagePt2.textContent = 'Congratulations on your perseverance.';
        const finalMessagePt3 = document.createElement('p');
        finalMessagePt3.id = "final-msg-3";
        finalMessagePt3.textContent = 'You now have 11 months off.';

        self.finalDiv.appendChild(finalMessagePt1);
        self.finalDiv.appendChild(finalMessagePt2);
        self.finalDiv.appendChild(finalMessagePt3);

    } else {
        const prompt = document.createElement('p');

        prompt.textContent = 'The grid is correct. Please enter the hidden message:';
        prompt.classList.add('final-msg');
        const response = document.createElement('p');
        response.classList.add('final-msg');
        const input = document.createElement('input');
        const checkDiv = document.createElement('div');
        const checkButton = document.createElement('a');
        checkButton.classList.add('xwd-button');
        checkButton.textContent = 'Check'
        checkButton.onclick = function() {
            const stripped = input.value.toLowerCase().replace(/[^a-z0-9]/g, '')
            if ((stripped === 'goodbyetotwentytwentyone') ||
                (stripped === 'goodbyeto2021')) {
                Cookies.set("2021-complete", "true", { expires: new Date(9999, 11, 31) });
                self.finalDiv.classList.add("completed")
                setTimeout(() =>{
                    window.location.href = PART2;
                }, 1500);
            } else {
                response.textContent = 'nope';
            }
        }
        const cookies = JSON.parse(Cookies.get(COOKIE_KEY));
        /* Specifically delete the cells that don't match the new grid. */
        const toDelete = ["1,0", "3,0", "5,0", "7,0", "9,0", "11,0",
                        "0,1", "1,1", "2,1", "3,1", "4,1", "5,1", "7,1", "8,1", "9,1", "10,1", "11,1", "12,1",
                        "1,2", "3,2", "5,2", "7,2", "9,2", "11,2",
                        "0,3", "1,3", "2,3", "4,3", "5,3", "6,3", "7,3", "8,3", "9,3", "10,3", "11,3", "12,3",
                        "1,4", "3,4", "5,4", "7,4", "9,4", "11,4",
                        "0,5", "1,5", "2,5", "4,5", "5,5", "6,5",
                        "5,6", "9,6"

                    ];
        for (const d of toDelete) {
            delete cookies[d];
        }
        Cookies.set('grid-state-2021pt2', JSON.stringify(cookies), { expires: new Date(9999, 11, 31) });

        self.finalDiv.appendChild(prompt);
        checkDiv.appendChild(input);
        checkDiv.appendChild(checkButton);
        self.finalDiv.appendChild(checkDiv);
        self.finalDiv.appendChild(response);
    }
    self.finalDiv.appendChild(backButton);
    scrollToTop();
}

adventXwd.checkComplete = checkComplete;

}(window));
