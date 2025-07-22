// Simple test to verify StudySmart is working
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testStudySmart() {
    console.log('🧪 Testing StudySmart Application...\n');

    // Test 1: Environment Variables
    console.log('1. Testing environment variables...');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log('❌ GEMINI_API_KEY not found');
        return false;
    }
    console.log('✅ API key found');

    // Test 2: API Key Format
    console.log('\n2. Testing API key format...');
    if (!apiKey.startsWith('AIzaSy')) {
        console.log('❌ Invalid API key format');
        return false;
    }
    console.log('✅ API key format is correct');

    // Test 3: Gemini API Connection
    console.log('\n3. Testing Gemini API connection...');
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const result = await model.generateContent('Say "StudySmart test successful!" if you can read this.');
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ Gemini API connection successful');
        console.log('📝 AI Response:', text);
    } catch (error) {
        console.log('❌ Gemini API connection failed:', error.message);
        return false;
    }

    // Test 4: Server Dependencies
    console.log('\n4. Testing server dependencies...');
    try {
        require('express');
        require('cors');
        require('path');
        console.log('✅ All server dependencies available');
    } catch (error) {
        console.log('❌ Missing server dependencies:', error.message);
        return false;
    }

    console.log('\n🎉 All tests passed! StudySmart is ready to use.');
    console.log('\n🚀 To start the application:');
    console.log('   npm start');
    console.log('\n📱 Then visit: http://localhost:3000');
    
    return true;
}

// Run tests
testStudySmart().catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
});