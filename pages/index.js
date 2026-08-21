import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  const [formData, setFormData] = useState({
    user: '',
    category: '',
    otherExplain: '',
    priority: 'Medium',
    platform: '',
    whereHappening: '',
    expectedVsActual: '',
    attachments: [],
    description: '',
  });

  const [selectedChannel, setSelectedChannel] = useState('flow-test');
  const [loading, setLoading] = useState(false);
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

  const channelOptions = ['flow-test', 'general', 'it-requests', 'bugs', 'features', 'other'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
          return `[${idx + 1}] ${entry.timestamp}
Channel: ${entry.channel}
Status: ${entry.status}
---
User: ${entry.data.user}
Category: ${entry.data.category}
${entry.data.otherExplain ? `Other Explanation: ${entry.data.otherExplain}` : ''}
Priority: ${entry.data.priority}
Platform: ${entry.data.platform}
Where it's Happening: ${entry.data.whereHappening}
Expected vs. Actual: ${entry.data.expectedVsActual}
Description: ${entry.data.description}
Attachments: ${entry.data.attachments ? entry.data.attachments.length + ' file(s)' : 'None'}
---`;
        })
        .join('\n\n');

      zip.file('conversation_history.txt', historyContent);
      zip.file('current_form_state.json', JSON.stringify(formData, null, 2));
      zip.file('metadata.json', JSON.stringify({
        exportDate: new Date().toISOString(),
        totalSubmissions: conversationRef.current.length,
      }, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IT-Form-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error creating zip: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.user || !formData.category || !formData.platform || !formData.whereHappening || !selectedChannel) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/slack/post-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          formData: {
            user: formData.user,
            category: formData.category,
            otherExplain: formData.otherExplain,
            priority: formData.priority,
            platform: formData.platform,
            whereHappening: formData.whereHappening,
            expectedVsActual: formData.expectedVsActual,
            description: formData.description,
            attachmentCount: formData.attachments.length,
          },
          channel: selectedChannel 
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Ticket posted to #' + selectedChannel + '!');
        
        const timestamp = new Date().toISOString();
        const entry = {
          timestamp,
          data: formData,
          channel: selectedChannel,
          status: 'posted',
        };

        conversationRef.current.push(entry);
        setConversationHistory([...conversationRef.current]);

        if (conversationRef.current.length > 15) {
          setTokenWarning(true);
        }

        setFormData({ 
          user: '', 
          category: '', 
          otherExplain: '',
          priority: 'Medium', 
          platform: '', 
          whereHappening: '', 
          expectedVsActual: '',
          attachments: [],
          description: '' 
        });
      } else {
        alert('❌ Failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
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

          <form onSubmit={handleSubmit}>
            <div style={{ backgroundColor: '#1a1e27', border: '1px solid #333', borderRadius: '8px', padding: '24px' }}>
              
              {/* Your Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Your Name *</label>
                <input type="text" name="user" value={formData.user} onChange={handleInputChange} placeholder="Enter your name" style={{ width: '100%', padding: '10px', backgroundColor: '#0f1419', border: '1px solid #444', borderRadius: '6px', color: '#e0e0e0', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>

              {/* Category */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Category *</label>
                <select name="category" value={formData.category} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#0f1419', border: '1px solid #444', borderRadius: '6px', color: '#e0e0e0', fontSize: '14px', boxSizing: 'border-box' }}>
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
                <select name="priority" value={formData.priority} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#0f1419', border: '1px solid #444', borderRadius: '6px', color: '#e0e0e0', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>

              {/* Platform */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Which Platform *</label>
                <select name="platform" value={formData.platform} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#0f1419', border: '1px solid #444', borderRadius: '6px', color: '#e0e0e0', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option value="">Select an option</option>
                  {platformOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Where it is Happening */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Where it is Happening *</label>
                <input type="text" name="whereHappening" value={formData.whereHappening} onChange={handleInputChange} placeholder="URL or page link" style={{ width: '100%', padding: '10px', backgroundColor: '#0f1419', border: '1px solid #444', borderRadius: '6px', color: '#e0e0e0', fontSize: '14px', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Add website/page link where this bug/feature is happening or going to happen.</div>
              </div>

              {/* Expected vs. Actual */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Expected vs. Actual (optional)</label>
                <textarea name="expectedVsActual" value={formData.expectedVsActual} onChange={handleInputChange} placeholder="What you were expecting and what is actually happening?" style={{ width: '100%', padding: '10px', backgroundColor: '#0f1419', border: '1px solid #444', borderRadius: '6px', color: '#e0e0e0', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '80px', resize: 'vertical' }} />
              </div>

              {/* Attachments */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Attachments</label>
                <input type="file" multiple onChange={handleFileChange} style={{ display: 'block', marginBottom: '8px', padding: '10px', backgroundColor: '#0f1419', border: '1px solid #444', borderRadius: '6px', color: '#e0e0e0', fontSize: '14px', boxSizing: 'border-box', width: '100%' }} />
                <div style={{ fontSize: '12px', color: '#888' }}>Add screenshots of the bugs, issues or new feature.</div>
                {formData.attachments.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#4caf50' }}>
                    ✅ {formData.attachments.length} file(s) selected
                  </div>
                )}
              </div>

              {/* Slack Channel */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Post to Slack Channel *</label>
                <select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#0f1419', border: '1px solid #444', borderRadius: '6px', color: '#e0e0e0', fontSize: '14px', boxSizing: 'border-box' }}>
                  {channelOptions.map(ch => <option key={ch} value={ch}>#{ch}</option>)}
                </select>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Ticket Description *</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Add description about your ticket" style={{ width: '100%', padding: '10px', backgroundColor: '#0f1419', border: '1px solid #444', borderRadius: '6px', color: '#e0e0e0', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '100px', resize: 'vertical' }} />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setFormData({ user: '', category: '', otherExplain: '', priority: 'Medium', platform: '', whereHappening: '', expectedVsActual: '', attachments: [], description: '' }); }} style={{ padding: '10px 24px', backgroundColor: '#424242', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Close</button>
                <button type="submit" disabled={loading} style={{ padding: '10px 24px', backgroundColor: loading ? '#666' : '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}>{loading ? '⏳ Submitting...' : '✅ Submit'}</button>
              </div>
            </div>
          </form>

          <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
            <p>Ticket will be posted to selected Slack channel</p>
          </div>
        </div>
      </div>
    </>
  );
}
