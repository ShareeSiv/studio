'use server';

/**
 * @fileOverview This file defines a Genkit flow for summarizing chat sessions.
 *
 * - summarizeSession - A function that summarizes a given chat session.
 * - SummarizeSessionInput - The input type for the summarizeSession function.
 * - SummarizeSessionOutput - The return type for the summarizeSession function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSessionInputSchema = z.object({
  sessionText: z
    .string()
    .describe("The complete text content of the chat session to be summarized."),
});

export type SummarizeSessionInput = z.infer<typeof SummarizeSessionInputSchema>;

const SummarizeSessionOutputSchema = z.object({
  summary: z
    .string()
    .describe("A concise summary of the chat session's key points and topics."),
});

export type SummarizeSessionOutput = z.infer<typeof SummarizeSessionOutputSchema>;

export async function summarizeSession(
  input: SummarizeSessionInput
): Promise<SummarizeSessionOutput> {
  return summarizeSessionFlow(input);
}

const summarizeSessionFlow = ai.defineFlow(
  {
    name: 'summarizeSessionFlow',
    inputSchema: SummarizeSessionInputSchema,
    outputSchema: SummarizeSessionOutputSchema,
  },
  async (input) => {
    const agentUrl = process.env.VERTEX_AGENT_URL;
    if (!agentUrl || agentUrl === 'YOUR_VERTEX_AGENT_URL_HERE') {
      throw new Error('VERTEX_AGENT_URL environment variable not set.');
    }

    const response = await fetch(agentUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionText: input.sessionText }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vertex AI Agent request failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.summary) {
        throw new Error("The response from the Vertex AI Agent was missing the 'summary' field.");
    }

    return { summary: data.summary };
  }
);
