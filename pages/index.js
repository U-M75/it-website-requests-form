import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  const [formData, setFormData] = useState({
    user: '',
    category: '',
    priority: 'Medium',
    platform: '',
    whereHappening: '',
    description: '',
  });

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

  // Automatic channel - flow-test
  const CHANNEL = 'flow-test';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
Data:
User: ${entry.data.user}
Category: ${entry.data.category}
Priority: ${entry.data.priority}
Platform: ${entry.data.platform}
Location: ${entry.data.whereHappening}
Description: ${entry.data.description}
---`;
        })
        .join('\n\n');

      zip.file('conversation_history.txt', historyContent);
      zip.file('current_form_state.json', JSON.stringify(formData, null, 2));
      zip.file('metadata.json', JSON.stringify({
        exportDate: new Date().toISOString(),
        totalSubmissions: conversationRef.current.length,
        channel: CHANNEL,
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

    if (!formData.user || !formData.category || !formData.platform || !formData.whereHappening) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/slack/post-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, channel: CHANNEL }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Ticket posted to flow-test!');
        
        const timestamp = new Date().toISOString();
        const entry = {
          timestamp,
          data: formData,
          channel: CHANNEL,
          status: 'posted',
        };

        conversationRef.current.push(entry);
        setConversationHistory([...conversationRef.current]);

        // Check if approaching token limit (rough estimate)
        if (conversationRef.current.length > 15) {
          setTokenWarning(true);
        }

        setFormData({ user: '', category: '', priority: 'Medium', platform: '', whereHappening: '', description: '' });
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
                    <strong>{entry.data.user}</strong> | {entry.data.category} | <span style={{ color: entry.status === 'posted' ? '#4caf50' : '#f44336' }}>{entry.status}</span>
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
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description *</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe the issue..." style={{ width: '100%', padding: '10px', backgroundColor: '#0f1419', border: '1px solid #444', borderRadius: '6px', color: '#e0e0e0', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '100px', resize: 'vertical' }} />
              </div>

              {/* Channel Info */}
              <div style={{ backgroundColor: '#0f1419', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', color: '#888' }}>
                📌 All tickets automatically post to: <strong>#flow-test</strong>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setFormData({ user: '', category: '', priority: 'Medium', platform: '', whereHappening: '', description: '' }); }} style={{ padding: '10px 24px', backgroundColor: '#424242', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Clear</button>
                <button type="submit" disabled={loading} style={{ padding: '10px 24px', backgroundColor: loading ? '#666' : '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}>{loading ? '⏳ Submitting...' : '✅ Submit'}</button>
              </div>
            </div>
          </form>

          <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
            <p>Tickets posted to #flow-test channel</p>
          </div>
        </div>
      </div>
    </>
  );
}
