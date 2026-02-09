const correctSound = new Audio("Sounds/correct.mp3");
const incorrectSound = new Audio("Sounds/incorrect.mp3");
const tickSound = new Audio("Sounds/tick.mp3");
const timeoutSound = new Audio("Sounds/timeout.mp3");
const finishSound = new Audio("Sounds/finish.mp3");

function play(sound) {
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

export default class Question {
  constructor(quiz, container, onQuizEnd) {
    this.quiz = quiz;
    this.container = container;
    this.onQuizEnd = onQuizEnd;

    this.questionData = quiz.getCurrentQuestion();
    this.index = quiz.currentQuestionIndex;

    this.question = this.decodeHtml(this.questionData.question);
    this.correctAnswer = this.decodeHtml(this.questionData.correct_answer);
    this.category = this.decodeHtml(this.questionData.category);

    this.wrongAnswers = this.questionData.incorrect_answers.map((a) =>
      this.decodeHtml(a)
    );

    this.allAnswers = this.shuffleAnswers();
    this.answered = false;
    this.timerInterval = null;
    this.timeRemaining = 15;

    this.displayQuestion();
  }

  decodeHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.documentElement.textContent;
  }

  shuffleAnswers() {
    const answers = [...this.wrongAnswers, this.correctAnswer];

    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]];
    }

    return answers;
  }

  getProgress() {
    return Math.round(((this.index + 1) / this.quiz.numberOfQuestions) * 100);
  }

  displayQuestion() {
    const answersHTML = this.allAnswers
      .map(
        (answer, i) => `
      <button class="answer-btn" data-answer="${answer}">
        <span class="answer-key">${i + 1}</span>
        <span class="answer-text">${answer}</span>
      </button>
    `
      )
      .join("");

    this.container.innerHTML = `
    <div class="game-card question-card">

      <div class="xp-bar-container">
        <div class="xp-bar-header">
          <span class="xp-label">
            <i class="fa-solid fa-bolt"></i> Progress
          </span>
          <span class="xp-value">
            Question ${this.index + 1}/${this.quiz.numberOfQuestions}
          </span>
        </div>
        <div class="xp-bar">
          <div class="xp-bar-fill" style="width: ${this.getProgress()}%"></div>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-badge category">
          <i class="fa-solid fa-bookmark"></i>
          <span>${this.category}</span>
        </div>

        <div class="stat-badge difficulty ${this.quiz.difficulty}">
          <i class="fa-solid fa-face-smile"></i>
          <span>${this.quiz.difficulty || "any"}</span>
        </div>

        <div class="stat-badge timer">
          <i class="fa-solid fa-stopwatch"></i>
          <span class="timer-value">${this.timeRemaining}</span>s
        </div>

        <div class="stat-badge counter">
          <i class="fa-solid fa-gamepad"></i>
          <span>${this.index + 1}/${this.quiz.numberOfQuestions}</span>
        </div>
      </div>

      <h2 class="question-text">${this.question}</h2>

      <div class="answers-grid">
        ${answersHTML}
      </div>

      <p class="keyboard-hint">
        <i class="fa-regular fa-keyboard"></i> Press 1-4 to select
      </p>

      <div class="score-panel">
        <div class="score-item">
          <div class="score-item-label">Score</div>
          <div class="score-item-value">${this.quiz.score}</div>
        </div>
      </div>

    </div>
  `;

    this.addEventListeners();
    this.startTimer();
  }

  addEventListeners() {
    this.answerButtons = document.querySelectorAll(".answer-btn");

    this.answerButtons.forEach((btn) => {
      btn.addEventListener("click", () => this.checkAnswer(btn));
    });

    this.keyHandler = (e) => {
      const keys = ["1", "2", "3", "4"];
      if (keys.includes(e.key)) {
        const index = Number(e.key) - 1;
        if (this.answerButtons[index]) {
          this.checkAnswer(this.answerButtons[index]);
        }
      }
    };

    document.addEventListener("keydown", this.keyHandler);
  }

  removeEventListeners() {
    document.removeEventListener("keydown", this.keyHandler);
  }

  startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const timerBadge = document.querySelector(".stat-badge.timer");
    const timeEl = timerBadge.querySelector(".timer-value");

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      timeEl.textContent = this.timeRemaining;

      if (this.timeRemaining <= 10) {
        timerBadge.classList.add("warning");
        if (this.timeRemaining > 0) {
          play(tickSound);
        }
      }

      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.handleTimeUp();
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;

    tickSound.pause();
    tickSound.currentTime = 0;
  }

  handleTimeUp() {
    if (this.answered) return;

    play(timeoutSound);
    this.answered = true;
    this.removeEventListeners();
    this.highlightCorrectAnswer();

    const card = document.querySelector(".question-card");
    card.insertAdjacentHTML(
      "beforeend",
      `
  <div class="time-up-message">
    <i class="fa-solid fa-clock"></i> TIME'S UP!
  </div>
`
    );

    this.animateQuestion(500);
  }

  checkAnswer(choiceElement) {
    if (this.answered) return;

    this.answered = true;
    this.stopTimer();
    this.removeEventListeners();

    const selected = choiceElement.dataset.answer.toLowerCase();
    const correct = this.correctAnswer.toLowerCase();

    if (selected === correct) {
      choiceElement.classList.add("correct");
      this.quiz.incrementScore();
      play(correctSound);
    } else {
      choiceElement.classList.add("wrong");
      this.highlightCorrectAnswer();
      play(incorrectSound);
    }

    this.answerButtons.forEach((btn) => btn.classList.add("disabled"));

    this.animateQuestion(500);
  }

  highlightCorrectAnswer() {
    this.answerButtons.forEach((btn) => {
      if (btn.dataset.answer === this.correctAnswer) {
        btn.classList.add("correct-reveal");
      }
    });
  }

  getNextQuestion() {
    const hasNext = this.quiz.nextQuestion();

    if (hasNext) {
      new Question(this.quiz, this.container, this.onQuizEnd);
    } else {
      this.showResults();
    }
  }
  showResults() {
    play(finishSound);
    const resultsHTML = this.quiz.endQuiz();

    this.container.innerHTML = resultsHTML;

    const restartBtn = this.container.querySelector(".btn-restart");
    restartBtn.addEventListener("click", () => {
      this.onQuizEnd();
    });
  }

  animateQuestion(duration = 500) {
    const card = document.querySelector(".question-card");

    setTimeout(() => {
      card.classList.add("exit");
    }, 1500);

    setTimeout(() => {
      this.getNextQuestion();
    }, 1500 + duration);
  }

}
