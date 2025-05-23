import ChatInterface from "@/components/ChatInterface";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat",
  description: "Chat with AI assistant",
};

// Next.js 15 requires specific parameter typing for page components
export default async function ChatPage({
  params,
}: {
  params: { chatid: string };
}) {
  const [authResult, convex] = await Promise.all([
    auth(),
    getConvexClient(),
  ]);

  const { userId } = authResult;
  const chatId = params.chatid as Id<"chats">;

  if (!userId) {
    redirect("/");
  }

  try {
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
