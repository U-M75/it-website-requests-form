import React from 'react';

function MyApp({ Component, pageProps }) {
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Quicksand, sans-serif' }}>
      <Component {...pageProps} />
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          padding: 0;
          margin: 0;
          background-color: #f6828d;
          color: #8b5e3b;
        }

        a {
          color: #8b5e3b;
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
          border-color: #8b5e3b;
          box-shadow: 0 0 0 2px rgba(255, 115, 128, 0.25);
        }

        input,
        select,
        button,
        textarea {
          font-family: inherit;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #fff6f6;
        }

        ::-webkit-scrollbar-thumb {
          background: #f2a5a3;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #ff7380;
        }
      `}</style>
    </div>
  );
}

export default MyApp;
