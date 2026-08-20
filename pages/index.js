import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Dynamically import JSZip to avoid SSR issues
const jsZipModule = dynamic(() => import('jszip'), { ssr: false });

export default function Home() {
  const [formData, setFormData] = useState({
    user: '',
    category: '',
    otherExplain: '',
    priority: 'Medium',
    platform: '',
    whereHappening: '',
    expectedVsActual: '',
    ticketDescription: '',
  });

  const [slackUsers, setSlackUsers] = useState([]);
  const [slackChannels, setSlackChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const conversationRef = useRef([]);

  const categoryOptions = [
    'UI/Design Bug',
    'Functionality Issue',
    'Mobile Responsive',
    'New Feature Request',
    'Security/Access',
    'Other',
  ];

  const priorityOptions = [
    { label: 'High', color: '#FF4444' },
    { label: 'Medium', color: '#FFC107' },
    { label: 'Low', color: '#4CAF50' },
  ];

  const platformOptions = [
    'Retail - Kawaii Slime Company',
    'Retail - Jellyland USA',
    'B2B - The Kawaii Company',
    'Slack',
    'Microsoft Sharepoint etc.',
    'Zendesk',
    'Social Media Technical Issues',
    'Other',
  ];

  // Fetch Slack data on mount
  useEffect(() => {
    fetchSlackData();
  }, []);

  const fetchSlackData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/slack/users-channels');
      
      if (response.ok) {
        const data = await response.json();
        setSlackUsers(data.users || []);
        setSlackChannels(data.channels || []);
      } else {
        // Fallback to mock data
        setSlackUsers([
          { id: 'U123', name: 'John Doe' },
          { id: 'U456', name: 'Jane Smith' },
          { id: 'U789', name: 'Team Lead' },
        ]);
        setSlackChannels([
          { id: 'C123', name: 'general' },
          { id: 'C456', name: 'it-requests' },
          { id: 'C789', name: 'bugs-and-issues' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching Slack data:', error);
      // Use fallback data
      setSlackUsers([
        { id: 'U123', name: 'John Doe' },
        { id: 'U456', name: 'Jane Smith' },
      ]);
      setSlackChannels([
        { id: 'C123', name: 'general' },
        { id: 'C456', name: 'it-requests' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.user ||
      !formData.category ||
      !formData.platform ||
      !formData.whereHappening ||
      !selectedChannel
    ) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Send to backend API for Slack posting
      const response = await fetch('/api/slack/post-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          channel: selectedChannel,
        }),
      });

      const result = await response.json();
      const success = result.success;

      const timestamp = new Date().toISOString();
      const entry = {
        timestamp,
        type: 'submission',
        data: formData,
        channel: selectedChannel,
        status: success ? 'posted' : 'failed',
      };

      conversationRef.current.push(entry);
      setConversationHistory([...conversationRef.current]);

      if (success) {
        alert('✅ Ticket posted to Slack successfully!');
        // Reset form
        setFormData({
          user: '',
          category: '',
          otherExplain: '',
          priority: 'Medium',
          platform: '',
          whereHappening: '',
          expectedVsActual: '',
          ticketDescription: '',
        });
        setSelectedChannel('');
      } else {
        alert('❌ Failed to post to Slack: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error submitting form: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportAsZip = async () => {
    try {
      const JSZip = (await jsZipModule).default;
      const zip = new JSZip();

      // Add conversation history
      const historyContent = conversationRef.current
        .map((entry) => {
          return `
[${entry.timestamp}] ${entry.type.toUpperCase()}
Channel: ${entry.channel}
Status: ${entry.status}
Data:
${JSON.stringify(entry.data, null, 2)}
---`;
        })
        .join('\n\n');

      zip.file('conversation_history.txt', historyContent);
      zip.file('current_form_state.json', JSON.stringify(formData, null, 2));
      zip.file(
        'metadata.json',
        JSON.stringify(
          {
            exportDate: new Date().toISOString(),
            totalSubmissions: conversationRef.current.filter((e) => e.type === 'submission')
              .length,
            token_warning: 'Continue your work with this context when creating a new session',
          },
          null,
          2
        )
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IT-Form-Conversation-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error creating zip: ' + error.message);
    }
  };

  return (
    <>
      <Head>
        <title>IT/Website Requests Form</title>
        <meta name="description" content="IT and Website Requests Form with Slack Integration" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0f1419',
          color: '#e0e0e0',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <h1 style={{ margin: 0, fontSize: '24px' }}>📋 IT/Website Requests Form</h1>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {conversationRef.current.length > 0 && (
                <>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#1e88e5',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    {showHistory ? '👁️ Hide' : '👁️ View'} History ({conversationRef.current.length})
                  </button>
                  <button
                    onClick={exportAsZip}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#4caf50',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    📦 Export Zip
                  </button>
                </>
              )}
            </div>
          </div>

          {/* History Panel */}
          {showHistory && (
            <div
              style={{
                backgroundColor: '#1a1e27',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              <h3 style={{ marginTop: 0 }}>📝 Conversation History</h3>
              {conversationRef.current.map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #333',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#888' }}>{entry.timestamp}</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                    <strong>Channel:</strong> {entry.channel} | <strong>Status:</strong>{' '}
                    <span style={{ color: entry.status === 'posted' ? '#4caf50' : '#f44336' }}>
                      {entry.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit}>
            <div
              style={{
                backgroundColor: '#1a1e27',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '24px',
              }}
            >
              {/* Your Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Your Name *
                </label>
                <select
                  name="user"
                  value={formData.user}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f1419',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select a user</option>
                  {slackUsers.map((user) => (
                    <option key={user.id} value={user.name}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f1419',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select an option</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* If Other, Explain */}
              {formData.category === 'Other' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    If Other, please explain
                  </label>
                  <input
                    type="text"
                    name="otherExplain"
                    value={formData.otherExplain}
                    onChange={handleInputChange}
                    placeholder="Write something"
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#0f1419',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      color: '#e0e0e0',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Priority */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Priority *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f1419',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  {priorityOptions.map((p) => (
                    <option key={p.label} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Which Platform */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Which Platform *
                </label>
                <select
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f1419',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select an option</option>
                  {platformOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Where it is Happening */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Where it is Happening *
                </label>
                <input
                  type="text"
                  name="whereHappening"
                  value={formData.whereHappening}
                  onChange={handleInputChange}
                  placeholder="Write website/page link where this bug/feature is happening"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f1419',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Expected vs Actual */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Expected vs. Actual
                </label>
                <textarea
                  name="expectedVsActual"
                  value={formData.expectedVsActual}
                  onChange={handleInputChange}
                  placeholder="What were you expecting and what is actually happening?"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f1419',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    minHeight: '80px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Slack Channel Selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Post to Slack Channel *
                </label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f1419',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select a channel</option>
                  {slackChannels.map((channel) => (
                    <option key={channel.id} value={channel.name}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                  Ticket will be posted to this channel
                </div>
              </div>

              {/* Ticket Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Ticket Description *
                </label>
                <textarea
                  name="ticketDescription"
                  value={formData.ticketDescription}
                  onChange={handleInputChange}
                  placeholder="Add description about your ticket"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f1419',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    minHeight: '100px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      user: '',
                      category: '',
                      otherExplain: '',
                      priority: 'Medium',
                      platform: '',
                      whereHappening: '',
                      expectedVsActual: '',
                      ticketDescription: '',
                    });
                    setSelectedChannel('');
                  }}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#424242',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: loading ? '#666' : '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  {loading ? '⏳ Submitting...' : '✅ Submit'}
                </button>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
            <p>Ticket will be automatically posted to selected Slack channel</p>
          </div>
        </div>
      </div>
    </>
  );
}
