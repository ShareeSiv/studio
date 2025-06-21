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
import { getGoogleAccessToken } from '@/lib/auth';

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
      body: JSON.stringify({ input: `Summarize this session: ${input.sessionText}` }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`Vertex AI Agent request failed: ${response.statusText} - ${responseText}`);
    }

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        console.error("Failed to parse JSON from Vertex AI Agent response.", e);
        throw new Error(`Failed to parse JSON from Vertex AI Agent. Raw response: ${responseText}`);
    }

    const resultText = data.output?.text;
    if (resultText === undefined) {
      const responseDump = JSON.stringify(data, null, 2);
      throw new Error(`The response from the Vertex AI Agent was missing the 'output.text' field. Response: ${responseDump}`);
    }

    return { summary: resultText };
  }
);
