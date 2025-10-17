import { useContext, useState } from 'react'
import { assets } from '../../assets/assets.ts'
import './Sidebar.css'
import { Context } from '../../context/Context.tsx'

const Sidebar = () => {

  const [extended, setExtended] = useState(false)
  const { newChat, dict, setIsSettingsOpen, chats, currentChatId, setCurrentChatId, deleteChat } = useContext(Context)

  return (
    <aside className='sidebar'>
      <section className="top">
        <img onClick={() => setExtended(prev => !prev)} className='menu' src={assets.menu_icon} alt='menu' />
        <div onClick={() => newChat()} className="new-chat">
          <img src={assets.plus_icon} />
          {extended  ? (<p>{dict.newChat}</p>) : null }
        </div>
        {extended ? (
          <div className="recent">
            <p className="recent-title">{dict.recent}</p>
            {chats.map((chat: any) => (
              <div key={chat.id} onClick={() => setCurrentChatId(chat.id)} className={`recent-entry ${chat.id===currentChatId ? 'active' : ''}`}>
                <img src={assets.message_icon} />
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
          <img src={assets.setting_icon} alt=""  />
          {extended ? (<p>{dict.settings}</p>) : null}
        </div>
      </section>
    </aside>
  )
}

export default Sidebar