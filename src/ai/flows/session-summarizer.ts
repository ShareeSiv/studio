'use server';

/**
 * @fileOverview This file defines a Genkit flow for summarizing chat sessions.
 *
 * - summarizeSession - A function that summarizes a given chat session.
 * - SummarizeSessionInput - The input type for the summarizeSession function.
 * - SummarizeSessionOutput - The return type for the summarizeSession function.
 */

import {ai} from '@/ai/genkit';
import { getGoogleAccessToken } from '@/lib/auth';
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
    if (!agentUrl) {
      throw new Error('VERTEX_AGENT_URL environment variable not set.');
    }

    const accessToken = await getGoogleAccessToken();

    const response = await fetch(agentUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query: `Summarize this session: ${input.sessionText}` }),
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

    return { summary: resultText };
  }
);
