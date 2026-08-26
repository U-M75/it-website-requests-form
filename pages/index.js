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
  const [selectedChannel, setSelectedChannel] = useState(DEFAULT_CHANNEL.name);
  const [loading, setLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [tokenWarning, setTokenWarning] = useState(false);
  const conversationRef = useRef([]);
  const bubbleLayerRef = useRef(null);

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

  // KSC-style bubble trail: bubbles follow the pointer while the user moves around the form.
  useEffect(() => {
    const layer = bubbleLayerRef.current;
    if (!layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const bubbles = [];
    const lifetime = 2200;
    const maxBubbles = 42;
    let lastCreatedAt = 0;
    let animationFrame;

    const createBubble = (x, y) => {
      const size = 7 + Math.random() * 15;
      const bubble = document.createElement('span');
      bubble.className = 'cursor-bubble';
      bubble.setAttribute('aria-hidden', 'true');

      const hue = Math.random() > 0.5 ? 'pink' : 'blue';
      bubble.dataset.color = hue;
      bubble.style.left = `${x - size}px`;
      bubble.style.top = `${y - size}px`;
      bubble.style.width = `${size * 2}px`;
      bubble.style.height = `${size * 2}px`;

      layer.appendChild(bubble);

      bubbles.push({
        element: bubble,
        size,
        x,
        y,
        remaining: lifetime,
        driftX: (Math.random() - 0.5) * 0.045,
        driftY: -(0.015 + Math.random() * 0.025),
      });

      while (bubbles.length > maxBubbles) {
        bubbles.shift()?.element.remove();
      }
    };

    const onPointerMove = (event) => {
      const now = performance.now();
      if (now - lastCreatedAt < 32) return;
      lastCreatedAt = now;
      createBubble(event.clientX, event.clientY);
    };

    const animate = (now) => {
      for (let index = bubbles.length - 1; index >= 0; index -= 1) {
        const bubble = bubbles[index];
        bubble.remaining -= 16;
        bubble.x += bubble.driftX * 16;
        bubble.y += bubble.driftY * 16;

        const progress = Math.max(bubble.remaining / lifetime, 0);
        const scale = 0.65 + (1 - progress) * 0.45;

        bubble.element.style.left = `${bubble.x - bubble.size}px`;
        bubble.element.style.top = `${bubble.y - bubble.size}px`;
        bubble.element.style.opacity = `${0.52 * progress}`;
        bubble.element.style.transform = `scale(${scale})`;

        if (bubble.remaining <= 0) {
          bubble.element.remove();
          bubbles.splice(index, 1);
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    animationFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(animationFrame);
      bubbles.forEach((bubble) => bubble.element.remove());
    };
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleUserChange = (event) => {
    const userId = event.target.value;
    const user = slackUsers.find((item) => item.userId === userId);

    setFormData((previous) => ({
      ...previous,
      user: user?.name || '',
      userId,
    }));
  };

  const handleCcChange = (event) => {
    const ccUserIds = event.target.value ? [event.target.value] : [];
    setFormData((previous) => ({ ...previous, ccUserIds }));
  };

  const handlePlatformChange = (event) => {
    const platform = event.target.value;
    setFormData((previous) => ({ ...previous, platform }));
    setSelectedChannel(getPlatformChannel(platform).name);
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    setFormData((previous) => ({ ...previous, attachments: files }));
  };

  const resetForm = () => {
    setFormData({ ...INITIAL_FORM, attachments: [] });
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
      alert('Please fill all required fields.');
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
        <div ref={bubbleLayerRef} className="bubble-layer" aria-hidden="true" />

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
                  <Field label="Your Name" required>
                    <select
                      value={formData.userId}
                      onChange={handleUserChange}
                      disabled={usersLoading || slackUsers.length === 0}
                      className="form-control"
                    >
                      <option value="">
                        {usersLoading
                          ? 'Loading Slack users...'
                          : usersError
                            ? 'Users unavailable'
                            : 'Select a user'}
                      </option>
                      {slackUsers.map((user) => (
                        <option key={user.userId} value={user.userId}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="CC"
                    hint="Optional: select one additional person to mention in the ticket."
                  >
                    <select
                      value={formData.ccUserIds[0] || ''}
                      onChange={handleCcChange}
                      disabled={usersLoading || slackUsers.length === 0}
                      className="form-control"
                    >
                      <option value="">No CC user</option>
                      {slackUsers.map((user) => (
                        <option key={user.userId} value={user.userId}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Category" required>
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

                  <Field label="Priority" required>
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
                  </Field>

                  <Field label="Which Platform" required>
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

                    {formData.platform && (
                      <div className="routing-note">
                        <span className="routing-dot" />
                        This ticket will be sent to <strong>#{selectedChannel}</strong>
                      </div>
                    )}
                  </Field>

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

                  <Field
                    label="Expected vs. Actual"
                    hint="Optional: explain what you expected to happen and what happened instead."
                  >
                    <textarea
                      name="expectedVsActual"
                      value={formData.expectedVsActual}
                      onChange={handleInputChange}
                      placeholder="Expected: ...&#10;Actual: ..."
                      className="form-control textarea"
                    />
                  </Field>

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
                        <small>Upload screenshots or supporting files</small>
                      </span>
                    </label>

                    {formData.attachments.length > 0 && (
                      <div className="attachment-count">
                        ✓ {formData.attachments.length} file
                        {formData.attachments.length === 1 ? '' : 's'} selected
                      </div>
                    )}
                  </Field>

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
                      ? selectedCcUsers.map((user) => user.name).join(', ')
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
                      {!loading && <span aria-hidden="true">→</span>}
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
    </>
  );
}
