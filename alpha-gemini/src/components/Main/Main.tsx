import { useContext, useState } from 'react'
import { assets } from '../../assets/assets'
import './Main.css'
import { Context } from '../../context/Context'

const Main = () => {

  const {
    onSent,
    recentPrompt,
    showResult,
    loading,
    resultData,
    setInput,
    input,
    dict,
    handleFileUpload,
    uploadedFiles,
    chats,
    currentChatId,
    setCurrentChatTitle
  } = useContext(Context)

  const currentTitle = (chats.find((c: any) => c.id === currentChatId)?.title) || dict.newChat
  const [isRenaming, setIsRenaming] = useState(false)
  const [tempTitle, setTempTitle] = useState(currentTitle)
  const saveTitle = () => { setCurrentChatTitle(tempTitle); setIsRenaming(false) }

  return (
    <main className='main'>
      <nav className="nav">
        <div className="chat-title">
          {isRenaming ? (
            <input
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setIsRenaming(false); setTempTitle(currentTitle) } }}
              onBlur={saveTitle}
              placeholder={dict.newChat}
            />
          ) : (
            <p>{currentTitle}</p>
          )}
          <span className="material-symbols-outlined icon-button" aria-hidden onClick={() => { if (isRenaming) { saveTitle() } else { setTempTitle(currentTitle); setIsRenaming(true) } }}>{isRenaming ? 'check' : 'edit'}</span>
        </div>
      </nav>
      <section className="main-container">
        <div className="greet">
          <p><span>{dict.greetHello}</span></p>
          <p>{dict.greetQuestion}</p>
        </div>
        {!showResult ?

          null
        :
          <div className="result">
            <div className="result-title">
              <img src={assets.user_icon} alt="" />
              <p>{recentPrompt}</p>
            </div>
            <div className="result-data">
              <img src={assets.gemini_icon} width={36} height={36} alt="" />
              {loading ? <>
                <div className='loader'>
                  <hr />
                  <hr />
                  <hr />
                </div>
              </> : <p dangerouslySetInnerHTML={{__html:resultData}}></p>}
              
            </div>
          </div> 
        }
        <div className="main-bottom">
          <div className="search-box">
            <input onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSent(); } }} value={input} type="text" placeholder={dict.promptPlaceholder} />
            <div>
              {/* Upload local de PDF/Excel via ícone de clipe */}
              <label htmlFor="fileUpload" style={{cursor:'pointer'}} title={dict.uploadLabel}>
                <span className="material-symbols-outlined icon-button" aria-hidden>attach_file</span>
              </label>
              <input id="fileUpload" type="file" accept=".pdf,.xlsx,.xls" multiple style={{display:'none'}} onChange={(e) => handleFileUpload(e.target.files)} />
              <span className="material-symbols-outlined icon-button" onClick={() => onSent()} title={dict.sendLabel || 'Enviar'}>send</span>
            </div>
          </div>
          {/* Lista rápida de arquivos selecionados */}
          {uploadedFiles.length > 0 ? (
            <p className='bottom-info'>
              {uploadedFiles.length} arquivo(s) selecionado(s): {uploadedFiles.map((f: File) => f.name).join(', ')}
            </p>
          ) : null}
          <p className='bottom-info'>
            {dict.privacyNote}
          </p>
        </div>
      </section>
    </main>
  )
}

export default Main