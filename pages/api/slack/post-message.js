// pages/api/slack/post-message.js

import { getPlatformChannel } from '../../../lib/slack-channels';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const { formData } = req.body || {};

  if (!formData) {
    return res.status(400).json({
      success: false,
      error: 'Missing form data',
    });
  }

  const messageText = `🎫 *Submitted the Website Requests Form with Priority* ${formData.priority}

*Category* ${formData.category}
${formData.otherExplain ? `If Other, please explain\n${formData.otherExplain}` : ''}

*Priority*
${formData.priority}

*Website*
${formData.platform}

*Where it is Happening*
${formData.whereHappening}

${formData.expectedVsActual ? `*Expected vs. Actual*\n${formData.expectedVsActual}` : ''}

*Ticket Description*
${formData.description}

${formData.attachmentCount ? `*Files* 📎 ${formData.attachmentCount}` : ''}

CC: <@${formData.userId}>`;

  const mappedChannel = getPlatformChannel(formData.platform);
  const isMappedChannel = Boolean(mappedChannel.id);
  const botToken = process.env.SLACK_BOT_TOKEN?.trim();

  try {
    // Mapped platforms use the Slack Web API so each one can go to its own channel.
    if (isMappedChannel) {
      if (!botToken) {
        return res.status(500).json({
          success: false,
          error: 'SLACK_BOT_TOKEN is not configured in Vercel',
        });
      }

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${botToken}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          channel: mappedChannel.id,
          text: messageText,
          mrkdwn: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        console.error('Slack chat.postMessage error:', data.error || response.statusText);
        return res.status(400).json({
          success: false,
          error: data.error || 'Failed to post message to Slack',
        });
      }

      return res.status(200).json({
        success: true,
        channel: mappedChannel.name,
        message: 'Posted to Slack',
      });
    }

    // Unmapped platforms continue using the existing flow-test webhook temporarily.
    const webhookUrl = process.env.SLACK_WEBHOOK_URL?.trim();

    if (!webhookUrl) {
      return res.status(500).json({
        success: false,
        error: 'SLACK_WEBHOOK_URL is not configured for the flow-test fallback',
      });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: messageText }),
    });

    const responseText = await response.text();

    if (!response.ok || responseText !== 'ok') {
      console.error('Slack webhook error:', responseText);
      return res.status(500).json({
        success: false,
        error: 'Failed to post to the flow-test Slack channel',
      });
    }

    return res.status(200).json({
      success: true,
      channel: 'flow-test',
      message: 'Posted to Slack',
    });
  } catch (error) {
    console.error('Slack post API error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Unable to post ticket to Slack',
    });
  }
}
