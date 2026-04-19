'use client'

import { useState, useRef, useEffect } from 'react'
import { useFirebase } from '@/context/FirebaseContext'
import { Send, User, TreePine } from 'lucide-react'

export default function VillageElderChat() {
  const { messages, sendMessage, isGeneratingAI } = useFirebase()
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isGeneratingAI) return
    sendMessage(inputText)
    setInputText('')
  }

  return (
    <div className="flex flex-col h-[500px] nature-card overflow-hidden">
      {/* Header */}
      <div className="bg-forest/40 p-3 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-full bg-wheat/20 flex items-center justify-center border border-wheat/30">
          <TreePine className="text-wheat" size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Agricultural Expert</h3>
          <p className="text-[10px] text-safe font-medium">Online · Professional Advice</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/leaf.png')] bg-repeat opacity-90">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-leaf-sm text-sm shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-forest text-white rounded-br-none'
                  : 'bg-white/10 text-white/90 border border-white/10 rounded-bl-none'
              }`}
            >
              <p>{msg.text}</p>
              <p className="text-[10px] opacity-40 mt-1 text-right">{msg.timestamp}</p>
            </div>
          </div>
        ))}
        {isGeneratingAI && (
          <div className="flex justify-start">
            <div className="bg-white/10 text-white/90 p-3 rounded-leaf-sm border border-white/10 flex gap-1">
              <span className="w-1.5 h-1.5 bg-wheat rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-wheat rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-wheat rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer / Input */}
      <form onSubmit={handleSend} className="p-3 bg-black/20 border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask for agricultural advice..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-forest-light transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isGeneratingAI}
          className="w-10 h-10 rounded-full bg-forest text-wheat flex items-center justify-center hover:bg-forest-light transition-colors disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
