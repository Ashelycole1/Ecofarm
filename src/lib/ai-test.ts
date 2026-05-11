import { GoogleGenerativeAI } from "@google/generative-ai";

export async function diagnosticTestGemini() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("DIAGNOSTIC: No Gemini API Key found in env.");
    return;
  }

  console.log("DIAGNOSTIC: Testing key starting with:", apiKey.substring(0, 10));
  
  try {
    // We try to fetch the model list if supported by the SDK, 
    // otherwise we try a hardcoded list and report results
    const genAI = new GoogleGenerativeAI(apiKey);
    const testModels = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro"
    ];

    console.log("DIAGNOSTIC: Running connectivity test...");
    
    for (const m of testModels) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent("echo 'ready'");
        console.log(`DIAGNOSTIC: ✅ Model '${m}' is ACTIVE and WORKING.`);
      } catch (e: any) {
        console.warn(`DIAGNOSTIC: ❌ Model '${m}' failed:`, e.message);
      }
    }
  } catch (err: any) {
    console.error("DIAGNOSTIC: Critical failure:", err.message);
  }
}
