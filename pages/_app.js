import React from 'react';

function MyApp({ Component, pageProps }) {
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Component {...pageProps} />
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          padding: 0;
          margin: 0;
          background-color: #0f1419;
          color: #e0e0e0;
        }

        a {
          color: #1e88e5;
          text-decoration: none;
        }

        a:hover {
          text-decoration: underline;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        input:focus,
        textarea:focus,
        select:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 2px rgba(30, 136, 229, 0.2);
        }

        textarea {
          font-family: inherit;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #1a1e27;
        }

        ::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}

export default MyApp;
