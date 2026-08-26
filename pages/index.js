import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { DEFAULT_CHANNEL, getPlatformChannel } from '../lib/slack-channels';
 
export default function Home() {
  const [formData, setFormData] = useState({
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
  });
 
  // ✅ Real Slack users state
  const [slackUsers, setSlackUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);
 
  const [selectedChannel, setSelectedChannel] = useState(DEFAULT_CHANNEL.name);
  const [loading, setLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [tokenWarning, setTokenWarning] = useState(false);
  const conversationRef = useRef([]);
  const bubbleLayerRef = useRef(null);
 
  const categoryOptions = ['UI/Design Bug', 'Functionality Issue', 'Mobile Responsive', 'New Feature Request', 'Security/Access', 'Other'];
  
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
    'Other'
  ];
 
 
  // ✅ Fetch real Slack users when the component mounts
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
          console.log(`✅ Loaded ${data.users.length} real users from Slack`);
        } else {
          throw new Error(data.error || 'Failed to fetch users');
        }
      } catch (error) {
        console.error('❌ Error fetching Slack users:', error);
        setUsersError(error.message);
        
        // Never show fake users when Slack is unavailable.
        setSlackUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };
 
    fetchSlackUsers();
  }, []); // Run once when the component mounts

  // Match the KSC website's click-and-drag bubble trail.
  useEffect(() => {
    const layer = bubbleLayerRef.current;
    if (!layer) return undefined;

    let pointerDown = false;
    let animationFrame;
    let lastFrame = performance.now();
    const bubbles = [];
    const lifetime = 5000;
    const maxBubbles = 70;

    const createBubble = (x, y) => {
      const size = 10 + Math.random() * 24;
      const bubble = document.createElement('span');
      bubble.setAttribute('aria-hidden', 'true');
      bubble.style.position = 'fixed';
      bubble.style.left = `${x - size}px`;
      bubble.style.top = `${y - size}px`;
      bubble.style.width = `${size * 2}px`;
      bubble.style.height = `${size * 2}px`;
      bubble.style.borderRadius = '50%';
      bubble.style.pointerEvents = 'none';
      bubble.style.opacity = '0.75';
      bubble.style.background = 'radial-gradient(circle at 30% 28%, #ffffff 0 12%, #b1e0f9 48%, #c7eaf9 72%, rgba(255, 255, 255, 0.25) 100%)';
      bubble.style.border = '1px solid rgba(139, 94, 59, 0.18)';
      bubble.style.boxShadow = 'inset -3px -4px 8px rgba(120, 214, 240, 0.28), 0 2px 8px rgba(139, 94, 59, 0.12)';
      layer.appendChild(bubble);

      bubbles.push({
        element: bubble,
        size,
        remaining: lifetime,
        x,
        y,
        velocityX: (Math.random() - 0.5) * 0.04,
        velocityY: 0,
      });

      while (bubbles.length > maxBubbles) {
        const oldest = bubbles.shift();
        oldest?.element.remove();
      }
    };

    const onPointerDown = () => {
      pointerDown = true;
    };

    const onPointerUp = () => {
      pointerDown = false;
    };

    const onPointerMove = event => {
      if (pointerDown) createBubble(event.clientX, event.clientY);
    };

    const animate = now => {
      const delta = Math.min(now - lastFrame, 50);
      lastFrame = now;

      for (let index = bubbles.length - 1; index >= 0; index -= 1) {
        const bubble = bubbles[index];
        bubble.remaining -= delta;
        bubble.velocityY += 0.0025 * delta;
        bubble.velocityX -= bubble.velocityX * 0.001 * bubble.size * delta;
        bubble.velocityY -= bubble.velocityY * 0.001 * bubble.size * delta;
        bubble.x += bubble.velocityX * delta;
        bubble.y -= bubble.velocityY * delta;
        bubble.element.style.left = `${bubble.x - bubble.size}px`;
        bubble.element.style.top = `${bubble.y - bubble.size}px`;
        bubble.element.style.opacity = `${0.7 * Math.max(bubble.remaining / lifetime, 0)}`;

        if (bubble.remaining <= 0) {
          bubble.element.remove();
          bubbles.splice(index, 1);
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('pointermove', onPointerMove);
    animationFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(animationFrame);
      bubbles.forEach(bubble => bubble.element.remove());
    };
  }, []);
 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
 
  const handleUserChange = (e) => {
    const userId = e.target.value;
    const user = slackUsers.find(u => u.userId === userId);
    if (user) {
      setFormData(prev => ({ 
        ...prev, 
        user: user.name,
        userId: user.userId
      }));
    }
  };
 
  const handleCcChange = (e) => {
    const ccUserIds = e.target.value ? [e.target.value] : [];
    setFormData(prev => ({ ...prev, ccUserIds }));
  };

  const handlePlatformChange = (e) => {
    const platform = e.target.value;
    setFormData(prev => ({ ...prev, platform }));
    setSelectedChannel(getPlatformChannel(platform).name);
  };
 
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, attachments: files }));
  };
 
  const exportAsZip = async () => {
    try {
      const JSZip = await import('jszip');
      const zip = new JSZip.default();
 
      const historyContent = conversationRef.current
        .map((entry, idx) => {
          return `[${idx + 1}] ${entry.timestamp}\nChannel: ${entry.channel}\nStatus: ${entry.status}\n---\nUser: ${entry.data.user} (${entry.data.userId})\nCategory: ${entry.data.category}\n${entry.data.otherExplain ? `Other: ${entry.data.otherExplain}` : ''}\nPriority: ${entry.data.priority}\nPlatform: ${entry.data.platform}\n`;
        })
        .join('\n');
 
      zip.file('conversation_history.txt', historyContent);
 
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form_export_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error exporting: ' + error.message);
    }
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
 
    if (!formData.category || !formData.platform || !formData.whereHappening || !formData.description || !formData.userId) {
      alert('❌ Please fill all required fields');
      return;
    }
 
    setLoading(true);
 
    try {
      // Send the real files to the server. The server uploads them to Slack
      // without exposing the Slack token in the browser.
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
      formData.ccUserIds.forEach(userId => requestData.append('ccUserIds', userId));
      formData.attachments.forEach(file => requestData.append('attachments', file));

      const response = await fetch('/api/slack/post-message', {
        method: 'POST',
        body: requestData,
      });

      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json')
        ? await response.json()
        : { success: false, error: `Server returned ${response.status} instead of JSON` };
 
      if (result.success) {
        setSubmissionSuccess({
          channel: selectedChannel,
          platform: formData.platform,
        });
 
        const timestamp = new Date().toLocaleString();
        const entry = {
          timestamp,
          channel: selectedChannel,
          status: 'posted',
          data: formData,
        };
 
        conversationRef.current.push(entry);
        setConversationHistory([...conversationRef.current]);
 
        if (conversationRef.current.length > 15) {
          setTokenWarning(true);
        }
 
        setFormData({ 
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
          description: '' 
        });
        setSelectedChannel(DEFAULT_CHANNEL.name);
      } else {
        alert('❌ Failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
 
  const selectStyle = {
    width: '100%',
    padding: '10px',
    paddingRight: '35px',
    backgroundColor: '#fff6f6',
    border: '1px solid #f2a5a3',
    borderRadius: '10px',
    color: '#8b5e3b',
    fontSize: '14px',
    boxSizing: 'border-box',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b5e3b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '1.5em',
  };

  const selectedCcUsers = slackUsers.filter(user => formData.ccUserIds.includes(user.userId));
 
  return (
    <>
      <Head>
        <title>KSC Tickets</title>
      </Head>
 
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fbdce6 0%, #c7eaf9 100%)', color: '#8b5e3b', padding: '24px 20px 40px', fontFamily: 'Quicksand, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <div ref={bubbleLayerRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 20, overflow: 'hidden' }} />
        <div style={{ maxWidth: '760px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img
              src="/logo.png"
              alt="Kawaii Slime Company"
              style={{ display: 'block', width: '150px', height: '150px', objectFit: 'contain', margin: '0 auto 10px' }}
            />
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', letterSpacing: '0.2px', color: '#8b5e3b' }}>KSC Tickets</h1>
            <p style={{ margin: '6px 0 0', color: '#906645', fontSize: '15px', fontWeight: '500' }}>IT and Website Request Form</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
              {!submissionSuccess && conversationRef.current.length > 0 && (
                <>
                  <button onClick={() => setShowHistory(!showHistory)} style={{ padding: '8px 16px', backgroundColor: '#8b5e3b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    {showHistory ? '👁️ Hide' : '👁️ View'} ({conversationRef.current.length})
                  </button>
                  <button onClick={exportAsZip} style={{ padding: '8px 16px', backgroundColor: '#ff7380', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    📦 Export Zip
                  </button>
                </>
              )}
            </div>
          </div>
 
          {usersError && (
            <div style={{ backgroundColor: '#e96b77', color: '#fff', padding: '12px', borderRadius: '10px', marginBottom: '20px' }}>
              ⚠️ Error loading users: {usersError}
            </div>
          )}
 
          {tokenWarning && (
            <div style={{ backgroundColor: '#e96b77', color: '#fff', padding: '12px', borderRadius: '10px', marginBottom: '20px' }}>
              ⚠️ Approaching token limit! Consider exporting conversation as ZIP.
            </div>
          )}
 
          {showHistory && (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #f9ccda', borderRadius: '14px', padding: '16px', boxShadow: '0 8px 24px rgba(139, 94, 59, 0.10)', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0 }}>📝 Conversation History</h3>
              {conversationRef.current.map((entry, idx) => (
                <div key={idx} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f9ccda' }}>
                  <div style={{ fontSize: '12px', color: '#906645' }}>#{idx + 1} - {entry.timestamp}</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                    <strong>{entry.data.user}</strong> | {entry.data.category} | #{entry.channel} | <span style={{ color: entry.status === 'posted' ? '#ff7380' : '#e96b77' }}>{entry.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
 
          {submissionSuccess ? (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #f9ccda', borderRadius: '14px', padding: '40px 24px', boxShadow: '0 8px 24px rgba(139, 94, 59, 0.10)', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <h2 style={{ margin: '0 0 12px' }}>Thank you!</h2>
              <p style={{ color: '#906645', margin: '0 0 8px' }}>Your request has been submitted successfully.</p>
              <p style={{ color: '#2f5363', margin: '0 0 24px' }}>
                It was sent to <strong>#{submissionSuccess.channel}</strong>
              </p>
              <button
                type="button"
                onClick={() => setSubmissionSuccess(null)}
                style={{ padding: '10px 24px', backgroundColor: '#8b5e3b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
              >
                Submit another request
              </button>
            </div>
          ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #f9ccda', borderRadius: '14px', padding: '24px', boxShadow: '0 8px 24px rgba(139, 94, 59, 0.10)' }}>
              
              {/* Your Name - DROPDOWN with real users */}
              <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Your Name *
                </label>
                <select 
                  value={formData.userId} 
                  onChange={handleUserChange} 
                  disabled={usersLoading || slackUsers.length === 0}
                  style={{...selectStyle, opacity: usersLoading ? 0.6 : 1}}
                >
                  <option value="">
                    {usersError ? 'Users unavailable' : 'Select a user'}
                  </option>
                  {slackUsers.map(user => (
                    <option key={user.userId} value={user.userId}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* CC users */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  CC (optional)
                </label>
                <select
                  value={formData.ccUserIds[0] || ''}
                  onChange={handleCcChange}
                  disabled={usersLoading || slackUsers.length === 0}
                  style={{...selectStyle, opacity: usersLoading ? 0.6 : 1}}
                >
                  <option value="">No CC user</option>
                  {slackUsers.map(user => (
                    <option key={user.userId} value={user.userId}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '12px', color: '#906645', marginTop: '4px' }}>
                  Optional: Select a user to CC.
                </div>
              </div>
 
              {/* Category */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Category *</label>
                <select name="category" value={formData.category} onChange={handleInputChange} style={selectStyle}>
                  <option value="">Select an option</option>
                  {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
 
              {/* If Other, Explain */}
              {formData.category === 'Other' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>If Other, please explain (optional)</label>
                  <input type="text" name="otherExplain" value={formData.otherExplain} onChange={handleInputChange} placeholder="Write something" style={{ width: '100%', padding: '10px', backgroundColor: '#fff6f6', border: '1px solid #f2a5a3', borderRadius: '10px', color: '#8b5e3b', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              )}
 
              {/* Priority */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Priority *</label>
                <select name="priority" value={formData.priority} onChange={handleInputChange} style={selectStyle}>
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>
 
              {/* Platform */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Which Platform *</label>
                <select name="platform" value={formData.platform} onChange={handlePlatformChange} style={selectStyle}>
                  <option value="">Select an option</option>
                  {platformOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {formData.platform && (
                  <div style={{ marginTop: '8px', color: '#2f5363', fontSize: '13px' }}>
                    📤 This ticket will be sent to: <strong>#{selectedChannel}</strong>
                  </div>
                )}
              </div>
 
              {/* Where it is Happening */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Where it is Happening *</label>
                <input type="text" name="whereHappening" value={formData.whereHappening} onChange={handleInputChange} placeholder="Shopify" style={{ width: '100%', padding: '10px', backgroundColor: '#fff6f6', border: '1px solid #f2a5a3', borderRadius: '10px', color: '#8b5e3b', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
 
              {/* Expected vs. Actual */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Expected vs. Actual (optional)</label>
                <textarea name="expectedVsActual" value={formData.expectedVsActual} onChange={handleInputChange} placeholder="" style={{ width: '100%', padding: '10px', backgroundColor: '#fff6f6', border: '1px solid #f2a5a3', borderRadius: '10px', color: '#8b5e3b', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '150px', resize: 'vertical' }} />
              </div>
 
              {/* Attachments */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Attachments</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: '#fff6f6', border: '1px solid #f2a5a3', borderRadius: '10px' }}>
                  <span>📎</span>
                  <label style={{ cursor: 'pointer', flex: 1 }}>
                    <input type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                    <span style={{ color: '#8b5e3b' }}>Upload file</span>
                  </label>
                </div>
                <div style={{ fontSize: '12px', color: '#906645', marginTop: '4px' }}>Add screenshots of the bugs, issues or new feature.</div>
                {formData.attachments.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#ff7380' }}>
                    ✅ {formData.attachments.length} file(s) selected
                  </div>
                )}
              </div>
 
              {/* Ticket Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Ticket Description *</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="" style={{ width: '100%', padding: '10px', backgroundColor: '#fff6f6', border: '1px solid #f2a5a3', borderRadius: '10px', color: '#8b5e3b', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '100px', resize: 'vertical' }} />
              </div>
 
              {/* CC preview */}
              <div style={{ backgroundColor: '#fff6f6', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', border: '1px solid #f9ccda' }}>
                <strong>CC:</strong>{' '}
                {selectedCcUsers.length > 0
                  ? selectedCcUsers.map(user => user.name).join(', ')
                  : 'No additional users selected'}
              </div>
 
              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setFormData({ user: '', userId: '', ccUserIds: [], category: '', otherExplain: '', priority: 'Medium', platform: '', whereHappening: '', expectedVsActual: '', attachments: [], description: '' }); setSelectedChannel(DEFAULT_CHANNEL.name); }} style={{ padding: '10px 24px', backgroundColor: '#8b5e3b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Close</button>
                <button type="submit" disabled={loading || usersLoading} style={{ padding: '10px 24px', backgroundColor: loading || usersLoading ? '#c2c2c2' : '#ff7380', color: '#fff', border: 'none', borderRadius: '10px', cursor: loading || usersLoading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}>{loading ? '⏳ Submitting...' : '✅ Submit'}</button>
              </div>
            </div>
          </form>
          )}
        </div>
      </div>
    </>
  );
}
 
