const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Valid categories matching our Issue model
const CATEGORIES = [
  'garbage', 'waterlogging', 'deforestation', 'air_pollution',
  'noise_pollution', 'sewage', 'road_damage', 'illegal_dumping',
  'water_scarcity', 'other',
];

/**
 * Runs AI vision triage on an image URL.
 * Returns { category, confidence, description }
 */
const triageImage = async (imageUrl) => {
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'url',
              url: imageUrl,
            },
          },
          {
            type: 'text',
            text: `You are an environmental issue classifier. Analyze this image and classify the environmental complaint.

Return ONLY a JSON object with no other text:
{
  "category": "<one of: garbage, waterlogging, deforestation, air_pollution, noise_pollution, sewage, road_damage, illegal_dumping, water_scarcity, other>",
  "confidence": <0.0 to 1.0>,
  "description": "<one sentence description of what you see>"
}`,
          },
        ],
      },
    ],
  });

  try {
    const text = response.content[0].text.trim();
    const parsed = JSON.parse(text);

    // Validate category
    if (!CATEGORIES.includes(parsed.category)) parsed.category = 'other';
    if (typeof parsed.confidence !== 'number') parsed.confidence = 0.5;

    return parsed;
  } catch {
    return { category: 'other', confidence: 0, description: 'Could not classify image.' };
  }
};

/**
 * Generates a structured authority escalation email from issue data.
 * Returns HTML string.
 */
const generateEscalationEmail = async (issue) => {
  const prompt = `You are a civic complaint system. Generate a formal, professional escalation email to a municipal authority about the following environmental issue.

Issue Details:
- Title: ${issue.title}
- Category: ${issue.category.replace(/_/g, ' ')}
- Description: ${issue.description}
- Location: ${issue.address || 'See coordinates'}
- Ward: ${issue.wardName}
- Submitted: ${issue.createdAt.toDateString()}
- Community Upvotes: ${issue.upvoteCount}
- Resident Verifications: ${issue.verificationCount}
- Urgency Level: ${issue.urgencyLevel.toUpperCase()}
- Urgency Score: ${issue.urgencyScore}
- Image: ${issue.beforeImage ? 'Attached (see below)' : 'Not provided'}

Write a professional email in HTML format. Include:
1. A formal greeting
2. A clear summary of the issue
3. The community impact (upvotes + verifications show public concern)
4. The urgency level and why action is needed
5. A request for acknowledgement and timeline for resolution
6. A professional sign-off from "EcoTrack Civic Platform"

Use clean, minimal HTML. Only return the email body HTML, nothing else.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text;
};

module.exports = { triageImage, generateEscalationEmail };
