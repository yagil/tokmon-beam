export type ChatMessage = {
  role: string;
  content: string;
}

export type UsageEntry = {
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
}

export type ChatRequest = {
  model: string;
  stream?: boolean;
  messages: ChatMessage[];
  temperature?: number;
}

export type ChatResponse = {
  model: string;
  usage: UsageEntry;
  messages: ChatMessage[];
}

//
// Example:
//
//  {
//    "gpt-4-0314": {
//      "prompt_cost": 0.03,
//      "completion_cost": 0.06,
//      "per_tokens": 1000
//    },
//    "gpt-3.5-turbo-0301": {
//      "prompt_cost": 0.002,
//      "completion_cost": 0.002,
//      "per_tokens": 1000
//    }
//  }
//
export type PricingData = {
  [key: string]: {
    prompt_cost: number;
    completion_cost: number;
    per_tokens: number;
  }
}