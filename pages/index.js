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

  const [slackUsers, setSlackUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);

  const [userSuggestions, setUserSuggestions] = useState([]);
  const [ccSuggestions, setCcSuggestions] = useState([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [showCcSuggestions, setShowCcSuggestions] = useState(false);
  const [ccSearch, setCcSearch] = useState('');

  const userInputRef = useRef(null);
  const ccInputRef = useRef(null);

  const [selectedChannel, setSelectedChannel] = useState(DEFAULT_CHANNEL.name);
  const [loading, setLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [tokenWarning, setTokenWarning] = useState(false);
  const conversationRef = useRef([]);

  const categoryOptions = [
    'UI/Design Bug',
    'Functionality Issue',
    'Mobile Responsive',
    'New Feature Request',
    'Security/Access',
    'Other'
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
    'Other'
  ];

  useEffect(() => {
    const fetchSlackUsers = async () => {
      try {
        setUsersLoading(true);
        setUsersError(null);

        const response = await fetch('/api/slack/get-users');
        const contentType = response.headers.get('content-type') || '';

        const data = contentType.includes('application/json')
          ? await response.json()
          : {
              success: false,
              error: `Server returned ${response.status} instead of JSON`
            };

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
        userInputRef.current &&
        !userInputRef.current.contains(event.target)
      ) {
        setShowUserSuggestions(false);
      }

      if (
        ccInputRef.current &&
        !ccInputRef.current.contains(event.target)
      ) {
        setShowCcSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getFilteredUsers = (search, excludeIds = []) => {
    const query = search.trim().toLowerCase();

    return slackUsers
      .filter(user => !excludeIds.includes(user.userId))
      .filter(user => {
        if (!query) return true;

        return (
          user.name?.toLowerCase().includes(query) ||
          user.realName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
        );
      })
      .slice(0, 8);
  };

  const handleUserInputChange = (e) => {
    const value = e.target.value;

    setFormData(prev => ({
      ...prev,
      user: value,
      userId: ''
    }));

    const suggestions = getFilteredUsers(value);

    setUserSuggestions(suggestions);
    setShowUserSuggestions(true);
  };

  const handleUserFocus = () => {
    setUserSuggestions(getFilteredUsers(formData.user));
    setShowUserSuggestions(true);
  };

  const handleUserSelect = (user) => {
    setFormData(prev => ({
      ...prev,
      user: user.name,
      userId: user.userId
    }));

    setUserSuggestions([]);
    setShowUserSuggestions(false);
  };

  const handleCcInputChange = (e) => {
    const value = e.target.value;

    setCcSearch(value);

    const suggestions = getFilteredUsers(
      value,
      [formData.userId, ...formData.ccUserIds]
    );

    setCcSuggestions(suggestions);
    setShowCcSuggestions(true);
  };

  const handleCcFocus = () => {
    setCcSuggestions(
      getFilteredUsers(ccSearch, [
        formData.userId,
        ...formData.ccUserIds
      ])
    );

    setShowCcSuggestions(true);
  };

  const handleCcSelect = (user) => {
    if (
      user.userId === formData.userId ||
      formData.ccUserIds.includes(user.userId)
    ) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      ccUserIds: [...prev.ccUserIds, user.userId]
    }));

    setCcSearch('');
    setCcSuggestions(
      getFilteredUsers('', [
        formData.userId,
        ...formData.ccUserIds,
        user.userId
      ])
    );

    setShowCcSuggestions(true);

    setTimeout(() => {
      ccInputRef.current?.focus();
    }, 0);
  };

  const removeCcUser = (userId) => {
    setFormData(prev => ({
      ...prev,
      ccUserIds: prev.ccUserIds.filter(id => id !== userId)
    }));

    setCcSuggestions(
      getFilteredUsers(ccSearch, [
        formData.userId,
        ...formData.ccUserIds.filter(id => id !== userId)
      ])
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlatformChange = (e) => {
    const platform = e.target.value;

    setFormData(prev => ({
      ...prev,
      platform
    }));

    setSelectedChannel(getPlatformChannel(platform).name);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    setFormData(prev => ({
      ...prev,
      attachments: files
    }));
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
User: ${entry.data.user} (${entry.data.userId})
Category: ${entry.data.category}
${entry.data.otherExplain ? `Other: ${entry.data.otherExplain}` : ''}
Priority: ${entry.data.priority}
Platform: ${entry.data.platform}
`;
        })
        .join('\n');

      zip.file('conversation_history.txt', historyContent);

      const blob = await zip.generateAsync({
        type: 'blob'
      });

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

    if (
      !formData.category ||
      !formData.platform ||
      !formData.whereHappening ||
      !formData.description ||
      !formData.userId
    ) {
      alert('❌ Please select your name from the suggestions and fill all required fields');
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

      formData.ccUserIds.forEach(userId => {
        requestData.append('ccUserIds', userId);
      });

      formData.attachments.forEach(file => {
        requestData.append('attachments', file);
      });

      const response = await fetch('/api/slack/post-message', {
        method: 'POST',
        body: requestData,
      });

      const contentType = response.headers.get('content-type') || '';

      const result = contentType.includes('application/json')
        ? await response.json()
        : {
            success: false,
            error: `Server returned ${response.status} instead of JSON`
          };

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

        setCcSearch('');
        setUserSuggestions([]);
        setCcSuggestions([]);
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
    paddingRight: '48px',
    backgroundColor: '#fff6f6',
    border: '1px solid #f2a5a3',
    borderRadius: '10px',
    color: '#8b5e3b',
    fontSize: '14px',
    boxSizing: 'border-box',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b5e3b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
    backgroundSize: '1.25em',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: '#fff6f6',
    border: '1px solid #f2a5a3',
    borderRadius: '10px',
    color: '#8b5e3b',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const selectedCcUsers = slackUsers.filter(user =>
    formData.ccUserIds.includes(user.userId)
  );

  return (
    <>
      <Head>
        <title>KSC Tickets</title>
      </Head>

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #fbdce6 0%, #c7eaf9 100%)',
          color: '#8b5e3b',
          padding: '24px 20px 40px',
          fontFamily: 'Quicksand, sans-serif',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div
            style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}
          >
            <img
              src="/logo.png"
              alt="Kawaii Slime Company"
              style={{
                display: 'block',
                width: '150px',
                height: '150px',
                objectFit: 'contain',
                margin: '0 auto 10px'
              }}
            />

            <h1
              style={{
                margin: 0,
                fontSize: '32px',
                fontWeight: '700',
                letterSpacing: '0.2px',
                color: '#8b5e3b'
              }}
            >
              KSC Tickets
            </h1>

            <p
              style={{
                margin: '6px 0 0',
                color: '#906645',
                fontSize: '15px',
                fontWeight: '500'
              }}
            >
              IT and Website Request Form
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                marginTop: '16px'
              }}
            >
              {!submissionSuccess &&
                conversationRef.current.length > 0 && (
                  <>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#8b5e3b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      {showHistory ? '👁️ Hide' : '👁️ View'} (
                      {conversationRef.current.length})
                    </button>

                    <button
                      onClick={exportAsZip}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#ff7380',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      📦 Export Zip
                    </button>
                  </>
                )}
            </div>
          </div>

          {usersError && (
            <div
              style={{
                backgroundColor: '#e96b77',
                color: '#fff',
                padding: '12px',
                borderRadius: '10px',
                marginBottom: '20px'
              }}
            >
              ⚠️ Error loading users: {usersError}
            </div>
          )}

          {tokenWarning && (
            <div
              style={{
                backgroundColor: '#e96b77',
                color: '#fff',
                padding: '12px',
                borderRadius: '10px',
                marginBottom: '20px'
              }}
            >
              ⚠️ Approaching token limit! Consider exporting conversation as ZIP.
            </div>
          )}

          {showHistory && (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #f9ccda',
                borderRadius: '14px',
                padding: '16px',
                boxShadow: '0 8px 24px rgba(139, 94, 59, 0.10)',
                marginBottom: '24px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                📝 Conversation History
              </h3>

              {conversationRef.current.map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #f9ccda'
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#906645'
                    }}
                  >
                    #{idx + 1} - {entry.timestamp}
                  </div>

                  <div
                    style={{
                      fontSize: '13px',
                      marginTop: '4px'
                    }}
                  >
                    <strong>{entry.data.user}</strong> |{' '}
                    {entry.data.category} | #{entry.channel} |{' '}
                    <span
                      style={{
                        color:
                          entry.status === 'posted'
                            ? '#ff7380'
                            : '#e96b77'
                      }}
                    >
                      {entry.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {submissionSuccess ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #f9ccda',
                borderRadius: '14px',
                padding: '40px 24px',
                boxShadow: '0 8px 24px rgba(139, 94, 59, 0.10)',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  marginBottom: '12px'
                }}
              >
                ✅
              </div>

              <h2 style={{ margin: '0 0 12px' }}>
                Thank you!
              </h2>

              <p
                style={{
                  color: '#906645',
                  margin: '0 0 8px'
                }}
              >
                Your request has been submitted successfully.
              </p>

              <p
                style={{
                  color: '#2f5363',
                  margin: '0 0 24px'
                }}
              >
                It was sent to{' '}
                <strong>#{submissionSuccess.channel}</strong>
              </p>

              <button
                type="button"
                onClick={() => setSubmissionSuccess(null)}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#8b5e3b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #f9ccda',
                  borderRadius: '14px',
                  padding: '24px',
                  boxShadow: '0 8px 24px rgba(139, 94, 59, 0.10)'
                }}
              >
                {/* Your Name */}
                <div
                  ref={userInputRef}
                  style={{
                    marginBottom: '16px',
                    position: 'relative'
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}
                  >
                    Your Name *
                  </label>

                  <input
                    type="text"
                    value={formData.user}
                    onChange={handleUserInputChange}
                    onFocus={handleUserFocus}
                    disabled={usersLoading || slackUsers.length === 0}
                    placeholder={
                      usersLoading
                        ? 'Loading users...'
                        : 'Start typing your name'
                    }
                    autoComplete="off"
                    style={{
                      ...inputStyle,
                      opacity: usersLoading ? 0.6 : 1
                    }}
                  />

                  {showUserSuggestions &&
                    userSuggestions.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #f2a5a3',
                          borderRadius: '10px',
                          boxShadow:
                            '0 8px 20px rgba(139, 94, 59, 0.12)',
                          zIndex: 50,
                          overflow: 'hidden',
                          maxHeight: '220px',
                          overflowY: 'auto'
                        }}
                      >
                        {userSuggestions.map(user => (
                          <button
                            key={user.userId}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleUserSelect(user)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: 'none',
                              borderBottom:
                                '1px solid #f9e1e5',
                              backgroundColor: '#fff',
                              color: '#8b5e3b',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            {user.name}
                          </button>
                        ))}
                      </div>
                    )}
                </div>

                {/* CC */}
                <div
                  ref={ccInputRef}
                  style={{
                    marginBottom: '16px',
                    position: 'relative'
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}
                  >
                    CC (optional)
                  </label>

                  <div
                    style={{
                      width: '100%',
                      minHeight: '42px',
                      padding: '7px 10px',
                      backgroundColor: '#fff6f6',
                      border: '1px solid #f2a5a3',
                      borderRadius: '10px',
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onClick={() => ccInputRef.current?.querySelector('input')?.focus()}
                  >
                    {selectedCcUsers.map(user => (
                      <span
                        key={user.userId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          backgroundColor: '#f9dce5',
                          borderRadius: '6px',
                          color: '#8b5e3b',
                          fontSize: '13px'
                        }}
                      >
                        {user.name}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCcUser(user.userId);
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#8b5e3b',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '14px',
                            lineHeight: 1
                          }}
                          aria-label={`Remove ${user.name}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    <input
                      ref={ccInputRef}
                      type="text"
                      value={ccSearch}
                      onChange={handleCcInputChange}
                      onFocus={handleCcFocus}
                      placeholder={
                        selectedCcUsers.length
                          ? 'Add another user'
                          : 'Start typing a name'
                      }
                      autoComplete="off"
                      style={{
                        flex: 1,
                        minWidth: '150px',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        color: '#8b5e3b',
                        fontSize: '14px',
                        padding: '4px 0'
                      }}
                    />
                  </div>

                  {showCcSuggestions &&
                    ccSuggestions.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #f2a5a3',
                          borderRadius: '10px',
                          boxShadow:
                            '0 8px 20px rgba(139, 94, 59, 0.12)',
                          zIndex: 50,
                          overflow: 'hidden',
                          maxHeight: '220px',
                          overflowY: 'auto'
                        }}
                      >
                        {ccSuggestions.map(user => (
                          <button
                            key={user.userId}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleCcSelect(user)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: 'none',
                              borderBottom:
                                '1px solid #f9e1e5',
                              backgroundColor: '#fff',
                              color: '#8b5e3b',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            {user.name}
                          </button>
                        ))}
                      </div>
                    )}

                  <div
                    style={{
                      fontSize: '12px',
                      color: '#906645',
                      marginTop: '4px'
                    }}
                  >
                    Optional: Type a name and select multiple users to CC.
                  </div>
                </div>

                {/* Category */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}
                  >
                    Category *
                  </label>

                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    style={selectStyle}
                  >
                    <option value="">Select an option</option>

                    {categoryOptions.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Other */}
                {formData.category === 'Other' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '500'
                      }}
                    >
                      If Other, please explain (optional)
                    </label>

                    <input
                      type="text"
                      name="otherExplain"
                      value={formData.otherExplain}
                      onChange={handleInputChange}
                      placeholder="Write something"
                      style={inputStyle}
                    />
                  </div>
                )}

                {/* Priority */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}
                  >
                    Priority *
                  </label>

                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    style={selectStyle}
                  >
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>

                {/* Platform */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}
                  >
                    Which Platform *
                  </label>

                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handlePlatformChange}
                    style={selectStyle}
                  >
                    <option value="">Select an option</option>

                    {platformOptions.map(platform => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>

                  {formData.platform && (
                    <div
                      style={{
                        marginTop: '8px',
                        color: '#2f5363',
                        fontSize: '13px'
                      }}
                    >
                      📤 This ticket will be sent to:{' '}
                      <strong>#{selectedChannel}</strong>
                    </div>
                  )}
                </div>

                {/* Where it is Happening */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}
                  >
                    Where it is Happening *
                  </label>

                  <input
                    type="text"
                    name="whereHappening"
                    value={formData.whereHappening}
                    onChange={handleInputChange}
                    placeholder="Shopify"
                    style={inputStyle}
                  />
                </div>

                {/* Expected vs Actual */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}
                  >
                    Expected vs. Actual (optional)
                  </label>

                  <textarea
                    name="expectedVsActual"
                    value={formData.expectedVsActual}
                    onChange={handleInputChange}
                    style={{
                      ...inputStyle,
                      fontFamily: 'inherit',
                      minHeight: '150px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Attachments */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}
                  >
                    Attachments
                  </label>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      backgroundColor: '#fff6f6',
                      border: '1px solid #f2a5a3',
                      borderRadius: '10px'
                    }}
                  >
                    <span>📎</span>

                    <label
                      style={{
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />

                      <span style={{ color: '#8b5e3b' }}>
                        Upload file
                      </span>
                    </label>
                  </div>

                  <div
                    style={{
                      fontSize: '12px',
                      color: '#906645',
                      marginTop: '4px'
                    }}
                  >
                    Add screenshots of the bugs, issues or new feature.
                  </div>

                  {formData.attachments.length > 0 && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#ff7380'
                      }}
                    >
                      ✅ {formData.attachments.length} file(s) selected
                    </div>
                  )}
                </div>

                {/* Ticket Description */}
                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}
                  >
                    Ticket Description *
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    style={{
                      ...inputStyle,
                      fontFamily: 'inherit',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* CC Preview */}
                <div
                  style={{
                    backgroundColor: '#fff6f6',
                    padding: '12px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    fontSize: '13px',
                    border: '1px solid #f9ccda'
                  }}
                >
                  <strong>CC:</strong>{' '}
                  {selectedCcUsers.length > 0
                    ? selectedCcUsers
                        .map(user => user.name)
                        .join(', ')
                    : 'No additional users selected'}
                </div>

                {/* Buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
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

                      setCcSearch('');
                      setUserSuggestions([]);
                      setCcSuggestions([]);
                      setSelectedChannel(DEFAULT_CHANNEL.name);
                    }}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#8b5e3b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Close
                  </button>

                  <button
                    type="submit"
                    disabled={loading || usersLoading}
                    style={{
                      padding: '10px 24px',
                      backgroundColor:
                        loading || usersLoading
                          ? '#c2c2c2'
                          : '#ff7380',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      cursor:
                        loading || usersLoading
                          ? 'not-allowed'
                          : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {loading
                      ? '⏳ Submitting...'
                      : '✅ Submit'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
