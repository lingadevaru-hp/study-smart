// StudySmart - Client-side JavaScript

// Global variables
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let quizScore = 0;

// Show loading overlay
function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

// Show success toast
function showSuccess(message) {
    const toast = document.getElementById('success-toast');
    const messageElement = document.getElementById('success-message');
    messageElement.textContent = message;
    toast.style.display = 'flex';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Show error toast
function showError(message) {
    const toast = document.getElementById('error-toast');
    const messageElement = document.getElementById('error-message');
    messageElement.textContent = message;
    toast.style.display = 'flex';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 5000);
}

// Show specific section
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[href="#${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Study Help Functions
async function askQuestion() {
    const questionText = document.getElementById('study-question').value.trim();
    const subject = document.getElementById('subject-select').value;
    const difficulty = document.getElementById('difficulty-select').value;
    
    if (!questionText) {
        showError('Please enter a question');
        return;
    }
    
    const askBtn = document.getElementById('ask-btn');
    const originalText = askBtn.innerHTML;
    
    try {
        showLoading();
        askBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Thinking...';
        askBtn.disabled = true;
        
        const response = await fetch('/api/study-help', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: questionText,
                subject: subject,
                difficulty: difficulty
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayStudyResponse(data.response);
            showSuccess('Study help generated successfully!');
        } else {
            showError(data.error || 'Failed to get study help');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError('Network error. Please check your connection and try again.');
    } finally {
        hideLoading();
        askBtn.innerHTML = originalText;
        askBtn.disabled = false;
    }
}

function displayStudyResponse(response) {
    const responseContainer = document.getElementById('study-response');
    const answerElement = document.getElementById('study-answer');
    
    // Convert markdown-like formatting to HTML
    const formattedResponse = response
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/```(.*?)```/gs, '<code>$1</code>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n- /g, '<br>• ')
        .replace(/^\d+\. /gm, '<br>$&');
    
    answerElement.innerHTML = `<p>${formattedResponse}</p>`;
    responseContainer.style.display = 'block';
    responseContainer.scrollIntoView({ behavior: 'smooth' });
}

// Quiz Functions
async function generateQuiz() {
    const topic = document.getElementById('quiz-topic').value.trim();
    const numQuestions = parseInt(document.getElementById('quiz-questions').value);
    const difficulty = document.getElementById('quiz-difficulty').value;
    
    if (!topic) {
        showError('Please enter a quiz topic');
        return;
    }
    
    const generateBtn = document.getElementById('generate-quiz-btn');
    const originalText = generateBtn.innerHTML;
    
    try {
        showLoading();
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Quiz...';
        generateBtn.disabled = true;
        
        const response = await fetch('/api/generate-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic: topic,
                numQuestions: numQuestions,
                difficulty: difficulty
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentQuiz = data.quiz;
            currentQuestionIndex = 0;
            userAnswers = [];
            quizScore = 0;
            displayQuiz();
            showSuccess('Quiz generated successfully!');
        } else {
            showError(data.error || 'Failed to generate quiz');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError('Network error. Please check your connection and try again.');
    } finally {
        hideLoading();
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
    }
}

function displayQuiz() {
    if (!currentQuiz || !currentQuiz.questions) {
        showError('Quiz data is invalid');
        return;
    }
    
    const quizContainer = document.getElementById('quiz-container');
    const quizTitle = document.getElementById('quiz-title');
    const questionCounter = document.getElementById('question-counter');
    const quizContent = document.getElementById('quiz-content');
    
    quizTitle.textContent = currentQuiz.title || 'Quiz';
    questionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuiz.questions.length}`;
    
    displayCurrentQuestion();
    updateProgressBar();
    updateQuizButtons();
    
    quizContainer.style.display = 'block';
    quizContainer.scrollIntoView({ behavior: 'smooth' });
}

function displayCurrentQuestion() {
    if (!currentQuiz || !currentQuiz.questions) return;
    
    const question = currentQuiz.questions[currentQuestionIndex];
    const quizContent = document.getElementById('quiz-content');
    
    let optionsHtml = '';
    question.options.forEach((option, index) => {
        optionsHtml += `
            <button class="option" onclick="selectAnswer(${index})">
                ${String.fromCharCode(65 + index)}. ${option}
            </button>
        `;
    });
    
    quizContent.innerHTML = `
        <div class="question-container">
            <div class="question-text">${question.question}</div>
            ${optionsHtml}
        </div>
    `;
}

function selectAnswer(answerIndex) {
    const options = document.querySelectorAll('.option');
    options.forEach(option => option.classList.remove('selected'));
    options[answerIndex].classList.add('selected');
    
    userAnswers[currentQuestionIndex] = answerIndex;
}

function nextQuestion() {
    if (userAnswers[currentQuestionIndex] === undefined) {
        showError('Please select an answer before continuing');
        return;
    }
    
    currentQuestionIndex++;
    
    if (currentQuestionIndex < currentQuiz.questions.length) {
        displayCurrentQuestion();
        updateProgressBar();
        updateQuizButtons();
        document.getElementById('question-counter').textContent = 
            `Question ${currentQuestionIndex + 1} of ${currentQuiz.questions.length}`;
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayCurrentQuestion();
        updateProgressBar();
        updateQuizButtons();
        document.getElementById('question-counter').textContent = 
            `Question ${currentQuestionIndex + 1} of ${currentQuiz.questions.length}`;
    }
}

function updateProgressBar() {
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
}

function updateQuizButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const finishBtn = document.getElementById('finish-btn');
    
    prevBtn.style.display = currentQuestionIndex > 0 ? 'block' : 'none';
    
    if (currentQuestionIndex === currentQuiz.questions.length - 1) {
        nextBtn.style.display = 'none';
        finishBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        finishBtn.style.display = 'none';
    }
}

function finishQuiz() {
    if (userAnswers[currentQuestionIndex] === undefined) {
        showError('Please select an answer before finishing');
        return;
    }
    
    calculateScore();
    displayQuizResults();
}

function calculateScore() {
    quizScore = 0;
    currentQuiz.questions.forEach((question, index) => {
        if (userAnswers[index] === question.correct) {
            quizScore++;
        }
    });
}

function displayQuizResults() {
    const resultsContainer = document.getElementById('quiz-results');
    const quizContainer = document.getElementById('quiz-container');
    
    const percentage = Math.round((quizScore / currentQuiz.questions.length) * 100);
    
    let resultMessage = '';
    if (percentage >= 80) {
        resultMessage = 'Excellent work! 🎉';
    } else if (percentage >= 60) {
        resultMessage = 'Good job! 👍';
    } else {
        resultMessage = 'Keep studying! 📚';
    }
    
    resultsContainer.innerHTML = `
        <h2><i class="fas fa-trophy"></i> Quiz Results</h2>
        <div class="score-display">${quizScore}/${currentQuiz.questions.length}</div>
        <div class="score-text">${percentage}% - ${resultMessage}</div>
        <button class="btn btn-primary" onclick="resetQuiz()">
            <i class="fas fa-redo"></i> Take Another Quiz
        </button>
    `;
    
    quizContainer.style.display = 'none';
    resultsContainer.style.display = 'block';
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

function resetQuiz() {
    document.getElementById('quiz-results').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('quiz-topic').value = '';
    currentQuiz = null;
    currentQuestionIndex = 0;
    userAnswers = [];
    quizScore = 0;
}

// Study Plan Functions
async function createStudyPlan() {
    const subject = document.getElementById('plan-subject').value.trim();
    const timeframe = document.getElementById('plan-timeframe').value;
    const currentLevel = document.getElementById('plan-level').value;
    const goals = document.getElementById('plan-goals').value.trim();
    
    if (!subject) {
        showError('Please enter a subject');
        return;
    }
    
    const createBtn = document.getElementById('create-plan-btn');
    const originalText = createBtn.innerHTML;
    
    try {
        showLoading();
        createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Plan...';
        createBtn.disabled = true;
        
        const response = await fetch('/api/create-study-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subject: subject,
                timeframe: timeframe,
                currentLevel: currentLevel,
                goals: goals
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayStudyPlan(data.studyPlan);
            showSuccess('Study plan created successfully!');
        } else {
            showError(data.error || 'Failed to create study plan');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError('Network error. Please check your connection and try again.');
    } finally {
        hideLoading();
        createBtn.innerHTML = originalText;
        createBtn.disabled = false;
    }
}

function displayStudyPlan(studyPlan) {
    const responseContainer = document.getElementById('study-plan-response');
    const contentElement = document.getElementById('study-plan-content');
    
    // Convert markdown-like formatting to HTML
    const formattedPlan = studyPlan
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^## (.*$)/gm, '<h3>$1</h3>')
        .replace(/^# (.*$)/gm, '<h2>$1</h2>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n- /g, '<br>• ')
        .replace(/^\d+\. /gm, '<br>$&');
    
    contentElement.innerHTML = `<p>${formattedPlan}</p>`;
    responseContainer.style.display = 'block';
    responseContainer.scrollIntoView({ behavior: 'smooth' });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Show the first section by default
    showSection('study-help');
    
    // Add Enter key support for inputs
    document.getElementById('study-question').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            askQuestion();
        }
    });
    
    document.getElementById('quiz-topic').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateQuiz();
        }
    });
    
    document.getElementById('plan-subject').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            createStudyPlan();
        }
    });
    
    console.log('StudySmart initialized successfully! 🚀');
});