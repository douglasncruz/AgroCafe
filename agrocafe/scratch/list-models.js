const fetch = require('node-fetch'); // or use native fetch in node 24
async function listModels() {
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCRTjRpFJH2DywMEBQ6fAIYp5NM2OdfZNA');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
listModels();
