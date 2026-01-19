
"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { api } from "@/lib/api";

type Message = {
    role: "user" | "assistant";
    content: string;
};

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hi! How can I help you with the Lead-to-Cash system today?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setLoading(true);

        try {
            const res = await api.post("/ai/chat", { question: userMsg });
            setMessages(prev => [...prev, { role: "assistant", content: res.answer }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
                >
                    <MessageCircle className="h-6 w-6 text-white" />
                </Button>
            )}

            {isOpen && (
                <Card className={`shadow-2xl border-slate-200 flex flex-col transition-all duration-200 ${isMaximized
                        ? "fixed inset-4 w-auto h-auto m-0 z-[100]"
                        : "w-[450px] h-[600px]"
                    }`}>
                    <CardHeader className="bg-blue-600 text-white p-4 rounded-t-lg flex flex-row justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <Bot className="h-6 w-6" />
                            <span className="font-semibold text-lg">AI Assistant</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-blue-700 rounded-full"
                                onClick={() => setIsMaximized(!isMaximized)}
                            >
                                {isMaximized ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" /><path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-blue-700 rounded-full"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 p-4 overflow-y-auto bg-slate-50" ref={scrollRef}>
                        <div className="space-y-6">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[85%] rounded-lg p-4 text-base leading-relaxed shadow-sm ${msg.role === "user"
                                        ? "bg-blue-600 text-white rounded-br-none"
                                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-200 rounded-lg p-4 rounded-bl-none shadow-sm flex gap-1">
                                        <span className="animate-bounce">●</span>
                                        <span className="animate-bounce delay-75">●</span>
                                        <span className="animate-bounce delay-150">●</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="p-4 bg-white border-t rounded-b-lg shrink-0">
                        <form
                            className="flex w-full gap-3"
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        >
                            <Input
                                placeholder="Ask a question..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={loading}
                                className="flex-1 h-12 text-base"
                            />
                            <Button type="submit" size="icon" className="h-12 w-12" disabled={loading || !input.trim()}>
                                <Send className="h-5 w-5" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
