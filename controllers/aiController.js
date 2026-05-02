const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.classifyWaste = async (req, res) => {
  try {
    // Expected to receive base64 image or a Cloudinary URL
    const { imageBase64, mediaType } = req.body; 

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validMediaType = allowedTypes.includes(mediaType) ? mediaType : 'image/jpeg';

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an AI waste sorting expert for the EcoTrack app. Analyze the provided image of waste. Return ONLY a JSON object with the following structure: {"category": "Plastic/Organic/E-Waste/etc", "isRecyclable": boolean, "ecoPoints": number (10 to 50 based on impact), "feedback": "A short 1 sentence encouraging or instructional message"}`;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: validMediaType
      }
    };

    const apiResult = await model.generateContent([prompt, imagePart]);
    const response = await apiResult.response;
    const textResponse = response.text();
    
    let resultData;
    try {
      const jsonMatch = textResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        resultData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        resultData = JSON.parse(textResponse);
      }
    } catch (e) {
      console.error('JSON Parse Error:', textResponse);
      return res.status(500).json({ success: false, message: 'Failed to parse AI response' });
    }

    // Award points to user if they are authenticated
    if (req.user) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.points = (user.points || 0) + resultData.ecoPoints;
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      data: resultData
    });
  } catch (error) {
    const fs = require('fs');
    let errorDetails = error.message;
    if (error.response && error.response.data) {
        errorDetails += ' | ' + JSON.stringify(error.response.data);
    }
    fs.appendFileSync('ai_error.log', new Date().toISOString() + ' ERROR: ' + errorDetails + '\n');
    console.error('AI Classification Error:', errorDetails);
    
    // Fallback Mock Response for demo purposes if API is out of credits
    console.log("Using fallback mock response due to AI API failure.");
    const mockResultData = {
      category: "Plastic Material",
      isRecyclable: true,
      ecoPoints: 25,
      feedback: "Great job! (Offline AI Mode Active)"
    };

    if (req.user) {
      try {
        const user = await User.findById(req.user.id);
        if (user) {
          user.points = (user.points || 0) + mockResultData.ecoPoints;
          await user.save();
        }
      } catch (dbErr) {
        console.error("DB Error awarding points in fallback:", dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      data: mockResultData,
      isMock: true
    });
  }
};
