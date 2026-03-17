export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, tool, tone, length } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const systemPrompts = {
    'Blog Post Writer': 'You are an expert blog writer. Write engaging, well-structured blog content that is informative and compelling. Use a conversational yet authoritative tone.',
    'Ad Copy Generator': 'You are an expert advertising copywriter. Write punchy, conversion-focused ad copy with strong headlines, compelling body text, and clear calls to action.',
    'Email Campaign': 'You are an expert email marketer. Write email copy with compelling subject lines, engaging opening lines, and clear calls to action that drive conversions.',
    'Product Description': 'You are an expert e-commerce copywriter. Write product descriptions that highlight benefits over features, use sensory language, and compel purchases.',
    'Social Media Post': 'You are a social media expert. Write engaging posts optimized for the platform, with hooks that stop the scroll and encourage engagement.',
    'SEO Content': 'You are an SEO content expert. Write search-optimized content that targets keywords naturally, answers user intent, and ranks well in search engines.'
  };

  const toneInstructions = tone ? `Write in a ${tone.toLowerCase()} tone.` : '';
  const lengthInstructions = {
    'Short (50–100 words)': 'Keep the output to 50-100 words.',
    'Medium (100–250 words)': 'Keep the output to 100-250 words.',
    'Long (250–500 words)': 'Keep the output to 250-500 words.'
  }[length] || '';

  const systemPrompt = systemPrompts[tool] || systemPrompts['Blog Post Writer'];
  const userMessage = `${prompt}${toneInstructions ? '\n\n' + toneInstructions : ''}${lengthInstructions ? '\n' + lengthInstructions : ''}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.error?.message || 'API error' });
    }

    const data = await response.json();
    const text = data.content[0].text;

    return res.status(200).json({ text });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Failed to generate content. Please try again.' });
  }
}
