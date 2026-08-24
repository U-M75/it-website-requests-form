// pages/api/slack/get-users.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const botToken = process.env.SLACK_BOT_TOKEN?.trim();

  if (!botToken) {
    console.error('SLACK_BOT_TOKEN is not configured');
    return res.status(500).json({
      success: false,
      error: 'SLACK_BOT_TOKEN is not configured in Vercel',
    });
  }

  try {
    // users.list is paginated. Fetch every page so larger workspaces are complete.
    const members = [];
    let cursor = '';

    do {
      const url = new URL('https://slack.com/api/users.list');
      url.searchParams.set('limit', '200');
      if (cursor) url.searchParams.set('cursor', cursor);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${botToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        console.error('Slack users.list error:', data.error || response.statusText);
        return res.status(400).json({
          success: false,
          error: data.error || 'Failed to fetch users from Slack',
        });
      }

      members.push(...(data.members || []));
      cursor = data.response_metadata?.next_cursor || '';
    } while (cursor);

    const users = members
      .filter(user => (
        !user.deleted &&
        !user.is_bot &&
        !user.is_app_user &&
        user.id !== 'USLACKBOT'
      ))
      .map(user => ({
        // Prefer the display name, then the real name, then the Slack username.
        name: user.profile?.display_name?.trim() || user.real_name?.trim() || user.name,
        username: user.name,
        userId: user.id,
        email: user.profile?.email || '',
      }))
      .filter(user => user.name)
      .sort((a, b) => a.name.localeCompare(b.name));

    // Cache briefly at Vercel's edge; the list does not need to be fetched every second.
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    return res.status(200).json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error) {
    console.error('Slack users API error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Unable to load Slack users',
    });
  }
}
