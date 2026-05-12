'use client'

import { useState, useRef, useEffect } from 'react'
import { useFirebase } from '@/context/FirebaseContext'
import { Send, TreePine, Mic, MicOff, Volume2, Globe, Sparkles, Image as ImageIcon, Video, Search, Lightbulb, Paperclip, Loader2 } from 'lucide-react'

const LANGUAGES = [
  { id: 'English', label: 'English' },
  { id: 'Luganda', label: 'Luganda (Central)' },
  { id: 'Lusoga', label: 'Lusoga (Eastern)' },
  { id: 'Runyankole', label: 'Runyankole (Western)' },
  { id: 'Acholi', label: 'Acholi (Northern)' },
  { id: 'Lugbara', label: 'Lugbara (West Nile)' },
]

const QUICK_ACTIONS = [
  { id: 'analyze', icon: <ImageIcon size={18} />, label: 'Analyze Crop', color: 'bg-safe/10 text-safe' },
  { id: 'weather', icon: <Sparkles size={18} />, label: 'Climate Advice', color: 'bg-wheat/10 text-wheat' },
  { id: 'market', icon: <Search size={18} />, label: 'Market Prices', color: 'bg-rain/10 text-rain' },
  { id: 'video', icon: <Video size={18} />, label: 'Farming Tips', color: 'bg-forest-light/10 text-forest-light' },
]

