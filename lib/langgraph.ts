import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  trimMessages,
} from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import wxflows from "@wxflows/sdk/langchain";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import SYSTEM_MESSAGE from "@/constants/systemMessage";

// Validate required environment variables (server-side only)
if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error("Missing NEXT_PUBLIC_GEMINI_API_KEY in environment variables.");
}
if (!process.env.WXFLOWS_ENDPOINT) {
  throw new Error("Missing WXFLOWS_ENDPOINT in environment variables.");
}
if (!process.env.WXFLOWS_APIKEY) {
  throw new Error("Missing WXFLOWS_APIKEY in environment variables.");
}

// Trim the messages to manage conversation history
const trimmer = trimMessages({
  maxTokens: 10,
  strategy: "last",
  tokenCounter: (msgs) => msgs.length,
  includeSystem: true,
  allowPartial: false,
  startOn: "human",
});

// Connect to wxflows
const toolClient = new wxflows({
  endpoint: process.env.WXFLOWS_ENDPOINT || "",
  apikey: process.env.WXFLOWS_APIKEY,
});

// Retrieve the tools
const tools = await toolClient.lcTools;
const toolNode = new ToolNode(tools);

// Connect to the LLM provider with better tool instructions
const initialiseModel = () => {
  // Try different model names until one works
  const modelName = tryModelNames();
  
  const model = new ChatGoogleGenerativeAI({
    model: modelName,
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    temperature: 0.1,
    maxOutputTokens: 2048, // Reduced to help stay within quota limits
    streaming: true,
    callbacks: [
      {
        handleLLMStart: async () => {
          console.log("🤖 Starting LLM call");
        },
        handleLLMEnd: async (output) => {
          console.log("🤖 End LLM call");
          const usage = output.llmOutput?.usage;
          if (usage) {
            console.log("📊 Token Usage:", {
              input_tokens: usage.input_tokens,
              output_tokens: usage.output_tokens,
              total_tokens: usage.input_tokens + usage.output_tokens,
            });
          }
        },
        handleLLMError: async (err) => {
          console.error("🔴 LLM Error:", err);
        }
      },
    ],
  }).bindTools(tools);

  return model;
};

// Helper function to choose a model name based on compatibility
function tryModelNames() {
  // List of model names to try in order of preference
  const modelOptions = [
    "gemini-1.5-flash", 
    "gemini-1.0-pro-latest",
    "gemini-pro-vision", 
    "gemini-pro"
  ];
  
  // Log which model we're trying
  console.log("📝 Using Gemini model:", modelOptions[0]);
  
  // Return the first option by default
  return modelOptions[0]; 
}

// Define the function that determines whether to continue or not
function shouldContinue(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }

  // If the last message is a tool message, route back to agent
  if (lastMessage.content && lastMessage._getType() === "tool") {
    return "agent";
  }

  // Otherwise, we stop (reply to the user)
  return END;
}

// Define a new graph
const createWorkflow = () => {
  const model = initialiseModel();

  return new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state) => {
      // Create the system message content
      const systemContent = SYSTEM_MESSAGE;

      // Create the prompt template with system message and messages placeholder
      const promptTemplate = ChatPromptTemplate.fromMessages([
        new SystemMessage(systemContent, {
          cache_control: { type: "ephemeral" },
        }),
        new MessagesPlaceholder("messages"),
      ]);

      // Trim the messages to manage conversation history
      const trimmedMessages = await trimmer.invoke(state.messages);

      // Format the prompt with the current messages
      const prompt = await promptTemplate.invoke({ messages: trimmedMessages });

      // Get response from the model
      const response = await model.invoke(prompt);

      return { messages: [response] };
    })
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent");
};

// Simplified version of addCachingHeaders that minimizes token usage
function addCachingHeaders(messages: BaseMessage[]): BaseMessage[] {
  if (!messages.length) return messages;

  // Only keep a maximum of 5 most recent messages to reduce token usage
  const recentMessages = messages.length > 5 ? messages.slice(-5) : [...messages];
  
  // Create a deep copy of messages with sanitized content
  const cachedMessages = recentMessages.map((msg) => {
    // Create a new message with sanitized content
    const safeContent = typeof msg.content === "string" && msg.content.trim() 
      ? msg.content.trim() 
      : "Message content";
      
    if (msg instanceof HumanMessage) {
      return new HumanMessage(safeContent);
    } else if (msg instanceof AIMessage) {
      const aiMsg = new AIMessage(safeContent);
      if (msg.tool_calls) aiMsg.tool_calls = msg.tool_calls;
      return aiMsg;
    } else if (msg instanceof SystemMessage) {
      return new SystemMessage(safeContent);
    } else {
      const newMsg = new BaseMessage(safeContent);
      Object.assign(newMsg, { _getType: () => msg._getType() });
      return newMsg;
    }
  });

  // Add cache control to the last message
  if (cachedMessages.length > 0) {
    const lastMsg = cachedMessages[cachedMessages.length - 1];
    if (typeof lastMsg.content === "string") {
      lastMsg.content = [
        {
          type: "text",
          text: lastMsg.content || "Message content",
          cache_control: { type: "ephemeral" },
        }
      ];
    }
  }

  return cachedMessages;
}

// Simple exponential backoff function for retrying after rate limits
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function submitQuestion(messages: BaseMessage[], chatId: string) {
  if (!messages || messages.length === 0) {
    throw new Error("No messages provided for submission");
  }

  // Add caching headers to messages
  const cachedMessages = addCachingHeaders(messages);

  // Create workflow with chatId and onToken callback
  const workflow = createWorkflow();

  // Create a checkpoint to save the state of the conversation
  const checkpointer = new MemorySaver();
  const app = workflow.compile({ checkpointer });

  // Set up retry logic
  let retries = 0;
  const maxRetries = 3;
  
  while (true) {
    try {
      const stream = await app.streamEvents(
        { messages: cachedMessages },
        {
          version: "v2",
          configurable: { thread_id: chatId },
          streamMode: "messages",
          runId: chatId,
        }
      );
      return stream;
    } catch (error: any) {
      console.error("🚨 Error streaming events:", error);
      
      // Check if this is a rate limit error
      if (retries < maxRetries && 
          error?.message?.includes("429") && 
          error?.message?.includes("Too Many Requests")) {
        
        retries++;
        const delay = Math.pow(2, retries) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`⏳ Rate limited. Retrying in ${delay/1000}s... (Attempt ${retries} of ${maxRetries})`);
        await sleep(delay);
        continue;
      }
      
      // If not a rate limit error or we've exhausted retries, re-throw
      throw new Error(`Failed to get response: ${error?.message || "Unknown error"}`);
    }
  }
}