import { useEffect, useState } from 'react';
import Head from 'next/head'
import * as React from 'react';
import { TokenUsageSummary } from '@prisma/client';
import { formatDate } from '../lib/utils';
import { getAllUsageSummaries } from '@/lib/helpers';

export async function getServerSideProps() {
  const wssPort = Number(process.env.WSS_PORT);
  
  const storedSummaries = await getAllUsageSummaries();

  return {
    props: {
      storedSummaries: JSON.parse(JSON.stringify(storedSummaries)),
      wssPort
    },
  };
}

export type IndexProps = {
  wssPort: number;
  storedSummaries: TokenUsageSummary[];
};

// define a top bar component.
export const TopBar = () => {
  return (
    <div className="flex flex-row justify-between border border-b-1 border-b-gray-300 px-5 py-5">
      <div className="flex flex-row space-x-2">
          <p>tokmon explorer 🔤🧐</p>
      </div>
      <div className="flex flex-row space-x-5">
      <a className="underline block" href="/help">Help</a>
      <a className="underline block" href="https://github.com/yagil/tokmon" target="_blank" rel="noopener noreferrer">Github</a>
      </div>
  </div>
  )
}

export const Instructions = () => {
  return (
    <div className="flex flex-col text-center mb-5 justify-center space-y-5 bg-gray-100 rounded-xl py-10">
      <h1 className="text-xl font-medium mb-5">Get started with <b className="font-mono text-indigo-900">tokmon --beam</b> </h1>
      <hr></hr>
      <p className="py-1 rounded-md md:w-2/5 text-left mx-auto">1. Install <b className="font-mono">tokmon</b> from PyPi</p>
      <code>
        <p className="font-mono text-sm py-3 px-10 lg:w-2/5 bg-indigo-800 lg:rounded-md text-white mx-auto">pip install tokmon</p>
      </code>
      <p className="py-1 md:w-2/5 text-left mx-auto">2. Start <b className="font-mono">tokmon</b> with the <b className="font-mono">--beam</b> flag set</p>
      <code>
        <p className="font-mono text-sm py-3 px-10 lg:w-2/5 bg-indigo-800 lg:rounded-md text-white  mx-auto">tokmon --beam &lt;your program&gt; [arg1] [arg2] ...</p>
      </code>
      <p className="py-1 md:w-2/5 text-left mx-auto">3. Make OpenAI API calls in your program</p>
      <p className="py-1 md:w-2/5 text-left mx-auto">4. Watch the conversation appear in the explorer</p>
    </div>
  )
}

export default function Index({ wssPort, storedSummaries } : IndexProps) {
  const [summaries, setSummaries] = useState<TokenUsageSummary[]>(storedSummaries);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedId, setLastUpdatedId] = useState<string | null>(null);

  console.log(`type of summaries: ${typeof summaries}`);

  const updateSummaries = (data: any) => {
    setSummaries((prevSummaries) => {
      const newSummaries = [...prevSummaries];
      const index = prevSummaries.findIndex((summary) => summary.tokmon_conversation_id === data.tokmon_conversation_id);
      if (index !== -1) {
        newSummaries[index] = data;
      } else {
        return [data, ...prevSummaries];
      }
      return newSummaries;
    });
  }
    
  useEffect(() => {
    fetch('/api/summary')
      .then((res) => res.json())
      .then((data) => { setSummaries(data); })
      .catch((error) => {
        console.error('Error fetching summaries:', error)
        setError(error.message);
      });

    const ws = new WebSocket(`ws://localhost:${wssPort}`);
    ws.onopen = () => {
      console.log('Connected to websocket server');
    }
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data.toString());
      
      const data = message.data;
      const type = message.type;

      if (type === 'tokenUsageSummary') {
        updateSummaries(data);
        setLastUpdatedId(data.tokmon_conversation_id);
      }
    }
    return () => {
      ws.close();
    }
  }, []);

  useEffect(() => {
    if (!lastUpdatedId) return;
    const summaryRow = document.getElementById(`summary-${lastUpdatedId}`);
    if (summaryRow) {
      summaryRow.classList.add('bg-emerald-200');
      setTimeout(() => {
        summaryRow.classList.remove('bg-emerald-200');
        setLastUpdatedId(null);
      }, 1000);
    }
  }, [summaries]);

  const deleteSummary = async (id: string) => {
    try {
      // show "Are you sure?" alert
      if (!confirm('Are you sure you want to delete this summary?')) {
        return;
      }
      // delete summary
      await fetch(`/api/delete/${id}`, { method: 'DELETE' });
      setSummaries((prevSummaries) => prevSummaries.filter((summary) => summary.tokmon_conversation_id !== id));
    } catch (error) {
      console.error('Error deleting summary:', error);
    }
  };

  if (error) return <div className="container mx-auto p-10">Error: {error}</div>;

  const totalTokens = (summary: TokenUsageSummary) => {
    const { total_tokens } = summary.total_usage as { total_tokens: number };
    return total_tokens;
  };

  return (
    <>
      <Head>
        <title>Tokmon Explorer • Home</title>
      </Head>
      <TopBar />
      <div className="p-10">
        <h1 className="text-2xl font-medium mb-10">Conversations History</h1>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border p-2">Last updated</th>
              <th className="border p-2">Conversation ID</th>
              <th className="border p-2">Program invocation</th>
              <th className="border p-2">Total tokens</th>
              <th className="border p-2">Total cost</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {summaries.length === 0 && (
              <>
              <tr>
                <td className="border p-2 text-gray-700" colSpan={6}>No data. Make sure your database is up and running.</td>
              </tr>
              <tr>
                <td colSpan={6} className="pt-10"><Instructions /></td>
              </tr>
              </>
            )}

            {summaries.map((summary) => (
              <tr key={summary.id} id={`summary-${summary.tokmon_conversation_id}`}>
                <td className="border p-2 text-gray-700">{formatDate(summary.updated_at)}</td>
                <td
                  className="border p-2 underline cursor-pointer a-like"
                >
                  <a href={`/conversation/${summary.tokmon_conversation_id}`}>
                  {summary.tokmon_conversation_id}
                  </a>
                </td>
                <td className="border p-2">{summary.monitored_program}</td>
                <td className="border p-2">{totalTokens(summary)}</td>
                <td className="border p-2">${summary.total_cost}</td>
                <td className="border p-2">
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => deleteSummary(summary.tokmon_conversation_id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}