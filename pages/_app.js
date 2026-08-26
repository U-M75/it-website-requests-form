import React from 'react';

function MyApp({ Component, pageProps }) {
  return (
    <div className="app-root">
      <Component {...pageProps} />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');

        :root {
          --ksc-pink: #f8cbd9;
          --ksc-pink-soft: #fff4f8;
          --ksc-pink-strong: #ed7f9c;
          --ksc-blue: #9adbef;
          --ksc-blue-soft: #effaff;
          --ksc-brown: #8b5e3c;
          --ksc-brown-dark: #68452d;
          --ksc-text: #614a3d;
          --ksc-muted: #8e766a;
          --ksc-border: #ecc6d4;
          --ksc-white: #ffffff;
          --ksc-shadow: 0 18px 50px rgba(139, 94, 60, 0.12);
        }

        * {
          box-sizing: border-box;
        }

        html {
          min-height: 100%;
          scroll-behavior: smooth;
        }

        body {
          padding: 0;
          margin: 0;
          min-width: 320px;
          background: #fff7fa;
          color: var(--ksc-text);
          font-family: 'Nunito', 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        button,
        label,
        select {
          -webkit-tap-highlight-color: transparent;
        }

        button {
          border: 0;
        }

        button:disabled {
          opacity: 0.58;
          cursor: not-allowed !important;
        }

        input,
        textarea,
        select {
          outline: none;
        }

        input:focus,
        textarea:focus,
        select:focus {
          border-color: var(--ksc-blue) !important;
          box-shadow: 0 0 0 4px rgba(154, 219, 239, 0.22);
        }

        ::selection {
          background: var(--ksc-pink);
          color: var(--ksc-brown-dark);
        }

        ::-webkit-scrollbar {
          width: 9px;
          height: 9px;
        }

        ::-webkit-scrollbar-track {
          background: #fff3f7;
        }

        ::-webkit-scrollbar-thumb {
          background: #e9b8c9;
          border-radius: 999px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: var(--ksc-pink-strong);
        }

        .app-root {
          min-height: 100vh;
        }

        .ksc-page {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          padding: 38px 20px 28px;
          background:
            radial-gradient(
              circle at 8% 7%,
              rgba(248, 203, 217, 0.68),
              transparent 26%
            ),
            radial-gradient(
              circle at 94% 18%,
              rgba(154, 219, 239, 0.46),
              transparent 27%
            ),
            linear-gradient(
              135deg,
              #fff9fb 0%,
              #fff5f8 46%,
              #f5fcff 100%
            );
        }

        .ksc-page::before,
        .ksc-page::after {
          content: '';
          position: absolute;
          width: 230px;
          height: 230px;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0.28;
          filter: blur(2px);
        }

        .ksc-page::before {
          top: 35%;
          left: -130px;
          background: radial-gradient(
            circle,
            rgba(248, 203, 217, 0.9),
            transparent 68%
          );
        }

        .ksc-page::after {
          right: -140px;
          bottom: 8%;
          background: radial-gradient(
            circle,
            rgba(154, 219, 239, 0.75),
            transparent 68%
          );
        }

        .ksc-shell {
          position: relative;
          z-index: 2;
          width: min(100%, 820px);
          margin: 0 auto;
        }

        .ksc-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin: 0 auto 25px;
        }

        .brand-mark {
          width: 150px;
          height: 150px;
          display: grid;
          place-items: center;
          margin-bottom: 6px;
          filter: drop-shadow(
            0 10px 18px rgba(139, 94, 60, 0.13)
          );
        }

        .brand-mark img {
          display: block;
          width: 150px;
          height: 150px;
          object-fit: contain;
        }

        .brand-copy {
          max-width: 650px;
        }

        .eyebrow,
        .section-kicker {
          margin: 0 0 7px;
          color: var(--ksc-pink-strong);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .brand-copy h1 {
          margin: 0;
          color: var(--ksc-brown);
          font-size: clamp(28px, 4vw, 39px);
          line-height: 1.12;
          font-weight: 800;
          letter-spacing: -0.025em;
        }

        .subtitle {
          margin: 8px 0 0;
          color: var(--ksc-muted);
          font-size: 15px;
          line-height: 1.55;
        }

        .header-actions {
          display: flex;
          justify-content: center;
          gap: 9px;
          flex-wrap: wrap;
          margin-top: 16px;
        }

        .button {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 0 18px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.01em;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        .button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .button-primary {
          color: #ffffff;
          background: var(--ksc-pink-strong);
          box-shadow: 0 8px 18px
            rgba(237, 127, 156, 0.24);
        }

        .button-primary:hover:not(:disabled) {
          box-shadow: 0 11px 24px
            rgba(237, 127, 156, 0.3);
        }

        .button-secondary {
          color: var(--ksc-brown);
          background: #fff7fa;
          border: 1px solid var(--ksc-border);
        }

        .button-light {
          color: var(--ksc-brown);
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid var(--ksc-border);
        }

        .button-soft {
          color: #527b88;
          background: var(--ksc-blue-soft);
          border: 1px solid rgba(154, 219, 239, 0.65);
        }

        .notice {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          padding: 13px 15px;
          margin-bottom: 16px;
          border-radius: 14px;
          font-size: 13px;
          line-height: 1.5;
        }

        .notice-error {
          color: #8a3d4d;
          background: #fff0f3;
          border: 1px solid #f2becb;
        }

        .notice-warning {
          color: #725f3e;
          background: #fff8e9;
          border: 1px solid #f1dfae;
        }

        .form-card,
        .history-card,
        .success-card {
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid var(--ksc-border);
          border-radius: 24px;
          box-shadow: var(--ksc-shadow);
          backdrop-filter: blur(8px);
        }

        .form-card {
          padding: clamp(21px, 4vw, 34px);
        }

        .form-intro {
          text-align: center;
          padding-bottom: 25px;
          margin-bottom: 25px;
          border-bottom: 1px dashed #efd0db;
        }

        .form-intro h2,
        .success-card h2,
        .section-heading h2 {
          margin: 0;
          color: var(--ksc-brown-dark);
          font-size: 25px;
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .form-intro > p:last-child {
          max-width: 570px;
          margin: 8px auto 0;
          color: var(--ksc-muted);
          font-size: 13px;
          line-height: 1.55;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(
            2,
            minmax(0, 1fr)
          );
          gap: 18px 16px;
        }

        .field {
          min-width: 0;
        }

        .field-full {
          grid-column: 1 / -1;
        }

        .field-label {
          display: block;
          margin-bottom: 7px;
          color: var(--ksc-brown-dark);
          font-size: 13px;
          font-weight: 800;
        }

        .required {
          color: var(--ksc-pink-strong);
        }

        .form-control {
          width: 100%;
          min-height: 45px;
          padding: 10px 13px;
          border: 1px solid #e7c5d1;
          border-radius: 12px;
          background: #fffafd;
          color: var(--ksc-text);
          font-size: 14px;
          line-height: 1.45;
          transition:
            border-color 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        .select-wrapper {
          position: relative;
          width: 100%;
        }

        .select-wrapper .form-control {
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          padding-right: 42px;
        }

        .select-arrow {
          position: absolute;
          top: 50%;
          right: 14px;
          width: 8px;
          height: 8px;
          border-right: 2px solid var(--ksc-muted);
          border-bottom: 2px solid var(--ksc-muted);
          transform: translateY(-65%) rotate(45deg);
          pointer-events: none;
        }

        .form-control::placeholder {
          color: #b5a29a;
        }

        .form-control:disabled {
          cursor: not-allowed;
          background: #f9f6f7;
        }

        .textarea {
          min-height: 118px;
          resize: vertical;
        }

        .textarea.description {
          min-height: 150px;
        }

        .field-hint {
          margin: 6px 2px 0;
          color: #9b8780;
          font-size: 11px;
          line-height: 1.5;
        }

        .autocomplete {
          position: relative;
        }

        .suggestions {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          right: 0;
          z-index: 20;
          max-height: 210px;
          overflow-y: auto;
          padding: 5px;
          border: 1px solid var(--ksc-border);
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 12px 30px
            rgba(139, 94, 60, 0.14);
        }

        .suggestion-item {
          width: 100%;
          display: block;
          padding: 10px 11px;
          border-radius: 8px;
          background: transparent;
          color: var(--ksc-text);
          text-align: left;
          font-size: 13px;
          cursor: pointer;
          transition:
            background 140ms ease,
            color 140ms ease;
        }

        .suggestion-item:hover,
        .suggestion-item:focus {
          background: var(--ksc-pink-soft);
          color: var(--ksc-brown-dark);
        }

        .cc-selected-list {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 8px;
        }

        .cc-selected-user {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 30px;
          padding: 4px 7px 4px 10px;
          border: 1px solid #ecc6d4;
          border-radius: 999px;
          background: var(--ksc-pink-soft);
          color: var(--ksc-brown);
          font-size: 11px;
          font-weight: 700;
        }

        .cc-selected-user button {
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          padding: 0;
          border-radius: 50%;
          background: transparent;
          color: var(--ksc-brown);
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
        }

        .cc-selected-user button:hover {
          background: #ffffff;
          color: var(--ksc-pink-strong);
        }

        .routing-note {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 7px;
          padding: 8px 10px;
          border-radius: 10px;
          color: #587a84;
          background: var(--ksc-blue-soft);
          font-size: 12px;
          line-height: 1.4;
        }

        .routing-dot {
          width: 7px;
          height: 7px;
          flex: 0 0 7px;
          border-radius: 50%;
          background: var(--ksc-blue);
          box-shadow: 0 0 0 4px
            rgba(154, 219, 239, 0.18);
        }

        .upload-control {
          min-height: 70px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border: 1px dashed #e4b7c7;
          border-radius: 12px;
          background: linear-gradient(
            135deg,
            #fff8fb,
            #f7fdff
          );
          color: var(--ksc-brown);
          cursor: pointer;
          transition:
            border-color 160ms ease,
            transform 160ms ease,
            background 160ms ease;
        }

        .upload-control:hover {
          border-color: var(--ksc-blue);
          background: #f8fdff;
          transform: translateY(-1px);
        }

        .upload-control input {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
        }

        .upload-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          flex: 0 0 38px;
          border-radius: 50%;
          color: #6c9baa;
          background: #eaf9fd;
          font-size: 22px;
          font-weight: 500;
        }

        .upload-control strong,
        .upload-control small {
          display: block;
        }

        .upload-control strong {
          font-size: 13px;
        }

        .upload-control small {
          margin-top: 2px;
          color: var(--ksc-muted);
          font-size: 11px;
        }

        .attachment-count {
          margin-top: 7px;
          color: #6993a0;
          font-size: 11px;
          font-weight: 700;
        }

        .cc-preview {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 21px;
          padding: 11px 13px;
          border: 1px solid #ead5dc;
          border-radius: 12px;
          background: #fff9fb;
          color: var(--ksc-muted);
          font-size: 12px;
        }

        .cc-preview-label {
          flex: 0 0 auto;
          padding: 4px 8px;
          border-radius: 999px;
          color: var(--ksc-brown);
          background: var(--ksc-pink-soft);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .form-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 25px;
          padding-top: 21px;
          border-top: 1px dashed #efd0db;
        }

        .form-footer > p {
          margin: 0;
          color: var(--ksc-muted);
          font-size: 11px;
        }

        .form-actions {
          display: flex;
          gap: 9px;
          justify-content: flex-end;
        }

        .history-card {
          padding: 20px;
          margin-bottom: 16px;
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 15px;
        }

        .section-heading h2 {
          font-size: 19px;
        }

        .count-pill,
        .status-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
        }

        .count-pill {
          min-width: 30px;
          min-height: 26px;
          padding: 0 8px;
          color: var(--ksc-brown);
          background: var(--ksc-pink-soft);
        }

        .history-item {
          padding: 12px 0;
          border-top: 1px solid #f3e4e9;
        }

        .history-meta {
          margin-bottom: 4px;
          color: #a18b82;
          font-size: 10px;
        }

        .history-main {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          color: var(--ksc-muted);
          font-size: 12px;
        }

        .history-main strong {
          color: var(--ksc-brown-dark);
        }

        .status-pill {
          padding: 4px 8px;
          color: #5e8a73;
          background: #eef9f1;
        }

        .success-card {
          padding: 48px 25px;
          text-align: center;
        }

        .success-icon {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
          border-radius: 50%;
          color: #ffffff;
          background: var(--ksc-pink-strong);
          box-shadow: 0 10px 25px
            rgba(237, 127, 156, 0.24);
          font-size: 29px;
          font-weight: 800;
        }

        .success-card h2 {
          font-size: 28px;
        }

        .success-card > p:not(.section-kicker) {
          max-width: 520px;
          margin: 10px auto 23px;
          color: var(--ksc-muted);
          font-size: 13px;
          line-height: 1.65;
        }

        .ksc-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 19px;
          color: #a28c84;
          font-size: 11px;
        }

        .ksc-footer span:last-child {
          color: var(--ksc-pink-strong);
          font-size: 15px;
        }

        @media (max-width: 680px) {
          .ksc-page {
            padding: 24px 13px 22px;
          }

          .brand-mark,
          .brand-mark img {
            width: 126px;
            height: 126px;
          }

          .brand-copy h1 {
            font-size: 29px;
          }

          .form-card {
            border-radius: 20px;
            padding: 20px 16px;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .field-full {
            grid-column: auto;
          }

          .form-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .form-actions {
            width: 100%;
          }

          .form-actions .button {
            flex: 1;
          }

          .success-card {
            border-radius: 20px;
            padding: 40px 18px;
          }
        }

        @media (max-width: 430px) {
          .header-actions {
            width: 100%;
          }

          .header-actions .button {
            flex: 1;
          }

          .form-intro {
            padding-bottom: 20px;
            margin-bottom: 20px;
          }

          .cc-preview {
            align-items: flex-start;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          *,
          *::before,
          *::after {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default MyApp;
