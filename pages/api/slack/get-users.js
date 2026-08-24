export default async function handler(req, res) {
  try {
    const token = process.env.SLACK_BOT_TOKEN;

    if (!token) {
      return res.status(500).json({ error: 'SLACK_BOT_TOKEN not configured' });
    }

    const response = await fetch('https://slack.com/api/users.list', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!data.ok) {
      return res.status(500).json({ error: data.error });
    }

    // Filter out bots and app users
    const users = data.members
      .filter(user => !user.is_bot && user.profile.email)
      .map(user => ({
        name: user.real_name || user.name,
        username: user.name,
        userId: user.id,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: error.message });
  }
}
