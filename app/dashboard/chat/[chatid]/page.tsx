import ChatInterface from "@/components/ChatInterface";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

interface ChatPageProps {
  params: {
    chatid: Id<"chats">; // Changed from chatId to chatid to match the URL parameter
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const chatId = params.chatid; // Changed from params.chatId to params.chatid
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  try {
    const convex = getConvexClient();

    const chat = await convex.query(api.chats.getChat, {
      id: chatId, // This was likely undefined before
      userId,
    });

    if (!chat) {
      redirect("/dashboard");
    }

    const initialMessages = await convex.query(api.messages.list, { chatId });

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
