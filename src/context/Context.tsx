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

    const arrayBufferToBase64 = (buf: ArrayBuffer) => {
      let binary = ''
      const bytes = new Uint8Array(buf)
      const len = bytes.byteLength
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      return btoa(binary)
    }

    const markdownToHtml = (md: string) => {
      // Conversão básica para HTML: títulos, negrito, itálico, listas e quebras de linha
      let html = md
      // Code blocks
      html = html.replace(/```([\s\S]*?)```/g, (_match, p1) => {
        // reference _match to satisfy TS noUnusedParameters
        void _match
        return `<pre><code>${p1.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre>`
      })
      // Bold **text**
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic *text*
      html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Headings
      html = html.replace(/^######\s?(.*)$/gm, '<h6>$1</h6>')
      html = html.replace(/^#####\s?(.*)$/gm, '<h5>$1</h5>')
      html = html.replace(/^####\s?(.*)$/gm, '<h4>$1</h4>')
      html = html.replace(/^###\s?(.*)$/gm, '<h3>$1</h3>')
      html = html.replace(/^##\s?(.*)$/gm, '<h2>$1</h2>')
      html = html.replace(/^#\s?(.*)$/gm, '<h1>$1</h1>')
      // Lists
      html = html.replace(/^\-\s(.*)$/gm, '<li>$1</li>')
      html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m.replace(/\n/g,'')}</ul>`)
      // Line breaks
      html = html.replace(/\n/g, '<br/>')
      return html
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
        let response: string = ''
        let userMessage = ''
        try {
            // Prepara payload de arquivos anexados
            const filesPayload = uploadedFiles.map(f => {
              if (f.buffer) {
                return { name: f.name, type: f.type, size: f.size, bufferBase64: arrayBufferToBase64(f.buffer) }
              }
              return { name: f.name, type: f.type, size: f.size, content: f.content || '' }
            })

            if (prompt !== undefined) {
                userMessage = prompt
                setRecentPrompt(prompt)
                // Limpa imediatamente o campo de entrada
                setInput("")
                response = await chat(prompt, filesPayload)
            } else {
                const typed = input
                setPrevPrompts(prev => [...prev, typed])
                setRecentPrompt(typed)
                userMessage = typed
                // Limpa imediatamente o campo de entrada
                setInput("")
                response = await chat(typed, filesPayload)
            }
            // Guarda mensagem do usuário no chat atual
            setChats(prev => prev.map(c => {
                if (c.id !== currentChatId) return c
                const newTitle = c.title === dict.newChat && userMessage ? userMessage.slice(0, 30) : c.title
                return { ...c, title: newTitle, messages: [...c.messages, { role: 'user', content: userMessage }] }
            }))

            // Converte Markdown da resposta para HTML e faz animação de palavras
            const html = markdownToHtml(response)
            const words = html.split(' ')
            for (let i = 0; i < words.length; i++) {
                delayPara(i, words[i] + ' ')
            }
            // Guarda resposta do assistente (HTML processado) no chat atual
            setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...c.messages, { role: 'assistant', content: html }] } : c))
            setLoading(false)
        } catch (e: any) {
            // Exibe erro e encerra loader para não ficar "pensando" infinito
            const msg = e?.message ? String(e.message) : 'Erro inesperado ao chamar a API.'
            const advice = 'Verifique variáveis no Vercel (GOOGLE_* e DRIVE_FOLDER_ID) e compartilhe a pasta do Drive com o e-mail do token. Abra os logs de Functions para detalhes.'
            setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...c.messages, { role: 'assistant', content: `⚠️ ${msg}\n\n${advice}` }] } : c))
            setLoading(false)
            setShowResult(true)
        }
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

    const setCurrentChatTitle = (title: string) => {
      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, title } : c))
    }

    return (
      <Context.Provider value={{
        dict,
        isSettingsOpen,
        setIsSettingsOpen,
        chats,
        currentChatId,
        setCurrentChatId,
        conversation,
        uploadedFiles,
        input,
        setInput,
        recentPrompt,
        prevPrompts,
        showResult,
        loading,
        resultData,
        onSent,
        setRecentPrompt,
        setPrevPrompts,
        setShowResult,
        setLoading,
        setResultData,
        newChat,
        handleFileUpload,
        exportConversation,
        exportConversationById,
        deleteChat,
        setCurrentChatTitle,
        language,
        setLanguage
      }}>
        {children}
      </Context.Provider>
    )
}

export default ContextProvider