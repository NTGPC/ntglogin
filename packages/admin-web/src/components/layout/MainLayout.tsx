import Sidebar from './Sidebar'
import { Outlet } from 'react-router-dom'

export function MainLayout() {
  return (
    <Sidebar>
      <Outlet />
    </Sidebar>
  )
}

