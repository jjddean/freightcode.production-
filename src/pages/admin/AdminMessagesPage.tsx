import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useStickyQueryData } from '@/hooks/useStickyQueryData';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Search, MessageSquare, User, Archive } from "lucide-react";
import AdminPageHeader from "@/components/layout/admin/AdminPageHeader";

const AdminMessagesPage = () => {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const conversationsQuery = useQuery(api.messages.listConversations);
    const conversations = useStickyQueryData("admin:messages:conversations", conversationsQuery, []);

    const messagesQuery = useQuery(api.messages.list, selectedUserId ? { userId: selectedUserId } : "skip");
    const messages = useStickyQueryData(`admin:messages:thread:${selectedUserId ?? "none"}`, messagesQuery, []);
    const sendMessage = useMutation(api.messages.send);
    const markAllRead = useMutation(api.messages.markAllRead);
    const archiveChat = useMutation(api.messages.archive);

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
            setSelectedUserId(null);
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
        <div className="h-[calc(100vh-140px)] flex flex-col">
            <AdminPageHeader
                title="Messages & Support"
                subtitle="Live customer chat and assistance."
                icon={MessageSquare}
            />

            <div className="flex-1 grid grid-cols-12 gap-4 mt-4 min-h-0 overflow-hidden">
                {/* Left Sidebar: Conversation List */}
                <Card className="col-span-4 flex flex-col border-slate-100 shadow-sm overflow-hidden bg-white">
                    <div className="p-3 border-b border-slate-50">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input placeholder="Search..." className="pl-8 h-8 text-xs bg-slate-50 border-slate-200" />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="divide-y divide-slate-50">
                            {conversations.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-400">
                                    No conversations.
                                </div>
                            ) : (
                                conversations.map((conv: any) => (
                                    <div
                                        key={conv.userId}
                                        onClick={() => setSelectedUserId(prev => prev === conv.userId ? null : conv.userId)}
                                        className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors flex items-start gap-2.5
                                            ${selectedUserId === conv.userId ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <Avatar className="h-8 w-8 border border-slate-100">
                                            <AvatarFallback className="text-[10px] bg-slate-50 text-slate-500">
                                                <User className="w-3.5 h-3.5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h4 className={`text-[11px] font-bold truncate ${selectedUserId === conv.userId ? 'text-blue-900' : 'text-slate-900'}`}>
                                                    {conv.userId.slice(0, 8)}...
                                                </h4>
                                                <span className="text-[9px] text-slate-400 font-bold">
                                                    {new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className={`text-[10px] truncate ${selectedUserId === conv.userId ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
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
                <Card className="col-span-8 flex flex-col border-slate-100 shadow-sm overflow-hidden bg-white">
                    {!selectedUserId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                            <MessageSquare className="w-10 h-10 mb-2 opacity-10" />
                            <p className="text-[11px] font-bold uppercase tracking-tight">Select conversation</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-3 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                                <div className="flex items-center gap-2.5">
                                    <Avatar className="h-7 w-7 border border-white shadow-sm">
                                        <AvatarFallback className="text-[10px] font-bold">U</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-[11px] font-bold text-slate-900">{selectedUserId}</h3>
                                        <div className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 uppercase tracking-tighter">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                            Active Session
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleEndChat}
                                    className="h-7 px-2.5 text-[10px] font-bold uppercase tracking-tight bg-white border-red-100 text-red-500 hover:bg-red-50"
                                >
                                    <Archive className="h-3 w-3 mr-1.5" />
                                    Archive
                                </Button>
                            </div>

                            {/* Messages Area */}
                            <ScrollArea className="flex-1 p-4 bg-slate-50/30">
                                <div className="space-y-3">
                                    {messagesQuery === undefined && messages.length === 0 ? (
                                        <p className="text-center text-[10px] text-slate-400">Syncing...</p>
                                    ) : (
                                        messages.map((msg: any) => {
                                            const isAdmin = msg.sender === "admin";
                                            return (
                                                <div
                                                    key={msg._id}
                                                    className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs shadow-sm
                                                        ${isAdmin
                                                            ? "bg-slate-900 text-white rounded-br-none"
                                                            : "bg-white text-slate-800 border border-slate-100 rounded-bl-none font-medium"
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
                            <div className="p-3 border-t border-slate-50 bg-white">
                                <form onSubmit={handleSend} className="flex gap-2">
                                    <Input
                                        placeholder="Type reply..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="flex-1 h-9 text-xs border-slate-200"
                                    />
                                    <Button type="submit" disabled={!newMessage.trim()} size="sm" className="h-9 px-4 bg-slate-900 hover:bg-slate-800">
                                        <Send className="w-3.5 h-3.5 mr-1.5" />
                                        <span className="text-[11px] font-bold uppercase tracking-tight">Send</span>
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
