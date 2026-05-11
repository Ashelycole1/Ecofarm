import { useState, useRef, useEffect } from 'react'
import { useFirebase } from '@/context/FirebaseContext'
import { Send, User, TreePine, Mic, MicOff, Volume2, Globe } from 'lucide-react'

const LANGUAGES = [
  { id: 'English', label: 'English' },
  { id: 'Luganda', label: 'Luganda (Central)' },
  { id: 'Lusoga', label: 'Lusoga (Eastern)' },
  { id: 'Runyankole', label: 'Runyankole (Western)' },
  { id: 'Acholi', label: 'Acholi (Northern)' },
  { id: 'Lugbara', label: 'Lugbara (West Nile)' },
]

export default function VillageElderChat() {
  const { messages, sendMessage, isGeneratingAI, generateOpenAIVoice } = useFirebase()
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
    
    // Auto-speak the last message if it's from the elder and hasn't been spoken
    const lastMsg = messages[messages.length - 1]
    if (lastMsg && lastMsg.sender === 'elder' && lastMsg.id !== lastMsgIdRef.current) {
      speakMessage(lastMsg.text)
      lastMsgIdRef.current = lastMsg.id
    }
  }, [messages])

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        
        // Map selected language to best available recognition code
        const getLangCode = (id: string) => {
          if (id === 'English') return 'en-UG'
          if (id === 'Luganda') return 'lug-UG' // Might not be supported, will fallback to en-UG
          return 'en-UG'
        }
        
        recognitionRef.current.lang = getLangCode(selectedLanguage)

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInputText(transcript)
          setIsListening(false)
        }

        recognitionRef.current.onerror = () => {
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
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

  const speakMessage = async (text: string) => {
    // 1. Try OpenAI High-Quality Voice (Elder tone)
    try {
      const audioUrl = await generateOpenAIVoice(text)
      if (audioUrl) {
        const audio = new Audio(audioUrl)
        audio.play()
        return
      }
    } catch (e) {
      console.warn('OpenAI Voice unavailable, falling back to browser TTS')
    }

    // 2. Fallback to Browser Speech Synthesis
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

  return (
    <div className="flex flex-col h-[60vh] sm:h-[55vh] min-h-[400px] max-h-[800px] md:h-[65vh] nature-card overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="bg-forest/40 p-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-wheat/20 flex items-center justify-center border border-wheat/30">
            <TreePine className="text-wheat" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Village Elder</h3>
            <p className="text-[10px] text-safe font-medium">Online · Expert Advisory</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative group/lang">
            <button className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-wheat text-[10px] font-bold hover:bg-white/10 transition-all">
              <Globe size={12} />
              {selectedLanguage}
            </button>
            <div className="absolute top-full right-0 mt-1 w-40 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all z-[1001]">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id)}
                  className={`w-full text-left px-3 py-2 text-[10px] hover:bg-forest transition-colors ${
                    selectedLanguage === lang.id ? 'bg-forest text-white' : 'text-wheat/60'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => window.speechSynthesis.cancel()}
            className="text-white/30 hover:text-white/60 p-2"
            title="Stop Audio"
          >
            <Volume2 size={16} />
          </button>
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
                <div className="flex flex-col gap-2 items-center">
                  <div className="w-8 h-8 rounded-full bg-forest-light/20 flex items-center justify-center text-lg border border-forest-light/30 shadow-nature">
                    {msg.metadata?.icon || '👴'}
                  </div>
                  <button 
                    onClick={() => speakMessage(msg.text)}
                    className="p-1.5 rounded-full bg-wheat/10 text-wheat hover:bg-wheat/20 transition-all shadow-sm"
                    title="Listen to Elder"
                  >
                    <Volume2 size={12} />
                  </button>
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
                    &quot;{msg.metadata.brief}&quot;
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
      <div className="p-3 bg-black/20 border-t border-white/10">
        <form onSubmit={handleSend} className="flex gap-2">
          <button
            type="button"
            onClick={toggleListening}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 ${
              isListening ? 'bg-alert text-white animate-pulse shadow-[0_0_15px_rgba(231,76,60,0.5)]' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {isListening ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening..." : "Ask in " + selectedLanguage + "..."}
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-forest-light transition-colors placeholder:text-white/20"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isGeneratingAI}
            className="w-12 h-12 rounded-full bg-forest text-wheat flex items-center justify-center hover:bg-forest-light transition-all active:scale-90 disabled:opacity-50 shrink-0"
          >
            <Send size={20} />
          </button>
        </form>
        {isListening && (
          <p className="text-[9px] text-wheat/40 mt-2 text-center uppercase tracking-widest font-black">
            Speak clearly to the Elder
          </p>
        )}
      </div>
    </div>
  )
}
