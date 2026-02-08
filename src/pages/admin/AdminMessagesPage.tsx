import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Search, MessageSquare, User } from "lucide-react";
import AdminPageHeader from "@/components/layout/admin/AdminPageHeader";

const AdminMessagesPage = () => {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch conversation list (all users who have messaged)
    // Note: In a real app, you'd pagination and search. 
    // For now, we fetch all conversations via our helper.
    const conversations = useQuery(api.messages.listConversations) || [];

    // Fetch messages for selected user
    const messages = useQuery(api.messages.list, selectedUserId ? { userId: selectedUserId } : "skip");
    const sendMessage = useMutation(api.messages.send);
    const markAllRead = useMutation(api.messages.markAllRead);
    const archiveChat = useMutation(api.messages.archive);

    // Auto-scroll and Mark Read
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
        if (selectedUserId && messages && messages.length > 0) {
            markAllRead({ userId: selectedUserId, role: "admin" }).catch(console.error);
        }
    }, [messages, selectedUserId, markAllRead]);

    const handleEndChat = async () => {
        if (!selectedUserId) return;
        if (confirm("Are you sure you want to end this conversation? It will be archived.")) {
            await archiveChat({ userId: selectedUserId });
            setSelectedUserId(null); // Close view
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUserId) return;

        try {
            await sendMessage({
                body: newMessage,
                userId: selectedUserId,
                sender: "admin",
            });
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send:", error);
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <AdminPageHeader
                title="Messages"
                subtitle="Support and chat with customers in real-time."
                icon={MessageSquare}
            />

            <div className="flex-1 grid grid-cols-12 gap-6 mt-6 h-full min-h-0">
                {/* Left Sidebar: Conversation List */}
                <Card className="col-span-4 flex flex-col h-full border-gray-200 shadow-sm overflow-hidden bg-white">
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Search conversations..." className="pl-9 bg-gray-50 border-gray-200" />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="divide-y divide-gray-50">
                            {conversations.length === 0 ? (
                                <div className="p-8 text-center text-sm text-gray-500">
                                    No conversations yet.
                                </div>
                            ) : (
                                conversations.map((conv: any) => (
                                    <div
                                        key={conv.userId}
                                        onClick={() => setSelectedUserId(prev => prev === conv.userId ? null : conv.userId)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-start gap-3
                                            ${selectedUserId === conv.userId ? 'bg-primary-50 hover:bg-primary-50' : ''}`}
                                    >
                                        <Avatar className="h-10 w-10 border border-gray-100">
                                            <AvatarFallback className="text-xs bg-white text-gray-500">
                                                <User className="w-4 h-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className={`text-sm font-medium truncate ${selectedUserId === conv.userId ? 'text-primary-900' : 'text-gray-900'}`}>
                                                    User {conv.userId.slice(0, 8)}...
                                                </h4>
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className={`text-xs truncate ${selectedUserId === conv.userId ? 'text-primary-600' : 'text-gray-500'}`}>
                                                {conv.lastMessage}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Right Area: Chat Window */}
                <Card className="col-span-8 flex flex-col h-full border-gray-200 shadow-sm overflow-hidden bg-white">
                    {!selectedUserId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm">Select a conversation to start chatting.</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">U</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">User {selectedUserId}</h3>
                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                            Online
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleEndChat} className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                                    End Conversation
                                </Button>
                            </div>

                            {/* Messages Area */}
                            <ScrollArea className="flex-1 p-6 bg-slate-50/50">
                                <div className="space-y-4">
                                    {messages === undefined ? (
                                        <p className="text-center text-xs text-gray-400">Loading...</p>
                                    ) : (
                                        messages.map((msg: any) => {
                                            const isAdmin = msg.sender === "admin";
                                            return (
                                                <div
                                                    key={msg._id}
                                                    className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm
                                                        ${isAdmin
                                                            ? "bg-primary text-white rounded-br-none"
                                                            : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
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

                            {/* Input Area */}
                            <div className="p-4 border-t border-gray-100 bg-white">
                                <form onSubmit={handleSend} className="flex gap-3">
                                    <Input
                                        placeholder="Type your reply..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button type="submit" disabled={!newMessage.trim()}>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send
                                    </Button>
                                </form>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default AdminMessagesPage;
