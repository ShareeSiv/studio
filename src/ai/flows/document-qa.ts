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

const prompt = ai.definePrompt({
  name: 'documentQAPrompt',
  input: {schema: DocumentQAInputSchema},
  output: {schema: DocumentQAOutputSchema},
  prompt: `You are an expert in extracting information from PDF documents.

You will be provided with a PDF document and a question.
Your task is to answer the question based on the content of the document.

Document:
{{media url=pdfDataUri}}

Question: {{{question}}}

Answer:`, // Removed backticks
});

const documentQAFlow = ai.defineFlow(
  {
    name: 'documentQAFlow',
    inputSchema: DocumentQAInputSchema,
    outputSchema: DocumentQAOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
