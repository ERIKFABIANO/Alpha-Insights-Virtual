import { createContext, useState, type ReactNode } from "react"
import { chat } from "../config/gemini"

export const Context = createContext<any>(null);

interface ContextProviderProps {
  children: ReactNode;
}

// Types must be declared at module scope (not inside component functions)
type Message = { role: 'user' | 'assistant', content: string }
type UploadedFile = { name: string, type: string, size: number, content?: string, buffer?: ArrayBuffer }
type Chat = { id: string, title: string, messages: Message[], files: UploadedFile[], createdAt: string }

const ContextProvider = ({ children }: ContextProviderProps) => {
    const [input, setInput] = useState("")
    const [recentPrompt, setRecentPrompt] = useState("")
    const [prevPrompts, setPrevPrompts] = useState<string[]>([])
    const [showResult, setShowResult] = useState(false)
    const [loading, setLoading] = useState(false)
    const [resultData, setResultData] = useState("")
    // Idioma (PT padrão) e dicionário simples
    const [language, setLanguage] = useState<'pt' | 'en'>(() => {
      const saved = localStorage.getItem('language');
      return (saved === 'en' || saved === 'pt') ? (saved as 'pt' | 'en') : 'pt';
    })
    const translations = {
      pt: {
        newChat: 'Novo Chat',
        recent: 'Recentes',
        help: 'Ajuda',
        settings: 'Configurações',
        greetHello: 'Olá, Alpha.',
        greetQuestion: 'Como posso ajudar você hoje?',
        promptPlaceholder: 'Digite sua mensagem aqui',
       
        uploadLabel: 'Selecionar arquivo',
        exportLabel: 'Exportar conversa (.json)',
        languageLabel: 'Idioma do sistema',
        portuguese: 'Português',
        english: 'Inglês'
      },
      en: {
        newChat: 'New Chat',
        recent: 'Recent',
        help: 'Help',
        settings: 'Settings',
        greetHello: 'Hello, Alpha.',
        greetQuestion: 'How can I help you today?',
        promptPlaceholder: 'Enter a prompt here',
        privacyNote: 'Gemini may display inaccurate info. Double-check responses. Your privacy and Gemini Apps',
        uploadLabel: 'Select file',
        exportLabel: 'Export conversation (.json)',
        languageLabel: 'System language',
        portuguese: 'Portuguese',
        english: 'English'
      }
    }
    const dict = translations[language]

    // Modal de configurações
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const createChat = (): Chat => ({ id: String(Date.now()), title: dict.newChat, messages: [], files: [], createdAt: new Date().toISOString() })
    const [chats, setChats] = useState<Chat[]>([createChat()])
    const [currentChatId, setCurrentChatId] = useState<string>(chats[0].id)
    const currentChat = chats.find(c => c.id === currentChatId) || chats[0]
    const conversation = currentChat.messages
    const uploadedFiles = currentChat.files

    const handleFileUpload = (files: FileList | null) => {
      if (!files) return;
      const accepted = ['.csv','.xlsx','.xls','.txt','.json','.pdf']
      const newItems: UploadedFile[] = []
      Array.from(files).forEach(file => {
        const lower = file.name.toLowerCase()
        const isAccepted = accepted.some(ext => lower.endsWith(ext))
        if (!isAccepted) return
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result
          const item: UploadedFile = { name: file.name, type: file.type, size: file.size }
          if (typeof result === 'string') {
            item.content = result
          } else if (result instanceof ArrayBuffer) {
            item.buffer = result
          }
          newItems.push(item)
          setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, files: [...c.files, item] } : c))
        }
        if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.pdf')) {
          reader.readAsArrayBuffer(file)
        } else {
          reader.readAsText(file)
        }
      })
    }

    const delayPara = (index: number, nextWord: string) => {
        setTimeout(function() {
            setResultData(prev => prev + nextWord)
        }, 100 * index)
    }

    const newChat = () => {
        const chat = createChat()
        setChats(prev => [chat, ...prev])
        setCurrentChatId(chat.id)
        setLoading(false)
        setShowResult(false)
        setRecentPrompt("")
        setResultData("")
        setInput("")
    }

    const onSent = async (prompt?: string) => {
        setResultData("")
        setLoading(true)
        setShowResult(true)
        let response
        let userMessage = ''
        if (prompt !== undefined) {
            response = await chat(prompt)
            setRecentPrompt(prompt)
            userMessage = prompt
        } else {
            setPrevPrompts(prev => [...prev, input])
            setRecentPrompt(input)
            userMessage = input
            response = await chat(input)
        }
        // Guarda mensagem do usuário no chat atual
        setChats(prev => prev.map(c => {
            if (c.id !== currentChatId) return c
            const newTitle = c.title === dict.newChat && userMessage ? userMessage.slice(0, 30) : c.title
            return { ...c, title: newTitle, messages: [...c.messages, { role: 'user', content: userMessage }] }
        }))
        let responseArray = response.split("**")
        let newResponse = "";
        for (let i = 0; i < responseArray.length; i++) {
            if (i === 0 || i % 2 !== 1) {
                newResponse += responseArray[i]
            } else {
                newResponse += "<b>" + responseArray[i] + "</b>"
            }
        }
        let newResponse2 = newResponse.split("*").join("</br>")
        let newResponseArray = newResponse2.split(" ")
        for (let i = 0; i < newResponseArray.length; i++) {
            const nextWord = newResponseArray[i]
            delayPara(i, nextWord + " ")
        }
        // Guarda resposta do assistente (HTML processado) no chat atual
        setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...c.messages, { role: 'assistant', content: newResponse2 }] } : c))
        setLoading(false)
        setInput("")
    }

    const exportConversation = () => {
      const chat = currentChat
      const data = {
        language,
        recentPrompt,
        id: chat.id,
        title: chat.title,
        messages: chat.messages,
        files: chat.files.map(f => ({name:f.name,type:f.type,size:f.size}))
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `conversa-${chat.title || 'chat'}-${new Date().toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }
    const exportConversationById = (id: string) => {
      const chat = chats.find(c => c.id === id)
      if (!chat) return
      const data = {
        language,
        id: chat.id,
        title: chat.title,
        messages: chat.messages,
        files: chat.files.map(f => ({name:f.name,type:f.type,size:f.size}))
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `conversa-${chat.title || 'chat'}-${new Date().toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }

    // Adiciona exclusão de chat
    const deleteChat = (id: string) => {
      setChats(prev => {
        const rest = prev.filter(c => c.id !== id)
        if (rest.length === 0) {
          const c = createChat()
          setCurrentChatId(c.id)
          setShowResult(false)
          setLoading(false)
          setRecentPrompt("")
          setResultData("")
          setInput("")
          return [c]
        }
        if (id === currentChatId) {
          setCurrentChatId(rest[0].id)
          setShowResult(false)
          setLoading(false)
          setRecentPrompt("")
          setResultData("")
          setInput("")
        }
        return rest
      })
    }

    const contextValue = {
        prevPrompts: prevPrompts,
        setPrevPrompts,
        onSent,
        setRecentPrompt,
        recentPrompt,
        showResult,
        loading,
        resultData,
        input,
        setInput,
        newChat,
        // Idioma
        language,
        setLanguage: (lang: 'pt'|'en') => { setLanguage(lang); localStorage.setItem('language', lang) },
        dict,
        // Configurações
        isSettingsOpen,
        setIsSettingsOpen,
        // Chats
        chats,
        currentChatId,
        setCurrentChatId,
        conversation,
        uploadedFiles,
        handleFileUpload,
        exportConversation,
        exportConversationById,
        deleteChat
    }

    return (
        <Context.Provider value={contextValue}>
            {children}
        </Context.Provider>
    )
}

export default ContextProvider