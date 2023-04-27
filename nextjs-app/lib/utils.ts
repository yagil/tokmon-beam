import { ChatExchange } from "@prisma/client";
import { ChatMessage, ChatResponse } from "./types";

// Number of digits after the decimal point to show
// The lowest cost of a single token is $0.002 / 1000 = $0.000002
export const FRACTION_DIGITS = 6;

export function formatDate(date: Date): string {  
    if (date == null) {
      return "<Date is null>";
    }
    
    const now = new Date();
    const delta = now.getTime() - new Date(date).getTime();
    const secondsInMs = 1000;
    const minutesInMs = 60 * secondsInMs;
    const hoursInMs = 60 * minutesInMs;
    const daysInMs = 24 * hoursInMs;
    const weeksInMs = 7 * daysInMs;
  
    if (delta < weeksInMs) {
      const days = Math.floor(delta / daysInMs);
      if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
      }
  
      const hours = Math.floor(delta / hoursInMs);
      if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      }
  
      const minutes = Math.floor(delta / minutesInMs);
      if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      }
  
      const seconds = Math.floor(delta / secondsInMs);
      return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
    }

    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  export function getLastMessageInChatExchanges(chatExchanges: ChatExchange[]): ChatMessage|null {
    if (chatExchanges.length === 0) {
      return null;
    }
    
    const lastExchange = chatExchanges.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    })[0];

    const response = lastExchange.response as ChatResponse;
    if (response.messages.length > 0) {
      const lastMessage = response.messages[response.messages.length - 1];
      return lastMessage;
    }
    return null;
  }

export const colorForModel = (model: string) => {
  if (model.startsWith("gpt-3.5")) return "bg-blue-400/20";
  if (model.startsWith("gpt-4")) return "bg-fuchsia-400/20";
  return "bg-gray-200/40";
}