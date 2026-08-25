KSC Tickets with Slack Integration
A complete request form integrated with Slack. Users can select their Slack profile, submit a ticket, and send it directly to the configured Slack channel.

Features
✅ Slack User Integration - Load active users from the Slack workspace
✅ CC User Selection - Select an optional user to mention in the ticket
✅ Channel Selection - Route tickets to a channel based on the selected platform
✅ Smart Form Fields - Category, priority, platform, and location details
✅ File Attachments - Upload screenshots and files directly to Slack
✅ Thank-you Screen - Replace the form with a confirmation screen after submission
✅ Conversation History - Track submissions during the current session
✅ Vercel Ready - Deploy directly to Vercel
✅ Dark Theme - Modern, eye-friendly UI
Quick Start
Clone the repository.
Run npm install.
Create .env.local with the required Slack variables.
Run npm run dev.
Open http://localhost:3000.
Deploy to Vercel.
Environment Variables
text

SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your-webhook
SLACK_DEFAULT_CHANNEL_ID=Cxxxxxxxxxx
The bot token must have these scopes:

text

users:read
files:write
chat:write
The bot must be invited to every channel that receives messages or file attachments.
