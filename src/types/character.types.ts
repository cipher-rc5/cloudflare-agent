export interface EnvSecrets {
  TWITTER_DRY_RUN: boolean;
  TWITTER_USERNAME: string;
  TWITTER_PASSWORD: string;
  TWITTER_EMAIL: string;
  TWITTER_2FA_SECRET: string;
  TWITTER_POLL_INTERVAL: number;
  TWITTER_SEARCH_ENABLE: boolean;
  TWITTER_TARGET_USERS: string;
  TWITTER_RETRY_LIMIT: string;
  X_SERVER_URL: string;
  XAI_API_KEY: string;
  XAI_MODEL: string;
  POST_INTERVAL_MIN: number;
  POST_INTERVAL_MAX: number;
  POST_IMMEDIATELY: boolean;
}

export interface Character {
  name: string;
  modelProvider: string;
  modelName: string;
  character: {
    settings: { voice: { model: string }, secrets: EnvSecrets },
    bio: string[],
    lore: string[],
    knowledge: string[],
    style: { all: string[], chat: string[], post: string[] },
    adjectives: string[]
  };
  modules: any[];
  plugins: any[];
}

export const templateCharacter: Character = {
  name: 'Template Character',
  modelProvider: 'openai',
  modelName: 'default-model',
  character: {
    settings: {
      voice: { model: 'en_US-default-voice' },
      secrets: {
        TWITTER_DRY_RUN: false,
        TWITTER_USERNAME: '',
        TWITTER_PASSWORD: '',
        TWITTER_EMAIL: '',
        TWITTER_2FA_SECRET: '',
        TWITTER_POLL_INTERVAL: 120,
        TWITTER_SEARCH_ENABLE: false,
        TWITTER_TARGET_USERS: '',
        TWITTER_RETRY_LIMIT: '',
        X_SERVER_URL: '',
        XAI_API_KEY: '',
        XAI_MODEL: '',
        POST_INTERVAL_MIN: 90,
        POST_INTERVAL_MAX: 180,
        POST_IMMEDIATELY: true
      }
    },
    bio: ['This is a template character bio.'],
    lore: ['This character has no specific lore yet.'],
    knowledge: ['Template knowledge entry.'],
    style: { all: ['neutral'], chat: ['friendly'], post: ['informative'] },
    adjectives: ['generic', 'neutral', 'adaptable']
  },
  modules: [],
  plugins: []
};
