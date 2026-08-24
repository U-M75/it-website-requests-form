// pages/api/slack-users.js
export default async function handler(req, res) {
  // صرف GET request allow کریں
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  try {
    const botToken = process.env.SLACK_BOT_TOKEN;
    
    // Environment variable check کریں
    if (!botToken) {
      console.error('❌ SLACK_BOT_TOKEN not found in environment variables');
      return res.status(500).json({ 
        error: 'Slack Bot Token not configured',
        success: false 
      });
    }
 
    // Slack API سے users list fetch کریں
    const response = await fetch('https://slack.com/api/users.list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${botToken}`,
        'Content-Type': 'application/json',
      },
    });
 
    const data = await response.json();
 
    // اگر Slack API fail ہو
    if (!data.ok) {
      console.error('Slack API Error:', data.error);
      return res.status(400).json({ 
        error: data.error || 'Failed to fetch users from Slack',
        success: false 
      });
    }
 
    // صرف active users اور bots نہیں
    const activeUsers = data.members
      .filter(user => !user.deleted && user.real_name) // Real users only
      .map(user => ({
        name: user.real_name || user.name,
        username: user.name,
        userId: user.id,
        email: user.profile?.email || '',
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // الفبائی ترتیب میں
 
    console.log(`✅ Fetched ${activeUsers.length} users from Slack`);
 
    return res.status(200).json({
      success: true,
      users: activeUsers,
      count: activeUsers.length,
    });
 
  } catch (error) {
    console.error('API Error:', error.message);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      success: false 
    });
  }
}
 
