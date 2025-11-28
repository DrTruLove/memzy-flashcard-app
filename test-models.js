const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "AIzaSyADEjA3o-GRatwCr2MnGjOauABsx8wFvUQ";
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel() {
  const modelNames = [
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-pro",
    "gemini-1.5-pro",
    "models/gemini-1.5-flash"
  ];

  for (const modelName of modelNames) {
    try {
      console.log(`\nTrying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello");
      const response = await result.response;
      const text = response.text();
      console.log(`✅ SUCCESS! Model ${modelName} works!`);
      console.log(`Response: ${text.substring(0, 50)}...`);
      break;
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
      if (error.status) console.log(`   Status: ${error.status}`);
    }
  }
}

testModel();
