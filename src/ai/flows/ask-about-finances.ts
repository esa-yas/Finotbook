'use server';

/**
 * @fileOverview A financial analysis AI agent.
 *
 * - askAboutFinances - A function that handles financial questions.
 * - AskAboutFinancesInput - The input type for the askAboutFinances function.
 */
import { ai } from '@/ai/genkit';
import type { Transaction } from '@/contexts/BookContext';
import { z } from 'genkit';

// We don't export the Transaction schema from the context, so we redefine it here.
const TransactionSchema = z.object({
  id: z.string(),
  book_id: z.string(),
  date: z.string(),
  description: z.string(),
  amount: z.number(),
  type: z.enum(['credit', 'debit']),
});

export const AskAboutFinancesInputSchema = z.object({
  query: z.string().describe('The user question about their finances.'),
  transactions: z.array(TransactionSchema).describe('The list of financial transactions.'),
});
export type AskAboutFinancesInput = z.infer<typeof AskAboutFinancesInputSchema>;

// This is the schema the prompt will actually receive after we process the input.
const FinancialPromptInputSchema = z.object({
    query: z.string(),
    transactionsJson: z.string(),
});

export async function askAboutFinances(input: AskAboutFinancesInput): Promise<string> {
  const result = await askAboutFinancesFlow(input);
  return result;
}

const financialPrompt = ai.definePrompt({
  name: 'financialPrompt',
  input: { schema: FinancialPromptInputSchema },
  output: { schema: z.string() },
  prompt: `You are an expert financial assistant. Your role is to answer questions based *only* on the provided list of financial transactions.

  Analyze the following transactions and answer the user's query. Provide clear, concise answers. If the data is insufficient to answer the question, state that you don't have enough information.
  
  Current Date for reference: ${new Date().toLocaleDateString()}
  
  User Query:
  "{{{query}}}"
  
  Transactions Data:
  {{#if transactionsJson}}
  \`\`\`json
  {{{transactionsJson}}}
  \`\`\`
  {{else}}
  There are no transactions to analyze.
  {{/if}}`,
});

const askAboutFinancesFlow = ai.defineFlow(
  {
    name: 'askAboutFinancesFlow',
    inputSchema: AskAboutFinancesInputSchema,
    outputSchema: z.string(),
  },
  async (input: AskAboutFinancesInput) => {
    // Manually serialize the transactions to a JSON string here.
    const transactionsJson = JSON.stringify(input.transactions, null, 2);

    // Call the prompt with the prepared data.
    const { output } = await financialPrompt({
      query: input.query,
      transactionsJson: transactionsJson,
    });
    
    return output!;
  }
);
