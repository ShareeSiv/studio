export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  pdfName?: string;
}

export interface Session {
  id: string;
  name: string;
  messages: Message[];
}
