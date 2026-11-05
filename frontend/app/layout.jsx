import { Preferences } from '../components/shared';
export const metadata = {
  title: 'SMM Panel',
  description: 'Digital services, orders and operations',
};
export default function Root({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Preferences>{children}</Preferences>
      </body>
    </html>
  );
}
