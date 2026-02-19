import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, X, MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";


interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am ur freight assistant. Ask me about shipments, metrics, or documents.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {

    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const chatAction = useAction(api.ai.intelligentChat);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        const newMessages = [...messages, { role: 'user', content: userMsg }] as Message[];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const result = await chatAction({
                messages: newMessages.map(m => ({ role: m.role, content: m.content }))
            });

            setMessages(prev => [...prev, { role: 'assistant', content: result.content }]);
        } catch (error: any) {
            console.error("AI Error Details:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message || "Connection failed"}.` }]);
            toast.error("Failed to connect to the Freight Brain");
        } finally {
            setLoading(false);
        }
    };


    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const assistantUi = (
        <div className="fixed bottom-6 right-6 z-[9999]" ref={containerRef}>
            {isOpen ? (
                <div className="bg-white rounded-xl shadow-2xl w-80 md:w-96 flex flex-col h-[500px] transition-all duration-200 ease-in-out">

                    {/* Header */}
                    <div className="p-4 bg-[#003057] text-white rounded-t-xl flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <Sparkles className="h-5 w-5" />
                            <span className="font-semibold">Freight Assistant</span>
                        </div>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${m.role === 'user'
                                    ? 'bg-[#003057] text-white rounded-br-none'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 rounded-bl-none shadow-sm flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-[#003057] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-[#003057] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-[#003057] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t bg-white rounded-b-xl">
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex space-x-2">
                            <Input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Ask about shipments..."
                                className="flex-1 border-gray-300 focus:border-[#003057]"
                                disabled={loading}
                            />
                            <Button type="submit" size="icon" className="bg-[#003057] hover:opacity-90" disabled={loading || !input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>

                </div>
            ) : (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="rounded-full w-14 h-14 bg-[#003057] hover:opacity-90 shadow-lg flex items-center justify-center transition-transform hover:scale-105"
                >
                    <MessageSquare className="h-10 w-10 text-white" />
                </Button>
            )}
        </div>
    );

    if (typeof document === "undefined") {
        return assistantUi;
    }

    return createPortal(assistantUi, document.body);
}
