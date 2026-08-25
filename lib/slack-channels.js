// Platform routing is now enabled for the mapped channels below.
export const PLATFORM_ROUTING_ENABLED = true;

export const DEFAULT_CHANNEL = {
  name: 'flow-test',
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
    name: 'jk-tickets-slack-pos',
    id: 'C0BTFKJ5872',
  },
};

export function getPlatformChannel(platform) {
  if (!PLATFORM_ROUTING_ENABLED) return DEFAULT_CHANNEL;
  return PLATFORM_CHANNEL_MAP[platform] || DEFAULT_CHANNEL;
}
