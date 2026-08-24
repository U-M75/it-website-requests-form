export default async function handler(req, res) {
  try {
    const token = process.env.SLACK_BOT_TOKEN;

    console.log('Token:', token ? 'exists' : 'missing');

    if (!token) {
      return res.status(500).json({ 
        error: 'SLACK_BOT_TOKEN not configured',
        users: []
      });
    }

    const response = await fetch('https://slack.com/api/users.list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log('Slack response:', data);

    if (!data.ok) {
      return res.status(200).json({ 
        error: data.error,
        users: []
      });
    }

    const users = data.members
      .filter(user => !user.is_bot && !user.deleted)
      .map(user => ({
        name: user.real_name || user.name,
        username: user.name,
        userId: user.id,
      }));

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Error:', error);
    return res.status(200).json({ 
      error: error.message,
      users: []
    });
  }
}
