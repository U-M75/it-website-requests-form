import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { DEFAULT_CHANNEL, getPlatformChannel } from '../lib/slack-channels';

const INITIAL_FORM = {
  user: '',
  userId: '',
  ccUserIds: [],
  category: '',
  otherExplain: '',
  priority: 'Medium',
  platform: '',
  whereHappening: '',
  expectedVsActual: '',
  attachments: [],
  description: '',
};

const categoryOptions = [
  'UI/Design Bug',
  'Functionality Issue',
  'Mobile Responsive',
  'New Feature Request',
  'Security/Access',
  'Other',
];

const platformOptions = [
  'Retail - Kawaii Slime Company Web',
  'Retail - Jellyland USA Web',
  'B2B - The Kawaii Company',
  'Disney POS',
  'Slack',
  'Microsoft Sharepoint',
  'Zendesk',
  'Social Media',
  'Shopify Access',
  'Other',
];

function Field({ label, required, hint, children }) {
  return (
    <div className="field">
      <label className="field-label">
        {label} {required && <span className="required">*</span>}
      </label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export default function Home() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [slackUsers, setSlackUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);

  const [userSearch, setUserSearch] = useState('');
  const [ccSearch, setCcSearch] = useState('');
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [showCcSuggestions, setShowCcSuggestions] = useState(false);

  const userFieldRef = useRef(null);
  const ccFieldRef = useRef(null);

  const [selectedChannel, setSelectedChannel] = useState(DEFAULT_CHANNEL.name);
  const [loading, setLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [tokenWarning, setTokenWarning] = useState(false);
  const conversationRef = useRef([]);

  useEffect(() => {
    const fetchSlackUsers = async () => {
      try {
        setUsersLoading(true);
        setUsersError(null);

        const response = await fetch('/api/slack/get-users');
        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json')
          ? await response.json()
          : { success: false, error: `Server returned ${response.status} instead of JSON` };

        if (!response.ok && !data.error) {
          throw new Error(`Slack users request failed (${response.status})`);
        }

        if (data.success && data.users) {
          setSlackUsers(data.users);
        } else {
          throw new Error(data.error || 'Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching Slack users:', error);
        setUsersError(error.message);
        setSlackUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchSlackUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userFieldRef.current &&
        !userFieldRef.current.contains(event.target)
      ) {
        setShowUserSuggestions(false);
      }

      if (
        ccFieldRef.current &&
        !ccFieldRef.current.contains(event.target)
      ) {
        setShowCcSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getUserSuggestions = (search, excludedIds = []) => {
    const query = search.trim().toLowerCase();

    return slackUsers
      .filter((user) => !excludedIds.includes(user.userId))
      .filter((user) => {
        if (!query) return true;

        return (
          user.name?.toLowerCase().includes(query) ||
          user.realName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
        );
      })
      .slice(0, 8);
  };

  const handleUserSearch = (event) => {
    const value = event.target.value;

    setUserSearch(value);

    const selectedUser =
      slackUsers.find(
        (user) =>
          user.userId === formData.userId &&
          user.name === value
      ) || null;

    setFormData((previous) => ({
      ...previous,
      user: value,
      userId: selectedUser ? selectedUser.userId : '',
    }));

    setShowUserSuggestions(true);
  };

  const handleUserFocus = () => {
    setShowUserSuggestions(true);
  };

  const handleUserSelect = (user) => {
    setUserSearch(user.name);

    setFormData((previous) => ({
      ...previous,
      user: user.name,
      userId: user.userId,
    }));

    setShowUserSuggestions(false);
  };

  const handleCcSearch = (event) => {
    setCcSearch(event.target.value);
    setShowCcSuggestions(true);
  };

  const handleCcFocus = () => {
    setShowCcSuggestions(true);
  };

  const handleCcSelect = (user) => {
    if (
      user.userId === formData.userId ||
      formData.ccUserIds.includes(user.userId)
    ) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      ccUserIds: [...previous.ccUserIds, user.userId],
    }));

    setCcSearch('');
    setShowCcSuggestions(true);
  };

  const handleRemoveCc = (userId) => {
    setFormData((previous) => ({
      ...previous,
      ccUserIds: previous.ccUserIds.filter((id) => id !== userId),
    }));
  };

  const handlePlatformChange = (event) => {
    const platform = event.target.value;
    setFormData((previous) => ({ ...previous, platform }));
    setSelectedChannel(getPlatformChannel(platform).name);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    setFormData((previous) => ({ ...previous, attachments: files }));
  };

  const resetForm = () => {
    setFormData({ ...INITIAL_FORM, attachments: [] });
    setUserSearch('');
    setCcSearch('');
    setShowUserSuggestions(false);
    setShowCcSuggestions(false);
    setSelectedChannel(DEFAULT_CHANNEL.name);
  };

  const exportAsZip = async () => {
    try {
      const JSZipModule = await import('jszip');
      const JSZip = JSZipModule.default || JSZipModule;
      const zip = new JSZip();

      const historyContent = conversationRef.current
        .map((entry, index) => (
          `[${index + 1}] ${entry.timestamp}\n` +
          `Channel: ${entry.channel}\n` +
          `Status: ${entry.status}\n---\n` +
          `User: ${entry.data.user} (${entry.data.userId})\n` +
          `Category: ${entry.data.category}\n` +
          `${entry.data.otherExplain ? `Other: ${entry.data.otherExplain}\n` : ''}` +
          `Priority: ${entry.data.priority}\n` +
          `Platform: ${entry.data.platform}\n`
        ))
        .join('\n');

      zip.file('conversation_history.txt', historyContent);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `ksc_ticket_history_${Date.now()}.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Error exporting: ${error.message}`);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.category ||
      !formData.platform ||
      !formData.whereHappening ||
      !formData.description ||
      !formData.userId
    ) {
      alert('Please select your name from the suggestions and fill all required fields.');
      return;
    }

    setLoading(true);

    try {
      const requestData = new FormData();
      requestData.append('user', formData.user);
      requestData.append('userId', formData.userId);
      requestData.append('category', formData.category);
      requestData.append('otherExplain', formData.otherExplain);
      requestData.append('priority', formData.priority);
      requestData.append('platform', formData.platform);
      requestData.append('whereHappening', formData.whereHappening);
      requestData.append('expectedVsActual', formData.expectedVsActual);
      requestData.append('description', formData.description);
      requestData.append('channel', selectedChannel);

      formData.ccUserIds.forEach((userId) => {
        requestData.append('ccUserIds', userId);
      });

      formData.attachments.forEach((file) => {
        requestData.append('attachments', file);
      });

      const response = await fetch('/api/slack/post-message', {
        method: 'POST',
        body: requestData,
      });

      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json')
        ? await response.json()
        : { success: false, error: `Server returned ${response.status} instead of JSON` };

      if (!result.success) {
        throw new Error(result.error || 'Unable to submit the ticket.');
      }

      const timestamp = new Date().toLocaleString();

      const entry = {
        timestamp,
        channel: selectedChannel,
        status: 'posted',
        data: { ...formData, attachments: [] },
      };

      conversationRef.current.push(entry);

      if (conversationRef.current.length > 15) {
        setTokenWarning(true);
      }

      setSubmissionSuccess({
        channel: selectedChannel,
        platform: formData.platform,
      });

      resetForm();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedCcUsers = slackUsers.filter((user) =>
    formData.ccUserIds.includes(user.userId)
  );

  const userSuggestions = getUserSuggestions(
    userSearch,
    formData.userId ? [formData.userId] : []
  );

  const ccSuggestions = getUserSuggestions(
    ccSearch,
    [formData.userId, ...formData.ccUserIds]
  );

  return (
    <>
      <Head>
        <title>KSC | IT & Website Request Form</title>
        <meta
          name="description"
          content="Kawaii Slime Company internal IT and website request form."
        />
        <meta name="theme-color" content="#fbdbe6" />
      </Head>

      <main className="ksc-page">
        <div className="ksc-shell">
          <header className="ksc-header">
            <div className="brand-mark">
              <img
                src="/logo.png"
                alt="Kawaii Slime Company"
                width="150"
                height="150"
              />
            </div>

            <div className="brand-copy">
              <p className="eyebrow">KAWAII SLIME COMPANY</p>
              <h1>IT &amp; Website Requests</h1>
              <p className="subtitle">
                Tell us what needs fixing, updating, or creating.
              </p>
            </div>

            {!submissionSuccess && conversationRef.current.length > 0 && (
              <div className="header-actions">
                <button
                  type="button"
                  className="button button-light"
                  onClick={() => setShowHistory((visible) => !visible)}
                >
                  {showHistory ? 'Hide history' : 'View history'} (
                  {conversationRef.current.length})
                </button>

                <button
                  type="button"
                  className="button button-soft"
                  onClick={exportAsZip}
                >
                  Export ZIP
                </button>
              </div>
            )}
          </header>

          {usersError && (
            <div className="notice notice-error" role="alert">
              <strong>Unable to load Slack users.</strong>
              <span>{usersError}</span>
            </div>
          )}

          {tokenWarning && (
            <div className="notice notice-warning" role="status">
              You have many submissions in this session. Export the conversation
              history if you need a copy.
            </div>
          )}

          {showHistory && (
            <section className="history-card" aria-label="Conversation history">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">SESSION</p>
                  <h2>Conversation History</h2>
                </div>
                <span className="count-pill">{conversationRef.current.length}</span>
              </div>

              {conversationRef.current.map((entry, index) => (
                <div className="history-item" key={`${entry.timestamp}-${index}`}>
                  <div className="history-meta">
                    #{index + 1} · {entry.timestamp}
                  </div>

                  <div className="history-main">
                    <strong>{entry.data.user}</strong>
                    <span>{entry.data.category}</span>
                    <span>#{entry.channel}</span>
                    <span className="status-pill">{entry.status}</span>
                  </div>
                </div>
              ))}
            </section>
          )}

          {submissionSuccess ? (
            <section className="success-card" aria-live="polite">
              <div className="success-icon">✓</div>
              <p className="section-kicker">ALL SET</p>
              <h2>Request submitted!</h2>
              <p>
                Your request for <strong>{submissionSuccess.platform}</strong> was
                sent to <strong>#{submissionSuccess.channel}</strong>.
              </p>

              <button
                type="button"
                className="button button-primary"
                onClick={() => setSubmissionSuccess(null)}
              >
                Submit another request
              </button>
            </section>
          ) : (
            <section className="form-card">
              <div className="form-intro">
                <p className="section-kicker">REQUEST DETAILS</p>
                <h2>Submit a ticket</h2>
                <p>
                  Please give us enough detail to reproduce the issue or understand
                  the request.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  {/* YOUR NAME */}
                  <Field label="Your Name" required>
                    <div
                      ref={userFieldRef}
                      className="autocomplete-wrapper"
                    >
                      <input
                        type="text"
                        value={userSearch}
                        onChange={handleUserSearch}
                        onFocus={handleUserFocus}
                        disabled={usersLoading || slackUsers.length === 0}
                        placeholder={
                          usersLoading
                            ? 'Loading Slack users...'
                            : usersError
                              ? 'Users unavailable'
                              : 'Start typing your name'
                        }
                        autoComplete="off"
                        className="form-control"
                      />

                      {showUserSuggestions &&
                        !usersLoading &&
                        userSuggestions.length > 0 && (
                          <div className="suggestions-list">
                            {userSuggestions.map((user) => (
                              <button
                                key={user.userId}
                                type="button"
                                className="suggestion-item"
                                onMouseDown={(event) =>
                                  event.preventDefault()
                                }
                                onClick={() => handleUserSelect(user)}
                              >
                                {user.name}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  </Field>

                  {/* CC */}
                  <Field
                    label="CC"
                    hint="Optional: type a name and select multiple people to mention in the ticket."
                  >
                    <div
                      ref={ccFieldRef}
                      className="autocomplete-wrapper"
                    >
                      <div className="multi-select-control">
                        {selectedCcUsers.map((user) => (
                          <span
                            key={user.userId}
                            className="cc-chip"
                          >
                            <span>{user.name}</span>

                            <button
                              type="button"
                              className="cc-chip-remove"
                              onClick={() =>
                                handleRemoveCc(user.userId)
                              }
                              aria-label={`Remove ${user.name}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}

                        <input
                          type="text"
                          value={ccSearch}
                          onChange={handleCcSearch}
                          onFocus={handleCcFocus}
                          disabled={
                            usersLoading || slackUsers.length === 0
                          }
                          placeholder={
                            selectedCcUsers.length > 0
                              ? 'Add another user'
                              : 'Start typing a name'
                          }
                          autoComplete="off"
                          className="multi-select-input"
                        />
                      </div>

                      {showCcSuggestions &&
                        !usersLoading &&
                        ccSuggestions.length > 0 && (
                          <div className="suggestions-list">
                            {ccSuggestions.map((user) => (
                              <button
                                key={user.userId}
                                type="button"
                                className="suggestion-item"
                                onMouseDown={(event) =>
                                  event.preventDefault()
                                }
                                onClick={() => handleCcSelect(user)}
                              >
                                {user.name}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  </Field>

                  {/* CATEGORY */}
                  <Field label="Category" required>
                    <div className="select-wrapper">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="form-control"
                      >
                        <option value="">Select an option</option>

                        {categoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Field>

                  {formData.category === 'Other' && (
                    <Field label="If Other, please explain">
                      <input
                        type="text"
                        name="otherExplain"
                        value={formData.otherExplain}
                        onChange={handleInputChange}
                        placeholder="Tell us a little more"
                        className="form-control"
                      />
                    </Field>
                  )}

                  {/* PRIORITY */}
                  <Field label="Priority" required>
                    <div className="select-wrapper">
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="form-control"
                      >
                        <option value="High">🔴 High</option>
                        <option value="Medium">🟡 Medium</option>
                        <option value="Low">🟢 Low</option>
                      </select>
                    </div>
                  </Field>

                  {/* PLATFORM */}
                  <Field label="Which Platform" required>
                    <div className="select-wrapper">
                      <select
                        name="platform"
                        value={formData.platform}
                        onChange={handlePlatformChange}
                        className="form-control"
                      >
                        <option value="">Select an option</option>

                        {platformOptions.map((platform) => (
                          <option key={platform} value={platform}>
                            {platform}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.platform && (
                      <div className="routing-note">
                        <span className="routing-dot" />
                        This ticket will be sent to{' '}
                        <strong>#{selectedChannel}</strong>
                      </div>
                    )}
                  </Field>

                  {/* WHERE */}
                  <Field label="Where it is Happening" required>
                    <input
                      type="text"
                      name="whereHappening"
                      value={formData.whereHappening}
                      onChange={handleInputChange}
                      placeholder="e.g. Shopify product page"
                      className="form-control"
                    />
                  </Field>

                  {/* EXPECTED VS ACTUAL */}
                  <Field
                    label="Expected vs. Actual"
                    hint="Optional: explain what you expected to happen and what happened instead."
                  >
                    <textarea
                      name="expectedVsActual"
                      value={formData.expectedVsActual}
                      onChange={handleInputChange}
                      placeholder={'Expected: ...\nActual: ...'}
                      className="form-control textarea"
                    />
                  </Field>

                  {/* ATTACHMENTS */}
                  <Field
                    label="Attachments"
                    hint="Screenshots are helpful for UI bugs and website issues. Max 5 MB per file."
                  >
                    <label className="upload-control">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                      />

                      <span className="upload-icon">＋</span>

                      <span>
                        <strong>Choose files</strong>
                        <small>
                          Upload screenshots or supporting files
                        </small>
                      </span>
                    </label>

                    {formData.attachments.length > 0 && (
                      <div className="attachment-count">
                        ✓ {formData.attachments.length} file
                        {formData.attachments.length === 1 ? '' : 's'} selected
                      </div>
                    )}
                  </Field>

                  {/* DESCRIPTION */}
                  <div className="field field-full">
                    <Field label="Ticket Description" required>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe the issue or request, including any relevant links, product names, steps, or examples."
                        className="form-control textarea description"
                      />
                    </Field>
                  </div>
                </div>

                <div className="cc-preview">
                  <div className="cc-preview-label">CC</div>

                  <div>
                    {selectedCcUsers.length > 0
                      ? selectedCcUsers
                          .map((user) => user.name)
                          .join(', ')
                      : 'No additional users selected'}
                  </div>
                </div>

                <div className="form-footer">
                  <p>
                    <span className="required">*</span> Required fields
                  </p>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={resetForm}
                      disabled={loading}
                    >
                      Clear
                    </button>

                    <button
                      type="submit"
                      className="button button-primary"
                      disabled={loading || usersLoading}
                    >
                      {loading ? 'Submitting...' : 'Submit request'}
                      {!loading && (
                        <span aria-hidden="true">→</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          )}

          <footer className="ksc-footer">
            <span>Made for the Kawaii Slime Company team</span>
            <span aria-hidden="true">♡</span>
          </footer>
        </div>
      </main>

      <style jsx>{`
        .autocomplete-wrapper {
          position: relative;
          width: 100%;
        }

        .suggestions-list {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 100;
          max-height: 220px;
          overflow-y: auto;
          background: #ffffff;
          border: 1px solid #e7c5d1;
          border-radius: 12px;
          box-shadow: 0 12px 28px rgba(139, 94, 60, 0.14);
        }

        .suggestion-item {
          display: block;
          width: 100%;
          padding: 10px 13px;
          border: 0;
          border-bottom: 1px solid #f3e4e9;
          background: #ffffff;
          color: var(--ksc-text);
          text-align: left;
          font-size: 14px;
          cursor: pointer;
        }

        .suggestion-item:last-child {
          border-bottom: 0;
        }

        .suggestion-item:hover {
          background: var(--ksc-pink-soft);
          color: var(--ksc-brown-dark);
        }

        .multi-select-control {
          width: 100%;
          min-height: 45px;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          padding: 5px 13px;
          border: 1px solid #e7c5d1;
          border-radius: 12px;
          background: #fffafd;
          color: var(--ksc-text);
        }

        .multi-select-control:focus-within {
          border-color: var(--ksc-blue);
          box-shadow: 0 0 0 4px rgba(154, 219, 239, 0.22);
        }

        .cc-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px 5px 9px;
          border-radius: 999px;
          background: var(--ksc-pink-soft);
          color: var(--ksc-brown);
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .cc-chip-remove {
          width: 17px;
          height: 17px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: var(--ksc-brown);
          cursor: pointer;
          font-size: 15px;
          line-height: 1;
        }

        .cc-chip-remove:hover {
          background: rgba(237, 127, 156, 0.16);
        }

        .multi-select-input {
          flex: 1;
          min-width: 130px;
          height: 32px;
          padding: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--ksc-text);
          font-size: 14px;
        }

        .multi-select-input::placeholder {
          color: #b5a29a;
        }

        .select-wrapper {
          position: relative;
        }

        .select-wrapper::after {
          content: '';
          position: absolute;
          top: 50%;
          right: 14px;
          width: 7px;
          height: 7px;
          border-right: 1.5px solid var(--ksc-brown);
          border-bottom: 1.5px solid var(--ksc-brown);
          transform: translateY(-65%) rotate(45deg);
          pointer-events: none;
        }

        .select-wrapper .form-control {
          appearance: none;
          -webkit-appearance: none;
          padding-right: 42px;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
