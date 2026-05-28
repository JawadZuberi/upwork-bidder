import './globals.css';

export const metadata = {
  title: 'Upwork Auto-Bidder | Quill Forge Publishing',
  description: 'AI-powered Upwork proposal system for ghostwriting and publishing',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
