import ChatInterface from "@/components/ChatInterface";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

interface ChatPageProps {
  params: {
    chatid: string; // Changed type to string instead of Id<"chats">
  };
}

// Make this a Server Component that properly handles async operations
export default async function ChatPage({ params }: ChatPageProps) {
  // Use Promise.all to await all async operations in parallel for better performance
  const [authResult, convex] = await Promise.all([
    auth(),
    getConvexClient(),
  ]);

  const { userId } = authResult;
  const chatId = params.chatid as Id<"chats">; // Cast string to Convex ID type after params is processed

  if (!userId) {
    redirect("/");
  }

  try {
    // Use Promise.all again to parallelize these queries
    const [chat, initialMessages] = await Promise.all([
      convex.query(api.chats.getChat, {
        id: chatId,
        userId,
      }),
      convex.query(api.messages.list, { chatId }),
    ]);

    if (!chat) {
      redirect("/dashboard");
    }

    return (
      <div className="flex-1 overflow-hidden">
        <ChatInterface chatId={chatId} initialMessages={initialMessages} />
      </div>
    );
  } catch (error) {
    console.error("🔥 Error loading chat:", error);
    redirect("/dashboard");
  }
}
