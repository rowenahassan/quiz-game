import Quiz from "./quiz.js";
import Question from "./question.js";
const quizOptionsForm = document.getElementById("quizOptions");
const playerNameInput = document.getElementById("playerName");
const categoryInput = document.getElementById("categoryMenu");
const difficultyOptions = document.getElementById("difficultyOptions");
const questionsNumber = document.getElementById("questionsNumber");
const startQuizBtn = document.getElementById("startQuiz");
const questionsContainer = document.getElementById("questionsContainer");
function showLoading() {
  questionsContainer.innerHTML = `
    <div class="loading-overlay"> <div class="loading-spinner"></div> <p class="loading-text">Loading Questions...</p> </div>
    `;
}
function hideLoading() {
  const overlay = questionsContainer.querySelector(".loading-overlay");
  if (overlay) overlay.remove();
}
function showError(message) {
  questionsContainer.innerHTML = `
    <div class="game-card error-card"> <div class="error-icon"> <i class="fa-solid fa-triangle-exclamation"></i> </div> <h3 class="error-title">Oops! Something went wrong</h3> <p class="error-message">${message}</p> <button class="btn-play retry-btn"> <i class="fa-solid fa-rotate-right"></i> Try Again </button> </div>
    `;
  const retryBtn = questionsContainer.querySelector(".retry-btn");
  retryBtn.addEventListener("click", resetToStart);
}
function validateForm() {
  const numQuestions = parseInt(questionsNumber.value);
  if (!numQuestions || numQuestions < 1) {
    return { isValid: false, error: "Enter at least 1 question" };
  }
  if (numQuestions > 50) {
    return { isValid: false, error: "Maximum 50 questions allowed" };
  }
  return { isValid: true, error: null };
}
function showFormError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "form-error";
  errorDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
  startQuizBtn.before(errorDiv);
  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}
function resetToStart() {
  questionsContainer.innerHTML = "";
  quizOptionsForm.reset();
  quizOptionsForm.classList.remove("hidden");
  currentQuiz = null;
}
let currentQuiz = null;
async function startQuiz() {
  const validation = validateForm();
  if (!validation.isValid) {
    showFormError(validation.error);
    return;
  }
  const playerName = playerNameInput.value.trim() || "Player";
  const category = categoryInput.value;
  const difficulty = difficultyOptions.value;
  const numberOfQuestions = parseInt(questionsNumber.value);
  currentQuiz = new Quiz(playerName, category, difficulty, numberOfQuestions);
  quizOptionsForm.classList.add("hidden");
  showLoading();
  try {
    await currentQuiz.getQuestions();
    hideLoading();
    if (!currentQuiz.questions.length) {
      showError("No questions found. Try different options.");
      return;
    }
    new Question(
      currentQuiz,
      questionsContainer,
      resetToStart
    ).displayQuestion();
  } catch (error) {
    hideLoading();
    showError("Failed to load questions. Try again.");
    console.error(error);
  }
}
startQuizBtn.addEventListener("click", startQuiz);
questionsNumber.addEventListener("keydown", (e) => {
  if (e.key === "Enter") startQuiz();
});
