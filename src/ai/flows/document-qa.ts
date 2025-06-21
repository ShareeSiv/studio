'use server';

/**
 * @fileOverview Document Q&A summarization AI agent.
 *
 * - documentQA - A function that handles the document question answering process.
 * - DocumentQAInput - The input type for the documentQA function.
 * - DocumentQAOutput - The return type for the documentQA function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getGoogleAccessToken } from '@/lib/auth';

const DocumentQAInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The question to ask about the document.'),
});
export type DocumentQAInput = z.infer<typeof DocumentQAInputSchema>;

const DocumentQAOutputSchema = z.object({
  answer: z.string().describe('The answer to the question based on the document.'),
});
export type DocumentQAOutput = z.infer<typeof DocumentQAOutputSchema>;

export async function documentQA(input: DocumentQAInput): Promise<DocumentQAOutput> {
  return documentQAFlow(input);
}

const documentQAFlow = ai.defineFlow(
  {
    name: 'documentQAFlow',
    inputSchema: DocumentQAInputSchema,
    outputSchema: DocumentQAOutputSchema,
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
      body: JSON.stringify({ input: { question: input.question, pdfDataUri: input.pdfDataUri } }),
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
    
    return { answer: resultText };
  }
);
