export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { formData, channel } = req.body;

  if (!formData || !channel) {
    return res.status(400).json({ error: 'Missing form data or channel' });
  }

  try {
    const messageText = `🎫 *New IT/Website Request*
*Submitter:* ${formData.user}
*Category:* ${formData.category}
*Priority:* ${formData.priority}
*Platform:* ${formData.platform}

*Where it's Happening:*
${formData.whereHappening}

*Description:*
${formData.description}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ANTHROPIC_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Send this message to Slack channel #${channel}: "${messageText}"`,
          },
        ],
        mcp_servers: [
          {
            type: 'url',
            url: 'https://mcp.slack.com/mcp',
            name: 'slack-mcp',
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error('Slack API error: ' + (data.error?.message || 'Unknown error'));
    }

    const responseText = data.content?.filter(c => c.type === 'text')?.map(c => c.text)?.join('').toLowerCase() || '';
    const success = responseText.includes('success') || responseText.includes('posted') || !responseText.includes('error');

    return res.status(200).json({
      success,
      message: success ? 'Message posted to Slack' : 'Failed to post message',
      channel,
    });
  } catch (error) {
    console.error('Error posting to Slack:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
