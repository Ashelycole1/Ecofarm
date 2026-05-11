import { GoogleGenerativeAI } from '@google/generative-ai'

async function test() {
  try {
    const genAI = new GoogleGenerativeAI("AIzaSyD3FVkuH2TgU30V43kQ3mirLp5YO_ky518")
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })
    const result = await model.generateContent("hello");
    console.log("Response with gemini-1.5-flash-latest:", result.response.text())
  } catch (e) {
    console.error("Error:", e)
  }
}
test()

