
/**
 * @fileOverview A mock financial analysis AI agent for client-side builds.
 * This file provides a non-functional version of the `askAboutFinances` flow
 * to prevent server-side AI code from being bundled on the client.
 */

import type { AskAboutFinancesInput } from './ask-about-finances';

/**
 * Mock function that simulates the AI flow.
 * It returns a placeholder response and is intended only to allow
 * the Next.js static export to succeed.
 * @param {AskAboutFinancesInput} input - The user's query and transactions.
 * @returns {Promise<string>} A placeholder string.
 */
export async function askAboutFinances(input: AskAboutFinancesInput): Promise<string> {
  console.log("Mock AI function called. This should only happen during server-side rendering/build.");
  return Promise.resolve("This is a placeholder response from the mock AI assistant.");
}
