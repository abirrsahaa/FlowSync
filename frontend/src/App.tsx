import { BrowserRouter } from 'react-router-dom'
import { ServiceProvider } from '@/services/ServiceProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppRouter } from '@/router'

function App() {
  return (
    <ServiceProvider>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </TooltipProvider>
    </ServiceProvider>
  )
}

export default App
