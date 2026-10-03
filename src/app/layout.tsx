import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Incognito CUSB — Student Community for Central University of South Bihar',
  description:
    'An independent student-driven social forum and real-time discussion platform designed exclusively for students of Central University of South Bihar (CUSB), Gaya, Bihar, India.',
  keywords: [
    'CUSB',
    'Central University of South Bihar',
    'Gaya',
    'Bihar',
    'Student Forum',
    'Incognito CUSB',
    'Campus Social Platform',
  ],
  authors: [{ name: 'Incognito CUSB Student Community' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0b0f19',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0f19] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <MobileBottomNav />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
