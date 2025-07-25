'use client';

import { useState } from 'react';
import { useBook } from '@/contexts/BookContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { askAboutFinances } from '@/ai/flows/ask-about-finances.client';

export function ChatComponent() {
  const { transactions } = useBook();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  const handleAsk = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResponse('');
    try {
      const result = await askAboutFinances({ query, transactions });
      setResponse(result);
    } catch (error) {
      console.error('AI query failed:', error);
      setResponse('Sorry, something went wrong while analyzing your finances.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Bot className="h-4 w-4" />
        <AlertTitle>Ask about your finances</AlertTitle>
        <AlertDescription>
          Get quick insights from your transaction data. Try asking "What was my total spending this month?" or "Summarize my income sources."
        </AlertDescription>
      </Alert>
      <div className="space-y-2">
        <Textarea
          placeholder="Ask a question..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          rows={2}
        />
        <Button onClick={handleAsk} disabled={loading || !query.trim()}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ask AI
        </Button>
      </div>
      {response && (
        <div className="prose prose-sm max-w-none p-4 border rounded-md bg-muted">
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