export default function VillageElderChat() {
  const { messages, sendMessage, isGeneratingAI, user } = useFirebase()
  const [inputText, setInputText] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('English')
  const [isListening, setIsListening] = useState(false)
  const [activeTab, setActiveTab] = useState<'ask' | 'imagine'>('ask')
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
          if (id === 'Luganda') return 'lug-UG'
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
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural'))
      if (preferredVoice) utterance.voice = preferredVoice
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isGeneratingAI) return
    sendMessage(inputText, selectedLanguage)
    setInputText('')
  }

  const getTimeGreeting = () => {
    const hours = new Date().getHours()
    if (hours < 12) return 'morning'
    if (hours < 18) return 'afternoon'
    return 'evening'
  }

  return (
    <div className="flex flex-col h-[75vh] md:h-[80vh] bg-black/10 backdrop-blur-xl rounded-[40px] border border-white/10 overflow-hidden relative transition-all duration-500 shadow-2xl group/chat">
      {/* Top Navbar */}
      <div className="p-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-full border border-white/5 shadow-inner">
          <button 
            onClick={() => setActiveTab('ask')}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 ${activeTab === 'ask' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            Ask
          </button>
          <button 
            onClick={() => setActiveTab('imagine')}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 ${activeTab === 'imagine' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            Imagine
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group/lang">
            <button className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full border border-white/10 text-wheat hover:bg-white/10 transition-all">
              <Globe size={18} />
            </button>
            <div className="absolute top-full right-0 mt-2 w-48 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all z-[50]">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id)}
                  className={`w-full text-left px-4 py-3 text-xs hover:bg-forest transition-colors ${
                    selectedLanguage === lang.id ? 'bg-forest text-white' : 'text-wheat/60'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 hover:scale-110 transition-transform cursor-pointer">
            <Sparkles className="text-wheat" size={18} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 relative z-10 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-12 animate-in fade-in zoom-in duration-1000">
            {/* Minimalist Logo */}
            <div className="relative group/logo">
              <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center bg-white/5 relative z-10 transition-all duration-500 group-hover/logo:scale-110 group-hover/logo:border-wheat/30">
                <TreePine className="text-wheat/60" size={40} />
              </div>
              <div className="absolute inset-0 w-24 h-24 bg-wheat/10 rounded-full blur-3xl animate-pulse" />
            </div>

            <div className="space-y-3 max-w-lg">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-tight">
                Good {getTimeGreeting()}, {user?.displayName?.split(' ')[0] || 'Farmer'}.
              </h1>
              <p className="text-xl text-white/30 font-medium tracking-tight">
                How can I help you grow today?
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4 overflow-x-auto pb-4 w-full justify-center scrollbar-hide px-4">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.id}
                  className="flex items-center gap-3 px-6 py-4 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all hover:scale-105 active:scale-95 shrink-0 shadow-lg group/action"
                >
                  <div className={`w-10 h-10 rounded-2xl ${action.color} flex items-center justify-center shadow-xl transition-transform group-hover/action:rotate-6`}>
                    {action.icon}
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-widest">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8 py-10 pb-40 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                <div className={`max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-6 rounded-[36px] text-base leading-relaxed ${
                    msg.sender === 'user' 
                    ? 'bg-forest text-white shadow-2xl rounded-br-none border border-forest-light/20 font-medium' 
                    : 'bg-white/5 text-white/90 border border-white/10 rounded-bl-none backdrop-blur-3xl'
                  }`}>
                    {msg.sender === 'elder' && msg.metadata?.emotion && (
                      <div className="text-[9px] uppercase font-black tracking-[0.2em] text-wheat/40 mb-3 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-wheat/40" />
                        {msg.metadata.emotion}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    
                    {msg.sender === 'elder' && (
                      <div className="flex items-center gap-4 mt-5 pt-5 border-t border-white/5">
                        <button 
                          onClick={() => speakMessage(msg.text, selectedLanguage)}
                          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-wheat transition-all active:scale-90"
                        >
                          <Volume2 size={16} />
                        </button>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.1em]">{msg.metadata?.dialect || 'Village Elder'}</span>
                          <span className="text-[8px] text-white/20 font-mono">{msg.timestamp}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isGeneratingAI && (
              <div className="flex justify-start">
                <div className="bg-white/5 p-5 rounded-[32px] border border-white/10 flex gap-2 items-center backdrop-blur-xl">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-wheat rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-wheat rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-wheat rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-2">Elder is thinking</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Modern Futuristic Input Bar */}
      <div className="absolute bottom-10 left-0 right-0 px-6 z-30">
        <form 
          onSubmit={handleSend}
          className="max-w-3xl mx-auto bg-black/60 backdrop-blur-[60px] border border-white/10 rounded-[44px] p-2 flex flex-col shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative group transition-all duration-500 hover:border-white/20"
        >
          <div className="flex items-center gap-2 px-6 py-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e as any)
                }
              }}
              placeholder={isListening ? "Listening clearly..." : "What do you want to know?"}
              className="flex-1 bg-transparent border-none text-white text-lg focus:ring-0 resize-none min-h-[52px] py-3 placeholder:text-white/20 scrollbar-hide font-medium"
              rows={1}
            />
          </div>

          <div className="flex items-center justify-between p-2 mt-1 border-t border-white/5">
            <div className="flex items-center gap-1">
              <button type="button" className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-all rounded-full hover:bg-white/5">
                <Paperclip size={20} />
              </button>
              <div className="h-8 w-[1px] bg-white/10 mx-2" />
              <button type="button" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/60 uppercase tracking-widest hover:bg-white/10 transition-all shadow-lg">
                <Lightbulb size={16} className="text-wheat" />
                Expert
              </button>
              <button type="button" className="flex items-center gap-2 px-5 py-2.5 rounded-full hover:bg-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest transition-all">
                Think
              </button>
            </div>

            <div className="flex items-center gap-3 pr-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                  isListening ? 'bg-alert text-white animate-pulse shadow-[0_0_20px_rgba(231,76,60,0.4)]' : 'text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                {isListening ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <button
                type="submit"
                disabled={!inputText.trim() || isGeneratingAI}
                className={`flex items-center gap-3 px-8 py-3.5 rounded-full font-black text-[12px] uppercase tracking-[0.15em] transition-all duration-300 ${
                  inputText.trim() && !isGeneratingAI 
                  ? 'bg-white text-black shadow-2xl hover:scale-105 active:scale-95' 
                  : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                }`}
              >
                {isGeneratingAI ? <Loader2 size={18} className="animate-spin" /> : (
                  <>
                    <Volume2 size={18} />
                    Speak
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
        {activeTab === 'imagine' && (
          <div className="mt-6 text-center animate-in fade-in duration-700">
            <p className="text-[10px] text-wheat/40 font-black uppercase tracking-[0.3em] cursor-pointer hover:text-wheat/60 transition-colors">Switch to Personas</p>
          </div>
        )}
      </div>
    </div>
  )
}
