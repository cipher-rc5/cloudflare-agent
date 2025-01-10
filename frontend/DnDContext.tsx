import React from 'react';
import { createContext, ReactNode, useContext, useState } from 'react';

export interface Root {
  name: string;
  clients: Array<any>;
  model_provider: string;
  settings: { secrets: Record<string, unknown>, voice: { model: string } };
  people: Array<string>;
  plugins: Array<any>;
  bio: Array<string>;
  lore: Array<string>;
  knowledge: Array<string>;
  messages_example: Array<Array<{ user: string, content: { text: string } }>>;
  posts_example: Array<string>;
  topics: Array<string>;
  style: { all: Array<string>, chat: Array<string>, post: Array<string> };
  adjectives: Array<string>;
}

type NodeType = keyof Root | null;

interface DnDContextType {
  type: NodeType;
  setType: (type: NodeType) => void;
}

const DnDContext = createContext<DnDContextType>({ type: null, setType: () => {} });

interface DnDProviderProps {
  children: ReactNode;
}

export const DnDProvider = ({ children }: DnDProviderProps) => {
  const [type, setType] = useState<NodeType>(null);

  return <DnDContext.Provider value={{ type, setType }}>{children}</DnDContext.Provider>;
};

export const useDnD = () => useContext(DnDContext);

export default DnDContext;
