'use client'

import { useState, useRef, useEffect } from 'react'
import { useFirebase } from '@/context/FirebaseContext'
import { Send, TreePine, Mic, MicOff, Volume2, Globe, Sparkles } from 'lucide-react'

const LANGUAGES = [
  { id: 'English', label: 'English' },
  { id: 'Luganda', label: 'Luganda (Central)' },
  { id: 'Lusoga', label: 'Lusoga (Eastern)' },
  { id: 'Runyankole', label: 'Runyankole (Western)' },
  { id: 'Acholi', label: 'Acholi (Northern)' },
  { id: 'Lugbara', label: 'Lugbara (West Nile)' },
]

export default function VillageElderChat() {
  const { messages, sendMessage, isGeneratingAI } = useFirebase()
  const [inputText, setInputText] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('English')
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const lastMsgIdRef = useRef<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
    
    const lastMsg = messages[messages.length - 1]
    if (lastMsg && lastMsg.sender === 'elder' && lastMsg.id !== lastMsgIdRef.current) {
      speakMessage(lastMsg.text, selectedLanguage)
      lastMsgIdRef.current = lastMsg.id
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        
        const getLangCode = (id: string) => {
          if (id === 'English') return 'en-UG'
          return 'en-UG'
        }
        
        recognitionRef.current.lang = getLangCode(selectedLanguage)
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInputText(transcript)
          setIsListening(false)
        }
        recognitionRef.current.onerror = () => setIsListening(false)
        recognitionRef.current.onend = () => setIsListening(false)
      }
    }
  }, [selectedLanguage])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      setInputText('')
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const speakMessage = async (text: string, language: string = 'English') => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isGeneratingAI) return
    sendMessage(inputText, selectedLanguage)
    setInputText('')
  }

  return (
    <div className="flex flex-col h-full max-h-[700px]">
      {/* Outer Title */}
      <div className="flex items-center gap-2 mb-4 px-2">
        <Sparkles size={18} className="text-leaf animate-pulse" />
        <h2 className="text-lg font-bold text-white tracking-tight">Agricultural Expert</h2>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col bg-[#051410]/80 backdrop-blur-xl rounded-[32px] border border-white/5 overflow-hidden shadow-2xl relative">
        
        {/* Inner Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-forest/20 flex items-center justify-center border border-forest/30 text-wheat shadow-inner">
              <TreePine size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Agricultural Expert</h3>
              <p className="text-[10px] text-leaf font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse" />
                Online · Professional Advice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative group/lang">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 text-wheat text-[10px] font-bold hover:bg-white/10 transition-all">
                <Globe size={12} />
                {selectedLanguage}
              </button>
              <div className="absolute top-full right-0 mt-2 w-40 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all z-50">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLanguage(lang.id)}
                    className={`w-full text-left px-4 py-2.5 text-[10px] hover:bg-forest transition-colors ${
                      selectedLanguage === lang.id ? 'bg-forest text-white' : 'text-wheat/60'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <TreePine size={64} className="text-wheat mb-4" />
              <p className="text-sm text-wheat font-medium max-w-[200px]">How can I assist your farming today?</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.sender === 'user' ? 'bg-forest/40' : 'bg-white/5'} p-4 rounded-2xl border border-white/5`}>
                  <p className="text-sm text-white/90 leading-relaxed">{msg.text}</p>
                  <div className="flex items-center justify-between mt-3 gap-4">
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{msg.metadata?.dialect || ''}</span>
                    <p className="text-[10px] text-white/20 font-mono">{msg.timestamp}</p>
                  </div>
                </div>
              </div>
            ))
          )}
          {isGeneratingAI && (
            <div className="flex justify-start">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-wheat/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-wheat/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-wheat/40 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-6 bg-white/[0.01] border-t border-white/5">
          <form onSubmit={handleSend} className="flex gap-3 items-center max-w-4xl mx-auto">
            <div className="relative flex-1 group">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask for agricultural advice..."}
                className="w-full bg-white/[0.03] border border-white/10 rounded-full px-6 py-4 text-sm text-white focus:outline-none focus:border-forest/50 focus:bg-white/[0.05] transition-all placeholder:text-white/20"
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isListening ? 'bg-alert text-white animate-pulse' : 'text-white/20 hover:text-white/40 hover:bg-white/5'
                }`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            </div>
            
            <button
              type="submit"
              disabled={!inputText.trim() || isGeneratingAI}
              className="w-12 h-12 rounded-full bg-forest/20 text-leaf flex items-center justify-center hover:bg-forest/40 transition-all active:scale-90 disabled:opacity-30 disabled:grayscale"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
