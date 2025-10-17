import { useContext, useState } from 'react'
import './SettingsModal.css'
import { Context } from '../../context/Context'

const SettingsModal = () => {
  const { setIsSettingsOpen, dict, exportConversation, exportConversationById, language, setLanguage, chats, currentChatId } = useContext(Context)
  const [selectedId, setSelectedId] = useState<string>(currentChatId)

  return (
    <div className="settings-overlay" onClick={() => setIsSettingsOpen(false)}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <header className="settings-header">
          <h2>{dict.settings}</h2>
          <button className="close-btn" onClick={() => setIsSettingsOpen(false)}>×</button>
        </header>
        <section className="settings-content">
          <div className="settings-item">
            <label>{dict.exportLabel}</label>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                {chats.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.title || dict.newChat}</option>
                ))}
              </select>
              <button className="primary" onClick={() => selectedId ? exportConversationById(selectedId) : exportConversation()}>.json</button>
            </div>
          </div>
          <div className="settings-item">
            <label>{dict.languageLabel}</label>
            <div className="lang-options">
              <label>
                <input type="radio" name="lang" checked={language==='pt'} onChange={() => setLanguage('pt')} /> {dict.portuguese}
              </label>
              <label>
                <input type="radio" name="lang" checked={language==='en'} onChange={() => setLanguage('en')} /> {dict.english}
              </label>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default SettingsModal