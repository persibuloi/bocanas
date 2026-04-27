import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import { Toaster } from 'react-hot-toast'

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <div className="lg:pl-72">
        <main className="pb-24 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <BottomNav />

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0f172a',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { style: { background: '#16a34a' } },
          error: { style: { background: '#dc2626' } },
        }}
      />
    </div>
  )
}

export default Layout
