// StudySmart - AI Study Assistant Server
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Gemini AI
let genAI;
try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in environment variables');
        console.log('Please create a .env file with your Gemini API key');
        process.exit(1);
    }
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ Gemini AI initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error.message);
    process.exit(1);
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint for study assistance
app.post('/api/study-help', async (req, res) => {
    try {
        const { question, subject, difficulty } = req.body;

        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
As a helpful study assistant, please help the student with this ${subject || 'general'} question at ${difficulty || 'medium'} difficulty level:

"${question}"

Please provide:
1. A clear, educational explanation
2. Key concepts involved
3. Examples if applicable
4. Study tips related to this topic

Keep the response focused, educational, and encouraging.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({
            success: true,
            response: text,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Study help error:', error);
        
        let errorMessage = 'Unable to generate study help at the moment.';
        if (error.message.includes('API_KEY_INVALID')) {
            errorMessage = 'Invalid API key. Please check your Gemini API key.';
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
            errorMessage = 'API quota exceeded. Please try again later.';
        }

        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});

// API endpoint for generating quiz
app.post('/api/generate-quiz', async (req, res) => {
    try {
        const { topic, numQuestions, difficulty } = req.body;

        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
Generate a ${difficulty || 'medium'} difficulty quiz about "${topic}" with ${numQuestions || 5} multiple choice questions.

Format the response as a JSON object with this structure:
{
  "title": "Quiz: [Topic Name]",
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation": "Brief explanation of the correct answer"
    }
  ]
}

Make sure the questions are educational and test understanding, not just memorization.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Try to parse the JSON response
        let quizData;
        try {
            // Extract JSON from the response if it's wrapped in markdown
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/) || [null, text];
            quizData = JSON.parse(jsonMatch[1] || text);
        } catch (parseError) {
            // If JSON parsing fails, create a simple structure
            quizData = {
                title: `Quiz: ${topic}`,
                questions: [{
                    question: "This quiz couldn't be generated properly. Please try again.",
                    options: ["Retry", "Check API key", "Try different topic", "Contact support"],
                    correct: 0,
                    explanation: "There was an issue generating the quiz content."
                }]
            };
        }

        res.json({
            success: true,
            quiz: quizData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Quiz generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Unable to generate quiz at the moment.'
        });
    }
});

// API endpoint for study plan creation
app.post('/api/create-study-plan', async (req, res) => {
    try {
        const { subject, timeframe, goals, currentLevel } = req.body;

        if (!subject || !timeframe) {
            return res.status(400).json({ error: 'Subject and timeframe are required' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
Create a personalized study plan for:
- Subject: ${subject}
- Timeframe: ${timeframe}
- Current Level: ${currentLevel || 'beginner'}
- Goals: ${goals || 'general understanding'}

Please provide:
1. Overall learning objectives
2. Weekly breakdown of topics
3. Daily study recommendations
4. Suggested resources and activities
5. Milestones and assessment points

Format the response clearly with headings and bullet points for easy reading.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({
            success: true,
            studyPlan: text,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Study plan error:', error);
        res.status(500).json({
            success: false,
            error: 'Unable to create study plan at the moment.'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 StudySmart server running on http://localhost:${PORT}`);
    console.log(`📚 Ready to help students learn with AI!`);
});