export interface TweetRequest {
  prompt: string;
  characterName?: string;
  media?: string[];
}

export interface TweetResponse {
  success: boolean;
  content?: string;
  twitterPosted?: boolean;
  error?: string;
}

export interface AIResponse {
  content: string;
}

export interface GenerateResponse {
  content?: string;
}
