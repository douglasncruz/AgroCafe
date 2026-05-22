const { GoogleGenerativeAI } = require('@google/generative-ai');

async function checkModels() {
  const genAI = new GoogleGenerativeAI('AIzaSyCRTjRpFJH2DywMEBQ6fAIYp5NM2OdfZNA');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent('Hi');
    console.log('gemini-1.5-flash-latest works! Response:', result.response.text());
  } catch (e) {
    console.error('gemini-1.5-flash-latest error:', e.message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Hi');
    console.log('gemini-pro works! Response:', result.response.text());
  } catch (e) {
    console.error('gemini-pro error:', e.message);
  }
}

checkModels();
