// pages/api/slack/post-message.js

import fs from 'node:fs/promises';
import { IncomingForm } from 'formidable';
import { getPlatformChannel } from '../../../lib/slack-channels';

export const config = {
  api: {
    // Required because the browser sends multipart/form-data with real files.
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      multiples: true,
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE,
    });

    form.parse(req, (error, fields, files) => {
      if (error) reject(error);
      else resolve({ fields, files });
    });
  });
}

function firstValue(value) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function arrayValue(value) {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

function normaliseFiles(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function getSlackUploadDetails(file, botToken) {
  const filename = file.originalFilename || 'attachment';
  const bytes = await fs.readFile(file.filepath);

  // Slack expects these two parameters as form-encoded values here.
  // Sending JSON can result in invalid_arguments/missing required fields.
  const uploadRequest = new URLSearchParams();
  uploadRequest.set('filename', filename);
  uploadRequest.set('length', String(bytes.length));

  const urlResponse = await fetch('https://slack.com/api/files.getUploadURLExternal', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
    },
    body: uploadRequest.toString(),
  });

  const urlData = await urlResponse.json();

  if (!urlResponse.ok || !urlData.ok) {
    const details = urlData.response_metadata?.messages?.join('; ');
    throw new Error(`Unable to prepare ${filename}: ${details || urlData.error || urlResponse.statusText}`);
  }

  const uploadResponse = await fetch(urlData.upload_url, {
    method: 'POST',
    headers: {
      'Content-Type': file.mimetype || 'application/octet-stream',
    },
    body: bytes,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Unable to upload ${filename} to Slack`);
  }

  return {
    id: urlData.file_id,
    title: filename,
  };
}

async function uploadFilesAndPost({ files, channelId, messageText, botToken }) {
  const uploadedFiles = await Promise.all(
    files.map(file => getSlackUploadDetails(file, botToken))
  );

  // Completing all files together keeps the formatted ticket text and previews
  // in one Slack post instead of creating one duplicate message per file.
  const completeResponse = await fetch('https://slack.com/api/files.completeUploadExternal', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      files: uploadedFiles,
      channel_id: channelId,
      initial_comment: messageText,
    }),
  });

  const completeData = await completeResponse.json();

  if (!completeResponse.ok || !completeData.ok) {
    throw new Error(`Unable to publish file(s): ${completeData.error || completeResponse.statusText}`);
  }
}

async function postMessageWithBot({ channelId, messageText, botToken }) {
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      channel: channelId,
      text: messageText,
      mrkdwn: true,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Failed to post message to Slack');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  let fields;
  let files;

  try {
    ({ fields, files } = await parseMultipartForm(req));
  } catch (error) {
    console.error('Multipart form error:', error.message);
    const message = String(error.message || error);
    return res.status(400).json({
      success: false,
      error: message.includes('maxFileSize')
        ? 'Each attachment must be 5 MB or smaller'
        : 'Unable to read form data',
    });
  }

  const formData = {
    user: firstValue(fields.user),
    userId: firstValue(fields.userId),
    category: firstValue(fields.category),
    otherExplain: firstValue(fields.otherExplain),
    priority: firstValue(fields.priority),
    platform: firstValue(fields.platform),
    whereHappening: firstValue(fields.whereHappening),
    expectedVsActual: firstValue(fields.expectedVsActual),
    description: firstValue(fields.description),
    ccUserIds: arrayValue(fields.ccUserIds),
  };

  const attachments = normaliseFiles(files.attachments);
  const mappedChannel = getPlatformChannel(formData.platform);
  const defaultChannelId = process.env.SLACK_DEFAULT_CHANNEL_ID?.trim();
  const targetChannelId = mappedChannel.id || defaultChannelId;
  const botToken = process.env.SLACK_BOT_TOKEN?.trim();
  const ccIds = [...new Set([formData.userId, ...formData.ccUserIds].filter(Boolean))];
  const ccLine = ccIds.length
    ? `CC: ${ccIds.map(userId => `<@${userId}>`).join(' ')}`
    : '';
  const priorityEmoji = {
    High: '🔴',
    Medium: '🟡',
    Low: '🟢',
  }[formData.priority] || '🟡';
  const otherLine = formData.category === 'Other' && formData.otherExplain
    ? `\n\n*If Other, please explain*\n${formData.otherExplain}`
    : '';
  // Keep the Slack message layout consistent with the requested design.
  const messageText = `🎫 *Submitted the Website Requests Form with Priority* ${priorityEmoji} ${formData.priority}

*Category* ${formData.category}${otherLine}

*Priority*
${priorityEmoji} ${formData.priority}

*Website*
${formData.platform}

*Where it is Happening*
${formData.whereHappening}

${formData.expectedVsActual ? `*Expected vs. Actual*\n${formData.expectedVsActual}\n\n` : ''}*Ticket Description*
${formData.description}${ccLine ? `\n\n${ccLine}` : ''}`;

  try {
    if (attachments.length > 0) {
      if (!botToken) {
        return res.status(500).json({
          success: false,
          error: 'SLACK_BOT_TOKEN is not configured in Vercel',
        });
      }

      if (!targetChannelId) {
        return res.status(500).json({
          success: false,
          error: 'Add SLACK_DEFAULT_CHANNEL_ID so uploaded files can be shared in flow-test',
        });
      }

      await uploadFilesAndPost({
        files: attachments,
        channelId: targetChannelId,
        messageText,
        botToken,
      });
    } else if (mappedChannel.id) {
      if (!botToken) {
        return res.status(500).json({
          success: false,
          error: 'SLACK_BOT_TOKEN is not configured in Vercel',
        });
      }

      await postMessageWithBot({
        channelId: mappedChannel.id,
        messageText,
        botToken,
      });
    } else {
      // Until platform routing is enabled, text-only tickets continue using
      // the existing flow-test incoming webhook.
      const webhookUrl = process.env.SLACK_WEBHOOK_URL?.trim();

      if (!webhookUrl) {
        return res.status(500).json({
          success: false,
          error: 'SLACK_WEBHOOK_URL is not configured for flow-test',
        });
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText }),
      });

      const responseText = await response.text();

      if (!response.ok || responseText !== 'ok') {
        throw new Error('Failed to post to the flow-test Slack channel');
      }
    }

    return res.status(200).json({
      success: true,
      channel: mappedChannel.name,
      message: 'Posted to Slack',
    });
  } catch (error) {
    console.error('Slack post API error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unable to post ticket to Slack',
    });
  }
}
