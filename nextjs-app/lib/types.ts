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