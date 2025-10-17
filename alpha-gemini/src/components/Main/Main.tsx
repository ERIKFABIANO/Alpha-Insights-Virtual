import { useContext } from 'react'
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
    uploadedFiles
  } = useContext(Context)

  return (
    <main className='main'>
      <nav className="nav">
        <p>Gemini</p>
        {/* ícone de login removido */}
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
                <span style={{fontSize:'20px'}}>📎</span>
              </label>
              <input id="fileUpload" type="file" accept=".pdf,.xlsx,.xls" multiple style={{display:'none'}} onChange={(e) => handleFileUpload(e.target.files)} />
              <img onClick={() => onSent()} src={assets.send_icon} alt="" />
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