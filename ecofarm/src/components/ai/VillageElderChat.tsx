'use client'

import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
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
  const { messages, sendMessage, isGeneratingAI, language, setLanguage, t } = useApp()
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const lastMsgIdRef = useRef<string | null>(null)

  const LANGUAGES = [
    { id: 'English', label: 'English' },
    { id: 'Luganda', label: 'Luganda' },
    { id: 'Lusoga', label: 'Lusoga' },
    { id: 'Runyankole', label: 'Runyankole' },
    { id: 'Acholi', label: 'Acholi' },
    { id: 'Swahili', label: 'Swahili' },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
    
    const lastMsg = messages[messages.length - 1]
    if (lastMsg && lastMsg.sender === 'elder' && lastMsg.id !== lastMsgIdRef.current) {
      speakMessage(lastMsg.text, language)
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
        
        recognitionRef.current.lang = getLangCode(language)
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInputText(transcript)
          setIsListening(false)
        }
        recognitionRef.current.onerror = () => setIsListening(false)
        recognitionRef.current.onend = () => setIsListening(false)
      }
    }
  }, [language])

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
    sendMessage(inputText, language)
    setInputText('')
  }

  return (
    <div className="flex flex-col h-full max-h-[700px] pb-12">
      {/* Outer Title */}
      <div className="flex items-center gap-2 mb-3 px-1 border-b border-border-soft pb-4">
        <Sparkles size={20} className="text-forest animate-pulse" />
        <h2 className="font-display font-bold text-4xl text-ink tracking-tight">Agricultural Expert</h2>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-border-soft overflow-hidden shadow-card-sm relative mt-2">
        
        {/* Inner Header */}
        <div className="p-4 flex items-center justify-between border-b border-border-soft bg-bone-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center border border-forest/20 text-forest shadow-inner">
              <TreePine size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-ink leading-tight">{t('chat.expert')}</h3>
              <p className="font-body text-[10px] text-forest font-bold flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
                <span>Online · Professional Advice</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative group/lang">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-border-soft text-ink-muted text-[10px] font-bold hover:text-ink shadow-sm transition-all">
                <Globe size={12} />
                <span>{language}</span>
              </button>
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-border-soft rounded-xl overflow-hidden shadow-lg opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all z-50">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id as any)}
                    className={`w-full text-left px-4 py-2.5 font-body text-xs font-bold transition-colors ${
                      language === lang.id ? 'bg-forest text-white' : 'text-ink-muted hover:bg-bone-low hover:text-ink'
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-bone-low/30">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <TreePine size={48} className="text-forest mb-3" />
              <p className="font-body text-xs text-ink-muted font-bold max-w-[200px]">How can I assist your farming today?</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.sender === 'user' ? 'bg-forest text-white' : 'bg-bone-low text-ink'} p-4 rounded-2xl border border-border-soft shadow-sm`}>
                  <p className="font-body text-xs leading-relaxed">{msg.text}</p>
                  <div className="flex items-center justify-between mt-2 gap-4">
                    <span className="font-body text-[9px] font-bold opacity-60 uppercase tracking-widest">{msg.metadata?.dialect || ''}</span>
                    <p className="font-body text-[9px] font-bold opacity-40">{msg.timestamp}</p>
                  </div>
                </div>
              </div>
            ))
          )}
          {isGeneratingAI && (
            <div className="flex justify-start">
              <div className="bg-bone-low p-3 rounded-2xl border border-border-soft flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-border-soft">
          <form onSubmit={handleSend} className="flex gap-2 items-center max-w-4xl mx-auto">
            <div className="relative flex-1 group">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? "Listening..." : t('chat.ask_elder')}
                className="w-full bg-bone-low border border-border-soft rounded-xl pl-4 pr-10 py-3 font-body text-xs text-ink focus:outline-none focus:border-forest shadow-inner transition-all placeholder:text-ink-faint"
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isListening ? 'bg-alert text-white animate-pulse' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
            </div>
            
            <button
              type="submit"
              disabled={!inputText.trim() || isGeneratingAI}
              className="btn-primary py-3 px-4 text-xs shrink-0 flex items-center justify-center"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
