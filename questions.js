$(document).ready(function() {
    var MAX_ROWS = 10;
    var MAX_COLS = 5;
    var MAX_TIME = 120;
    var RANDOM_SOLVE = true;

    var problems = [];

    var timeSpent = 0;
    var gameFinished = false;

    var prob = $('#prob1');
    for (var rowIdx=0; rowIdx < MAX_ROWS; rowIdx++) {
        for (var colIdx=0; colIdx < MAX_COLS; colIdx++) {
            var num1 = 2 + Math.floor(Math.random() * 8);
            var num2 = 2 + Math.floor(Math.random() * 8);

            var clone = prob.clone();

            $('.num1', clone).text('' + num1);
            $('.num2', clone).text('' + num2);
            clone.css({
                'position': 'absolute',
                'top': 60*rowIdx + 70,
                'left': 200*colIdx + 50
            });
            $('body').append(clone);
            problems.push({
                'num1': num1,
                'num2': num2,
                'ans': -1,
                'div': clone
            });
        }
    }
    prob.hide();

    function readKey() {
        return new Promise(resolve => {
            window.addEventListener('keyup', resolve, {once: true});
        });
    }

    async function getGuess(div) {
        var ans = 0;
        var tried = false;
        while (1) {
            var k = await readKey();
            var n = k.which;
            if (n == 13) { // enter
                return [ans, tried];
            } else if (n == 8) { // backspace
                ans = Math.floor(ans / 10);
            } else if (n >= 48 && n <= 57) { // digit
                tried = true;
                ans = ans*10 + n - 48; // 48 is ascii for 0
            }
            $('.ans', div).text('' + ans);
        }
    }

    function highlightProblem(div) {
        $(div).css({
            'border': '3px solid black',
            'background': 'rgb(255,0,255)',
        });
    }

    function setAnswer(prob, ans) {
        $('.ans', prob.div).text(' ' + ans);
        prob.ans = ans;
    }

    async function solveOneProblem(prob) {
        highlightProblem(prob.div);

        var [ans, tried] = await getGuess(prob.div);

        if (tried) {
            setAnswer(prob, ans);
        }
        $(prob.div).css({
            'border': 'none',
            'background': 'white'
        });
        return tried;
    }

    function gradeProblems() {
        var numRight = 0;
        var numWrong = 0;
        var numLeft = 0;
        for (var i=0; i < problems.length; i++) {
            var problem = problems[i];

            var color = '';
            if (problem.ans == problem.num1 * problem.num2) {
                color = 'green';
                numRight++;
            } else if (problem.ans == -1) {
                color = 'yellow';
                numLeft++;
            } else {
                color = 'red';
                numWrong++;
            }
            $(problem.div).css({
                'border' : ('3px solid ' + color)
            });
        }

        $('#result').text('' + numRight + ' right, ' + numLeft + ' unsolved, ' + numWrong + ' wrong in ' + timeSpent + ' seconds!').show();
    }

    async function solveProblems() {
        var unsolvedIdxs = [];
        for (var i=0; i < problems.length; i++) {
            unsolvedIdxs.push(i);
        }

        while (unsolvedIdxs.length > 0) {
            var i;

            if (RANDOM_SOLVE) {
                i = Math.floor(Math.random() * unsolvedIdxs.length);
            } else {
                i = 0;
            }
            var idx = unsolvedIdxs[i];

            var tried = await solveOneProblem(problems[idx]);
            if (tried) {
                unsolvedIdxs.splice(i, 1);
            } else {
                if (!RANDOM_SOLVE) {
                    unsolvedIdxs.splice(i, 1);
                    unsolvedIdxs.push(idx);
                }
            }

            if (gameFinished) {
                return;
            }
        }

        gameFinished = true;
    }

    function waitFor(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function updateTimer() {
        var timerDiv = $('#timer');

        for (var i=0; i < MAX_TIME; i++) {
            timeSpent = i;
            $(timerDiv).text('' + MAX_TIME - 1 - timeSpent);
            await waitFor(1000); 

            if (gameFinished) {
                return;
            }
        }

        gameFinished = true;
    }

    async function waitForEnter() {
        while (1) {
            var k = await readKey();
            if (k.which == 13) {
                break;
            }
        }
    }

    async function startGame() {
        $('#result').hide();
        $('#timer').text('' + MAX_TIME);
        await waitForEnter();

        // Even though it says "Promise.all", these two functions ensure
        // that when one finishes, the other one finishes soon after as
        // well. Note that the two functions would need to coordinate with
        // each other using the gameFinished flag even if we were to use
        // Promise.race instead of Promise.all. Promise.race does NOT
        // terminate a started promise: it merely resolves when any of the
        // promises is resolved. However, unfinished promises will continue
        // to "run" till they finish.
        await Promise.all([
            updateTimer(),
            solveProblems()
        ]);
        gradeProblems();
    }

    startGame();

});
