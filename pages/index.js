import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
 
export default function Home() {
  const [formData, setFormData] = useState({
    user: '',
    userId: '',
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
 
  const [selectedChannel, setSelectedChannel] = useState('flow-test');
  const [loading, setLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [tokenWarning, setTokenWarning] = useState(false);
  const conversationRef = useRef([]);
 
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
    'Other'
  ];
 
  // Display names for the channels. The API uses the corresponding Slack IDs.
  // Platforms without a mapping remain on the current flow-test webhook for now.
  const platformChannelMap = {
    'Retail - Kawaii Slime Company Web': 'dev-itgeeks-ksc',
    'Retail - Jellyland USA Web': 'dev-itgeeks-jellyland',
    'B2B - The Kawaii Company': 'dev-itgeeks-tkc',
    'Disney POS': 'jk-tickets-slack-pos',
    'Slack': 'flow-test',
    'Microsoft Sharepoint': 'flow-test',
    'Zendesk': 'flow-test',
    'Social Media': 'flow-test',
    'Other': 'flow-test',
  };
 
  // ✅ USEEFFECT - Real users fetch کریں جب component mount ہو
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
  }, []); // Dependency array خالی - صرف mount پر چلے
 
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
 
  const handlePlatformChange = (e) => {
    const platform = e.target.value;
    setFormData(prev => ({ ...prev, platform }));
    setSelectedChannel(platformChannelMap[platform] || 'flow-test');
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
      // The API route expects JSON (attachments are currently sent as a count).
      // Do not send Slack tokens from the browser; the API route keeps those secret.
      const response = await fetch('/api/slack/post-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: {
            user: formData.user,
            userId: formData.userId,
            category: formData.category,
            otherExplain: formData.otherExplain,
            priority: formData.priority,
            platform: formData.platform,
            whereHappening: formData.whereHappening,
            expectedVsActual: formData.expectedVsActual,
            description: formData.description,
            attachmentCount: formData.attachments.length,
          },
          channel: selectedChannel,
        }),
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
          category: '', 
          otherExplain: '',
          priority: 'Medium', 
          platform: '', 
          whereHappening: '', 
          expectedVsActual: '',
          attachments: [],
          description: '' 
        });
        setSelectedChannel('flow-test');
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
    backgroundColor: '#0f1419',
    border: '1px solid #444',
    borderRadius: '6px',
    color: '#e0e0e0',
    fontSize: '14px',
    boxSizing: 'border-box',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e0e0e0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '1.5em',
  };
 
  return (
    <>
      <Head>
        <title>IT/Website Requests Form</title>
      </Head>
 
      <div style={{ minHeight: '100vh', backgroundColor: '#0f1419', color: '#e0e0e0', padding: '20px', fontFamily: 'system-ui' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '24px' }}>📋 IT/Website Requests Form</h1>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {conversationRef.current.length > 0 && (
                <>
                  <button onClick={() => setShowHistory(!showHistory)} style={{ padding: '8px 16px', backgroundColor: '#1e88e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                    {showHistory ? '👁️ Hide' : '👁️ View'} ({conversationRef.current.length})
                  </button>
                  <button onClick={exportAsZip} style={{ padding: '8px 16px', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                    📦 Export Zip
                  </button>
                </>
              )}
            </div>
          </div>
 
          {usersError && (
            <div style={{ backgroundColor: '#f44336', color: '#fff', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
              ⚠️ Error loading users: {usersError}
            </div>
          )}
 
          {tokenWarning && (
            <div style={{ backgroundColor: '#d32f2f', color: '#fff', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
              ⚠️ Approaching token limit! Consider exporting conversation as ZIP.
            </div>
          )}
 
          {showHistory && (
            <div style={{ backgroundColor: '#1a1e27', border: '1px solid #333', borderRadius: '8px', padding: '16px', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0 }}>📝 Conversation History</h3>
              {conversationRef.current.map((entry, idx) => (
                <div key={idx} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #333' }}>
                  <div style={{ fontSize: '12px', color: '#888' }}>#{idx + 1} - {entry.timestamp}</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                    <strong>{entry.data.user}</strong> | {entry.data.category} | #{entry.channel} | <span style={{ color: entry.status === 'posted' ? '#4caf50' : '#f44336' }}>{entry.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
 
          {submissionSuccess ? (
            <div style={{ backgroundColor: '#1a1e27', border: '1px solid #333', borderRadius: '8px', padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <h2 style={{ margin: '0 0 12px' }}>Thank you!</h2>
              <p style={{ color: '#b8c0cc', margin: '0 0 8px' }}>Your request has been submitted successfully.</p>
              <p style={{ color: '#8ab4f8', margin: '0 0 24px' }}>
                It was sent to <strong>#{submissionSuccess.channel}</strong>
              </p>
              <button
                type="button"
                onClick={() => setSubmissionSuccess(null)}
                style={{ padding: '10px 24px', backgroundColor: '#1e88e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
              >
                Submit another request
              </button>
            </div>
          ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ backgroundColor: '#1a1e27', border: '1px solid #333', borderRadius: '8px', padding: '24px' }}>
              
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
                  <input type="text" name="otherExplain" value={formData.otherExplain} onChange={handleInputChange} placeholder="Write something" style={{ width: '100%', padding: '10px', backgroundColor: '#0f1419', border: '1px solid #444', borderRadius: '6px', color: '#e0e0e0', fontSize: '14px', boxSizing: 'border-box' }} />
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
                <div style={{ marginTop: '8px', color: '#8ab4f8', fontSize: '13px' }}>
                  📤 This ticket will be sent to: <strong>#{selectedChannel}</strong>
                </div>
              </div>
 
              {/* Where it is Happening */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Where it is Happening *</label>
                <input type="text" name="whereHappening" value={formData.whereHappening} onChange={handleInputChange} placeholder="Shopify" style={{ width: '100%', padding: '10px', backgroundColor: '#0f1419', border: '1px solid #444', borderRadius: '6px', color: '#e0e0e0', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
 
              {/* Expected vs. Actual */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Expected vs. Actual (optional)</label>
                <textarea name="expectedVsActual" value={formData.expectedVsActual} onChange={handleInputChange} placeholder="" style={{ width: '100%', padding: '10px', backgroundColor: '#0f1419', border: '1px solid #444', borderRadius: '6px', color: '#e0e0e0', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '150px', resize: 'vertical' }} />
              </div>
 
              {/* Attachments */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Attachments</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: '#0f1419', border: '1px solid #444', borderRadius: '6px' }}>
                  <span>📎</span>
                  <label style={{ cursor: 'pointer', flex: 1 }}>
                    <input type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                    <span style={{ color: '#1e88e5' }}>Upload file</span>
                  </label>
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Add screenshots of the bugs, issues or new feature.</div>
                {formData.attachments.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#4caf50' }}>
                    ✅ {formData.attachments.length} file(s) selected
                  </div>
                )}
              </div>
 
              {/* Ticket Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Ticket Description *</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="" style={{ width: '100%', padding: '10px', backgroundColor: '#0f1419', border: '1px solid #444', borderRadius: '6px', color: '#e0e0e0', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '100px', resize: 'vertical' }} />
              </div>
 
              {/* CC Section at Bottom */}
              {formData.userId && (
                <div style={{ backgroundColor: '#0f1419', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', border: '1px solid #333' }}>
                  CC: <span style={{ color: '#1e88e5' }}>{formData.userId}</span>
                </div>
              )}
 
              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setFormData({ user: '', userId: '', category: '', otherExplain: '', priority: 'Medium', platform: '', whereHappening: '', expectedVsActual: '', attachments: [], description: '' }); setSelectedChannel('flow-test'); }} style={{ padding: '10px 24px', backgroundColor: '#424242', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Close</button>
                <button type="submit" disabled={loading || usersLoading} style={{ padding: '10px 24px', backgroundColor: loading || usersLoading ? '#666' : '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading || usersLoading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}>{loading ? '⏳ Submitting...' : '✅ Submit'}</button>
              </div>
            </div>
          </form>
          )}
        </div>
      </div>
    </>
  );
}
 
