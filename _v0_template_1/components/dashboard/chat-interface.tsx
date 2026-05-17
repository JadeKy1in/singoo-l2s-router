"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

const mockMessages: Message[] = [
  {
    id: "1",
    role: "user",
    content: "Hi, I'm interested in your industrial automation solutions for our manufacturing plant in Germany.",
    timestamp: "10:23 AM"
  },
  {
    id: "2",
    role: "assistant",
    content: "Hello! Thank you for reaching out. I'd be happy to help you explore our industrial automation solutions. Could you tell me more about your manufacturing operations and what specific challenges you're looking to address?",
    timestamp: "10:24 AM"
  },
  {
    id: "3",
    role: "user",
    content: "We're looking for conveyor belt systems and robotic arm integrations. Our current setup handles about 500 units per hour but we need to scale to 1200.",
    timestamp: "10:26 AM"
  },
  {
    id: "4",
    role: "assistant",
    content: "That's a significant scaling requirement. Our L-Series conveyor systems paired with the RA-500 robotic arms can help you achieve throughput of up to 1500 units per hour. Would you like me to prepare a detailed proposal? I'll need some additional information about your facility dimensions and power specifications.",
    timestamp: "10:28 AM"
  },
  {
    id: "5",
    role: "user",
    content: "Yes, please. My name is Hans Mueller, I'm the Operations Director at Schmidt Manufacturing GmbH. You can reach me at hans.mueller@schmidt-mfg.de",
    timestamp: "10:30 AM"
  },
]

export function ChatInterface() {
  const [messages] = useState<Message[]>(mockMessages)
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/30">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Session ID: SES-001</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-medium text-emerald-400">Lead_Gen</span>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">会话 ID: SES-001</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>5 messages</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
          <span>Started 12 min ago</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "assistant" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-slate-800/50 border border-slate-700/50 text-foreground"
                  : "bg-blue-600/20 border border-blue-500/30 text-blue-100"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              <p className={`text-[10px] mt-2 ${
                message.role === "user" ? "text-muted-foreground" : "text-blue-400/70"
              }`}>
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card/30">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-foreground mb-1">Send Reply</label>
            <span className="text-[10px] text-muted-foreground mb-2">发送回复</span>
          </div>
          <div className="flex gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 min-h-[80px] resize-none bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
            />
            <Button className="self-end px-4 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Send className="w-4 h-4 mr-2" />
              <span>Send</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
