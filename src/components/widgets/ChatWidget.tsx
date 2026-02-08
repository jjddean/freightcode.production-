import React, { useState, useEffect, useRef } from "react";
import { Send, User, ShieldCheck, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function ChatWidget() {
    const { user } = useUser();
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Convex Hooks
    // We use the clerk user ID as the conversation ID
    const userId = user?.id;
    const messages = useQuery(api.messages.list, userId ? { userId } : "skip");
    const sendMessage = useMutation(api.messages.send);
    const markAllRead = useMutation(api.messages.markAllRead);
    const archiveChat = useMutation(api.messages.archive);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
        // Mark as read when widget is open and messages load
        if (userId && messages && messages.length > 0) {
            markAllRead({ userId, role: "user" }).catch(console.error);
        }
    }, [messages, userId, markAllRead]);

    const handleEndChat = async () => {
        if (!userId) return;
        try {
            await archiveChat({ userId });
        } catch (e) {
            console.error(e);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userId) return;

        try {
            await sendMessage({
                body: newMessage,
                userId: userId,
                sender: "user",
            });
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    if (!user) return <div className="p-4 text-center text-sm text-gray-500">Please log in to chat.</div>;

    return (
        <Card className="w-[350px] h-[450px] flex flex-col border-0 shadow-none">
            <div className="p-3 border-b border-gray-100 bg-primary/5 flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold text-sm">Support Chat</h3>
                    <p className="text-xs text-muted-foreground">We typically reply in minutes.</p>
                </div>
                {messages && messages.length > 0 && (
                    <Button variant="ghost" size="icon" className="ml-auto h-7 w-7 text-muted-foreground hover:text-red-500" onClick={handleEndChat} title="End Conversation">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages === undefined ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-xs text-gray-400 mt-10">
                            <p>No messages yet.</p>
                            <p>Ask us anything about your shipments!</p>
                        </div>
                    ) : (
                        messages.map((msg: any) => {
                            const isMe = msg.sender === "user";
                            return (
                                <div
                                    key={msg._id}
                                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isMe
                                            ? "bg-primary text-white rounded-br-none"
                                            : "bg-gray-100 text-gray-800 rounded-bl-none"
                                            }`}
                                    >
                                        {msg.body}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <div className="p-3 border-t border-gray-100">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 h-9 text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-9 w-9 bg-primary hover:bg-primary/90"
                        disabled={!newMessage.trim()}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </Card>
    );
}
