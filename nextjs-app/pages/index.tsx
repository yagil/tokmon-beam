import { useEffect, useState } from 'react';
import Head from 'next/head'
import { useRouter } from 'next/router';
import * as React from 'react';
import { ChatExchange, TokenUsageSummary } from '@prisma/client';
import { formatDate, getLastMessageInChatExchanges } from '../lib/utils';
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
      <a className="underline block" href="https://github.com/yagil/tokmon-beam" target="_blank" rel="noopener noreferrer">Github</a>
      </div>
  </div>
  )
}

type InstructionsProps = {
  onHomeScreen: boolean;
}

export const Instructions = ({ onHomeScreen } : InstructionsProps) => {
  return (
    <div className="flex flex-col text-center mb-5 justify-center space-y-5 bg-gray-100 rounded-xl py-10 max-w-5xl mx-auto">
      <h1 className="text-xl font-medium mb-5">Get started with <b className="font-mono text-indigo-900">tokmon --beam</b> </h1>
      <hr></hr>
      <p className="py-1 rounded-md lg:w-4/5 text-left mx-auto">1. Install <b className="font-mono">tokmon</b> from PyPi</p>
      <code>
        <p className="font-mono text-sm py-3 px-10 lg:w-4/5 bg-indigo-800 lg:rounded-md text-white mx-auto">pip install tokmon</p>
      </code>
      <p className="py-1 lg:w-4/5 text-left mx-auto">2. Start <b className="font-mono">tokmon</b> with the <b className="font-mono">--beam</b> flag set</p>
      <code>
        <p className="font-mono text-sm py-3 px-10 lg:w-4/5 bg-indigo-800 lg:rounded-md text-white  mx-auto">tokmon --beam localhost:9000 /path/to/your/&lt;your program&gt; [arg1] [arg2] ...</p>
      </code>
      <p className="py-1 lg:w-4/5 text-left mx-auto">3. Make OpenAI API calls in your program</p>
      <p className="py-1 lg:w-4/5 text-left mx-auto">4. Watch the conversation appear in the explorer
      { !onHomeScreen && <span> <a className="underline" href="/">on the home screen</a>.</span> }
      </p>
    </div>
  )
}

export default function Index({ wssPort, storedSummaries } : IndexProps) {
  const [summaries, setSummaries] = useState<TokenUsageSummary[]>(storedSummaries);
  const [chatExchanges, setChatExchanges] = useState<{ [key: string]: ChatExchange[] }>({});
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedId, setLastUpdatedId] = useState<string | null>(null);
  const router = useRouter();

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
    setSummaries(storedSummaries);
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
      } else if (type === 'chatExchange') {
        setChatExchanges((prevChatExchanges) => {
          const newChatExchanges = { ...prevChatExchanges };
          const chatExchangesForConversation = newChatExchanges[data.tokmon_conversation_id] || [];
          chatExchangesForConversation.push(data);
          newChatExchanges[data.tokmon_conversation_id] = chatExchangesForConversation;
          return newChatExchanges;
        });
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
  }, [summaries, chatExchanges]);

  const deleteSummary = async (id: string) => {
    try {
      // Show "Are you sure?" alert
      if (!confirm('**Danger Zone**\nAre you sure you want to delete this summary?\n\nThis will delete the record from the database and cannot be undone.')) {
        return;
      }
      // Delete summary from the database
      await fetch(`/api/delete/${id}`, { method: 'DELETE' });

      // Update local UI state
      setSummaries((prevSummaries) => prevSummaries.filter((summary) => summary.tokmon_conversation_id !== id));
      setChatExchanges((prevChatExchanges) => {
        const newChatExchanges = { ...prevChatExchanges };
        delete newChatExchanges[id];
        return newChatExchanges;
      });
    } catch (error) {
      console.error('Error deleting summary:', error);
    }
  };

  if (error) return <div className="container mx-auto p-10">Error: {error}</div>;

  const totalTokens = (summary: TokenUsageSummary) => {
    const { total_tokens } = summary.total_usage as { total_tokens: number };
    return total_tokens;
  };

  const getLastMessageStyled = (summary: TokenUsageSummary) => {
    const maxMessageLength = 120;
    if (summary == undefined) return <>No messages</>;
    let exchanges = summary.chatExchanges;
    if (exchanges == undefined) {
      exchanges = chatExchanges[summary.tokmon_conversation_id];
    }
    if (!exchanges) return <>No messages</>;
    const message = getLastMessageInChatExchanges(exchanges);
    if (!message) return <></>;
    return <>
      {message.content.length > maxMessageLength ? message.content.substring(0, maxMessageLength) + '...' : message.content}
    </>;
  };

  const getProgramInvocationStyled = (program: string) => {
    const maxLength = 25;
    if (program.length > maxLength) {
      const start = program.length - maxLength;
      return  '...' + program.substring(start, program.length);
    }
    return program;
  };

  return (
    <>
      <Head>
        <title>Tokmon Explorer • Home</title>
      </Head>
      <TopBar />
      <div className="p-10">
        <h1 className="text-2xl font-medium mb-10">OpenAI API Calls</h1>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border p-2 whitespace-nowrap w-1">Last updated</th>
              <th className="border p-2 whitespace-nowrap w-1">Source program</th>
              <th className="border p-2">Last <code className="bg-slate-200 px-1 rounded-md font-medium">assistant</code> message</th>
              <th className="border p-2 text-center">Total cost</th>
              <th className="border p-2 text-center">Total tokens</th>
              <th className="border p-2 whitespace-nowrap w-1 text-center">Tokmon Chat ID</th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {summaries.length === 0 && (
              <>
              <tr>
                <td className="border p-2 text-gray-700" colSpan={6}>No data yet.</td>
              </tr>
              <tr>
                <td colSpan={6} className="pt-10"><Instructions onHomeScreen={true} /></td>
              </tr>
              </>
            )}

            {summaries.map((summary) => (
              <tr
                key={summary.id}
                id={`summary-${summary.tokmon_conversation_id}`}
                className="hover:bg-indigo-200 cursor-pointer"
                onClick={() => router.push(`/conversation/${summary.tokmon_conversation_id}`)}
              >
                <td
                  className="border p-2 text-gray-700 whitespace-nowrap"
                  title={summary.updated_at.toString()}
                >{formatDate(summary.updated_at)}</td>
                <td
                  className="border p-2 whitespace-nowrap"
                  title={summary.monitored_program}
                  >
                    <p className="font-mono text-xs bg-indigo-100/30 text-black p-2 rounded-md">{getProgramInvocationStyled(summary.monitored_program)}</p>
                </td>
                <td className="border p-2">
                  <p className="text-sm bg-gray-300/20 p-2 rounded-md">{getLastMessageStyled(summary)}</p>
                </td>
                <td className="border p-2 text-center font-medium">${summary.total_cost}</td>
                <td className="border p-2 whitespace-nowrap text-center">{totalTokens(summary)}</td>
                <td
                  title={summary.tokmon_conversation_id}
                  className="border p-2 whitespace-nowrap"
                >
                  {summary.tokmon_conversation_id.substring(0, 20) + "..."}
                </td>
                <td className="border p-2 text-center">
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault();
                        deleteSummary(summary.tokmon_conversation_id)
                      }
                    }
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