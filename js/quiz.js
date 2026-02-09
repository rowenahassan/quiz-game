export default class Quiz {
  constructor(playerName, category, difficulty, numberOfQuestions) {
    this.playerName = playerName;
    this.category = category; 
    this.difficulty = difficulty;
    this.numberOfQuestions = numberOfQuestions;

    this.score = 0;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }

  buildApiUrl() {
    const params = new URLSearchParams({
      amount: this.numberOfQuestions,
    });
    if (this.category) params.append("category", this.category);
    if (this.difficulty) params.append("difficulty", this.difficulty);

    return `https://opentdb.com/api.php?${params.toString()}`;
  }

  async getQuestions() {
    const url = this.buildApiUrl();
    const response = await fetch(url);

    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();

    if (data.response_code !== 0) throw new Error("No questions available");

    this.questions = data.results;
    return this.questions;
  }

  incrementScore() {
    this.score += 1;
  }

  getCurrentQuestion() {
    return this.questions[this.currentQuestionIndex] || null;
  }

  nextQuestion() {
    this.currentQuestionIndex += 1;
    return !this.isComplete();
  }

  isComplete() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  getScorePercentage() {
    return Math.round((this.score / this.numberOfQuestions) * 100);
  }

  getHighScores() {
    try {
      const scores = JSON.parse(localStorage.getItem("quizHighScores"));
      return Array.isArray(scores) ? scores : [];
    } catch {
      return [];
    }
  }

  saveHighScore() {
    const percentage = this.getScorePercentage();
    const scores = this.getHighScores();
    const newScore = {
      name: this.playerName,
      score: this.score,
      total: this.numberOfQuestions,
      percentage,
      difficulty: this.difficulty,
      date: new Date().toISOString(),
    };

    scores.push(newScore);
    scores.sort((a, b) => b.percentage - a.percentage);
    localStorage.setItem("quizHighScores", JSON.stringify(scores.slice(0, 10)));
  }

  isHighScore() {
    const scores = this.getHighScores();
    if (scores.length < 10) return true;
    return this.getScorePercentage() > scores[scores.length - 1].percentage;
  }

  endQuiz() {
    const percentage = this.getScorePercentage();
    if (this.isHighScore()) this.saveHighScore();

    const highScores = this.getHighScores();

    let leaderboardHTML = "";
    highScores.forEach((s, i) => {
      const medal =
        i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
      leaderboardHTML += `
        <li class="leaderboard-item ${medal}">
          <span class="leaderboard-rank">#${i + 1}</span>
          <span class="leaderboard-name">${s.name}</span>
          <span class="leaderboard-score">${s.percentage}%</span>
        </li>
      `;
    });

    return `
      <div class="game-card results-card">
        <h2 class="results-title">Quiz Complete!</h2>
        <p class="results-score-display">${this.score}/${
      this.numberOfQuestions
    }</p>
        <p class="results-percentage">${percentage}% Accuracy</p>
        ${
          this.isHighScore()
            ? `<div class="new-record-badge"><i class="fa-solid fa-star"></i> New High Score!</div>`
            : ""
        }
        <div class="leaderboard">
          <h4 class="leaderboard-title"><i class="fa-solid fa-trophy"></i> Leaderboard</h4>
          <ul class="leaderboard-list">${leaderboardHTML}</ul>
        </div>
        <div class="action-buttons">
          <button class="btn-restart"><i class="fa-solid fa-rotate-right"></i> Play Again</button>
        </div>
      </div>
    `;
  }
}
