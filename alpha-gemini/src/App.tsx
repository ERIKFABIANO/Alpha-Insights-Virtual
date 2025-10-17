import Main from "./components/Main/Main"
import Sidebar from "./components/Sidebar/Sidebar"
import { useContext } from 'react'
import { Context } from './context/Context'
import SettingsModal from './components/Settings/SettingsModal'


function App() {
  const { isSettingsOpen } = useContext(Context)
  return (
    <>
      <Sidebar />
      <Main />
      {isSettingsOpen ? <SettingsModal /> : null}
    </>
  )
}

export default App
