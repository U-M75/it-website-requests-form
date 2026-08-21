export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { formData, channel } = req.body;

  if (!formData) {
    return res.status(400).json({ error: 'Missing form data' });
  }

  try {
    const messageText = `🎫 *New IT/Website Request*
*Submitter:* ${formData.user}
*Category:* ${formData.category}
${formData.otherExplain ? `*Other:* ${formData.otherExplain}` : ''}
*Priority:* ${formData.priority}
*Platform:* ${formData.platform}

*Where it's Happening:*
${formData.whereHappening}

${formData.expectedVsActual ? `*Expected vs. Actual:*
${formData.expectedVsActual}` : ''}

*Description:*
${formData.description}

${formData.attachmentCount ? `*Attachments:* ${formData.attachmentCount} file(s)` : ''}`;

    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      return res.status(500).json({ 
        success: false, 
        error: 'SLACK_WEBHOOK_URL not configured' 
      });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: messageText,
        channel: channel,
      }),
    });

    const responseText = await response.text();

    if (response.ok || responseText === 'ok') {
      return res.status(200).json({ 
        success: true, 
        message: 'Posted to Slack' 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to post to Slack: ' + responseText 
      });
    }
  } catch (error) {
    console.error('Error posting to Slack:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
