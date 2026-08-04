'use client'

import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { Mic, MicOff, Plus, ChevronDown, ArrowUp, Sparkles, User } from 'lucide-react'

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

  const renderInputForm = () => (
    <form onSubmit={handleSend} className="w-full max-w-3xl bg-white rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 p-2 flex items-center gap-1 md:gap-2 relative z-10">
      <button type="button" className="p-2 md:p-3 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50 flex-shrink-0">
        <Plus size={20} />
      </button>
      
      <input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={isListening ? "Listening..." : "Ask the Agricultural Expert..."}
        className="flex-1 bg-transparent border-none focus:ring-0 text-sm md:text-base text-[#1f1f1f] placeholder-gray-400 outline-none min-w-0 px-2"
      />
      
      <div className="relative group/lang flex items-center gap-1.5 px-2 md:px-3 py-1.5 hover:bg-gray-50 rounded-full cursor-pointer transition-colors text-xs font-medium text-gray-600 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        <span className="hidden md:inline">{language}</span>
        <ChevronDown size={14} className="opacity-50" />
        
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xl opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all z-50">
          {LANGUAGES.map(lang => (
            <button
              key={lang.id}
              type="button"
              onClick={() => setLanguage(lang.id as any)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                language === lang.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={toggleListening}
        className={`p-2 md:p-3 rounded-full transition-colors flex-shrink-0 ${
          isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        }`}
      >
        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
      </button>
      
      <button
        type="submit"
        disabled={!inputText.trim() || isGeneratingAI}
        className={`p-2 md:p-2.5 rounded-full transition-all flex items-center justify-center flex-shrink-0 ${
          inputText.trim() ? 'bg-[#d3e3fd] text-[#0b57d0] hover:bg-[#c2d7fa]' : 'bg-gray-100 text-gray-400'
        }`}
      >
        <ArrowUp size={20} />
      </button>
    </form>
  )

  return (
    <div className="flex flex-col h-full absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#eef4fc] via-white to-white overflow-hidden">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="text-3xl md:text-[40px] text-[#1f1f1f] mb-8 font-light tracking-tight" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
            Ready when you are
          </h2>
          {renderInputForm()}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 md:px-20 lg:px-40 pb-8 pt-8 scrollbar-hide space-y-8">
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start gap-4'}`}>
                  {msg.sender === 'elder' && (
                    <div className="w-8 h-8 rounded-full bg-[#f0f4f9] flex items-center justify-center text-blue-500 shrink-0 mt-1 border border-gray-100">
                      <Sparkles size={16} />
                    </div>
                  )}
                  <div className={`max-w-[85%] ${msg.sender === 'user' ? 'bg-[#f0f4f9] text-[#1f1f1f] px-5 py-3.5 rounded-3xl rounded-tr-sm' : 'text-[#1f1f1f] pt-2'}`}>
                    <p className="font-body text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isGeneratingAI && (
                <div className="flex justify-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#f0f4f9] flex items-center justify-center text-blue-500 shrink-0 mt-1 border border-gray-100">
                    <Sparkles size={16} className="animate-spin" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 pt-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="p-4 md:pb-8 flex justify-center bg-gradient-to-t from-white via-white to-transparent">
            {renderInputForm()}
          </div>
        </>
      )}
    </div>
  )
}
