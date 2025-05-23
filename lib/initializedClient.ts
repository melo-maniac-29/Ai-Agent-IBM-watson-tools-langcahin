import wxflows from "@wxflows/sdk/langchain";

// Define proper types for tools
type WxFlowsTool = {
  name: string;
  description: string;
  // Add other properties that wxflows tools have
  [key: string]: unknown;
};

// Function to initialize the WxFlows client and get tools
let toolsPromise: Promise<WxFlowsTool[]> | null = null;

export function getWxFlowsTools() {
  if (!toolsPromise) {
    toolsPromise = initTools();
  }
  return toolsPromise;
}

async function initTools(): Promise<WxFlowsTool[]> {
  try {
    // Connect to wxflows
    const toolClient = new wxflows({
      endpoint: process.env.WXFLOWS_ENDPOINT || "",
      apikey: process.env.WXFLOWS_APIKEY || "",
    });

    // Retrieve and return the tools
    return await toolClient.lcTools;
  } catch (error) {
    console.error("Error initializing WxFlows tools:", error);
    throw error;
  }
}
