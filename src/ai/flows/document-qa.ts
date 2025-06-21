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
    if (!agentUrl || agentUrl === 'YOUR_VERTEX_AGENT_URL_HERE') {
      throw new Error('VERTEX_AGENT_URL environment variable not set.');
    }

    const response = await fetch(agentUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfDataUri: input.pdfDataUri,
        question: input.question,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vertex AI Agent request failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.answer) {
      throw new Error("The response from the Vertex AI Agent was missing the 'answer' field.");
    }
    
    return { answer: data.answer };
  }
);
