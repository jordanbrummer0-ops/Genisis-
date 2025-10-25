export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  id: string;
  author: MessageAuthor;
  text: string;
  image?: string;
  sources?: GroundingChunk[];
}

export interface Project {
  id: string;
  name: string;
  chatHistory: ChatMessage[];
}
