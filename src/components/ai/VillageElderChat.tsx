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
    <div className="flex flex-col h-[55vh] min-h-[360px] max-h-[700px] md:h-[65vh] nature-card overflow-hidden">
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
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} mb-4`}
          >
            <div className="flex items-end gap-2 max-w-[90%]">
              {msg.sender === 'elder' && (
                <div className="w-8 h-8 rounded-full bg-forest-light/20 flex items-center justify-center text-lg border border-forest-light/30 shadow-nature">
                  {msg.metadata?.icon || '👴'}
                </div>
              )}
              <div
                className={`p-3 rounded-2xl text-sm shadow-xl transition-all ${
                  msg.sender === 'user'
                    ? 'bg-forest text-wheat rounded-br-none border border-forest-light/30'
                    : 'bg-white/10 text-white/90 border border-white/10 rounded-bl-none backdrop-blur-md'
                }`}
              >
                {msg.sender === 'elder' && msg.metadata?.emotion && (
                  <div className="text-[10px] uppercase font-black tracking-widest text-leaf mb-1 opacity-60">
                    Detected: {msg.metadata.emotion}
                  </div>
                )}
                <p className="leading-relaxed font-medium">{msg.text}</p>
                
                {msg.metadata?.brief && (
                  <div className="mt-2 pt-2 border-t border-white/10 text-[10px] italic text-wheat/60">
                    "{msg.metadata.brief}"
                  </div>
                )}

                <div className="flex items-center justify-between mt-2 gap-4">
                  <span className="text-[9px] font-bold text-white/30 uppercase">{msg.metadata?.dialect || ''}</span>
                  <p className="text-[10px] opacity-40 font-mono">{msg.timestamp}</p>
                </div>
              </div>
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
