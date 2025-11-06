import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/common/Layout'
import Dashboard from './pages/Dashboard'
import Questions from './pages/Questions'
import Templates from './pages/Templates'
import Papers from './pages/Papers'
import Upload from './pages/Upload'
import Settings from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="questions" element={<Questions />} />
          <Route path="templates" element={<Templates />} />
          <Route path="papers" element={<Papers />} />
          <Route path="upload" element={<Upload />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
