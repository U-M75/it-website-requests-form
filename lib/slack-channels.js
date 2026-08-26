// Platform routing is enabled for the mapped channels below.
export const PLATFORM_ROUTING_ENABLED = true;

export const DEFAULT_CHANNEL = {
  name: 'flow-test',
  id: null,
};

const IT_TICKETS_CHANNEL = {
  name: 'it-tickets',
  // The channel ID can be resolved from the channel name by the API.
  id: null,
};

export const PLATFORM_CHANNEL_MAP = {
  'Retail - Kawaii Slime Company Web': {
    name: 'dev-itgeeks-ksc',
    id: 'C0ANZQK7RDE',
  },
  'Retail - Jellyland USA Web': {
    name: 'dev-itgeeks-jellyland',
    id: 'C0A6GNCAZ39',
  },
  'B2B - The Kawaii Company': {
    name: 'dev-itgeeks-tkc',
    id: 'C0ANZQN7FQQ',
  },
  'Disney POS': {
    name: 'it-tickets',
    id: 'C0BSHEGGRU3',
  },
  'Slack': IT_TICKETS_CHANNEL,
  'Microsoft Sharepoint': IT_TICKETS_CHANNEL,
  'Zendesk': IT_TICKETS_CHANNEL,
  'Social Media': IT_TICKETS_CHANNEL,
  'Shopify Access': IT_TICKETS_CHANNEL,

  // Other should go to flow-test.
  'Other': DEFAULT_CHANNEL,
};

export function getPlatformChannel(platform) {
  if (!PLATFORM_ROUTING_ENABLED) return DEFAULT_CHANNEL;
  return PLATFORM_CHANNEL_MAP[platform] || DEFAULT_CHANNEL;
}
