'use server';

/**
 * @fileOverview A simple chat AI agent.
 *
 * - chat - A function that handles the chat process.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatInputSchema = z.object({
  prompt: z.string().describe("The user's prompt."),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe("The AI's response."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const agentUrl = process.env.VERTEX_AGENT_URL;
    if (!agentUrl) {
      throw new Error('VERTEX_AGENT_URL environment variable not set.');
    }

    const response = await fetch(agentUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: input.prompt }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vertex AI Agent request failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    const resultText = data.output?.text;
    if (resultText === undefined) {
      const responseDump = JSON.stringify(data, null, 2);
      throw new Error(`The response from the Vertex AI Agent was missing the 'output.text' field. Response: ${responseDump}`);
    }
    
    return { response: resultText };
  }
);
