import { useContext, useState } from 'react'
import './Sidebar.css'
import { Context } from '../../context/Context.tsx'

const Sidebar = () => {

  const [extended, setExtended] = useState(false)
  const { newChat, dict, setIsSettingsOpen, chats, currentChatId, setCurrentChatId, deleteChat } = useContext(Context)

  return (
    <aside className='sidebar'>
      <section className="top">
        <span onClick={() => setExtended(prev => !prev)} className='menu material-symbols-outlined icon-button' aria-label='menu'>menu</span>
        <div onClick={() => newChat()} className="new-chat">
          <span className='material-symbols-outlined icon-button' aria-hidden>add</span>
          {extended  ? (<p>{dict.newChat}</p>) : null }
        </div>
        {extended ? (
          <div className="recent">
            <p className="recent-title">{dict.recent}</p>
            {chats.map((chat: any) => (
              <div key={chat.id} onClick={() => setCurrentChatId(chat.id)} className={`recent-entry ${chat.id===currentChatId ? 'active' : ''}`}>
                <span className="material-symbols-outlined chat-icon">chat_bubble</span>
                <p>{(chat.title || dict.newChat).slice(0, 24)}</p>
                <button className="delete-chat" title="Excluir" onClick={(e) => { e.stopPropagation(); deleteChat(chat.id) }}>🗑️</button>
              </div>
            ))}
          </div>
          ) : null
        }
        
      </section>
      <section className="bottom">
        <div className='bottom-item recent-entry' onClick={() => setIsSettingsOpen(true)}>
          <span className='material-symbols-outlined icon-button' aria-hidden>settings</span>
          {extended ? (<p>{dict.settings}</p>) : null}
        </div>
      </section>
    </aside>
  )
}

export default Sidebar