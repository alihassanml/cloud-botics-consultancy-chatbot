import { useState, useRef, useEffect } from 'react';
import { FaArrowAltCircleUp, FaChevronDown, FaHome, FaEnvelope } from "react-icons/fa";
import { FiMessageCircle } from 'react-icons/fi';
import { Button, Form, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import ReactMarkdown from 'react-markdown';
import { motion } from "framer-motion";
import { FaChevronRight, FaSearch } from 'react-icons/fa';
import { FaBookmark } from "react-icons/fa";
import { RiExpandDiagonalLine } from "react-icons/ri";
import { HiOutlineArrowsExpand } from "react-icons/hi";

type Message = {
  type: 'bot' | 'user';
  text: string;
  feedback: string | null;
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [screen, setScreen] = useState<'intro' | 'form' | 'chat'>('intro');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingMessage, setTypingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [botBusy, setBotBusy] = useState(false);

  const [isExtended, setIsExtended] = useState(false);



  const [userId] = useState(() => {
    const existing = sessionStorage.getItem("chat_ID");
    if (existing) return existing;
    const random = `user_${Math.random().toString(36).substring(2, 10)}`;
    sessionStorage.setItem("chat_ID", random);
    return random;
  });

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(`chat_messages_${userId}`, JSON.stringify(messages));
    }
  }, [messages, userId]);

  useEffect(() => {
    const savedMessages = sessionStorage.getItem(`chat_messages_${userId}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [userId]);


  const userName = (sessionStorage.getItem("chat_name") || "Guest").charAt(0).toUpperCase() + (sessionStorage.getItem("chat_name") || "Guest").slice(1);

  const helpOptions = [
    "About Cloud Botics Consultancy",
    "Services & Solutions",
    "Pricing & Plans",
    "Product Features & Bots",
    "Contact Human Support"
  ];

  useEffect(() => {
    if (isOpen) {
      const nameStored = sessionStorage.getItem("chat_name");
      const emailStored = sessionStorage.getItem("chat_email");
      if (nameStored && emailStored) {
        setScreen("chat");
      } else {
        setScreen("intro");
      }
    }
  }, [isOpen]);

  const handleBotResponse = async (userMessage: string) => {
    setBotBusy(true);
    setTypingMessage("SuAI is typing...");

    try {
      const res = await fetch("https://n8n.cloudboticsconsultancy.com/webhook/chat-lead-qualification-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_ID: userId, message: userMessage })
      });

      const data = await res.json();
      const replies = (data.reply || "").split("\\k").filter((part: string) => part.trim() !== "");

      for (let i = 0; i < replies.length; i++) {
        setTypingMessage("SuAI is typing...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTypingMessage(null);
        setMessages(prev => [...prev, { type: 'bot', text: replies[i].trim(), feedback: null }]);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

    } catch {
      setTypingMessage(null);
      setMessages(prev => [...prev, { type: 'bot', text: "Oops! Something went wrong.", feedback: null }]);
    }

    setBotBusy(false);
    setMessageQueue(prev => {
      const [nextMessage, ...rest] = prev;
      if (nextMessage) {
        setTimeout(() => {
          handleBotResponse(nextMessage);
        }, 2000);
      }
      return rest;
    });
  };

  const sendMessage = async () => {
    if (input.trim() === '') return;
    const message = input.trim();
    setInput('');
    setMessages(prev => [...prev, { type: 'user', text: message, feedback: null }]);

    if (botBusy) {
      setMessageQueue(prev => [...prev, message]);
    } else {
      await handleBotResponse(message);
    }
  };

  const handleHelpClick = (prompt: string) => {
    const storedName = sessionStorage.getItem("chat_name");
    const storedEmail = sessionStorage.getItem("chat_email");
    if (storedName && storedEmail) {
      setScreen("chat");
      setMessages(prev => [...prev, { type: 'user', text: prompt, feedback: null }]);
      handleBotResponse(prompt);
    } else {
      setScreen("form");
      sessionStorage.setItem("pending_prompt", prompt);
    }
  };

  const handleFormSubmit = () => {
    if (name && email) {
      sessionStorage.setItem("chat_name", name);
      sessionStorage.setItem("chat_email", email);
      setScreen("chat");

      const pendingPrompt = sessionStorage.getItem("pending_prompt");

      const firstMessage = `User info: Name = ${name}, Email = ${email}${pendingPrompt ? `\n\n${pendingPrompt}` : ""}`;

      handleBotResponse(firstMessage);



    } else {
      alert("Please enter name and email.");
    }
  };



  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingMessage]);

  return (
    <>
      {/* Floating toggle button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: isOpen ? '50px' : '180px',
          height: '50px',
          borderRadius: isOpen ? '50%' : '25px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: "linear-gradient(135deg, #3484daff, #2fc4e2ff)",
          border: "none",
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 9999
        }}
      >
        {isOpen ? <FaChevronDown size={22} /> : (<><FiMessageCircle size={22} /><span>Need Help</span></>)}
      </Button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            zIndex: 10000,

          }}
        >
          <Card
            style={{
              width: isExtended ? '600px' : '400px',
              height: isExtended ? '650px' : '650px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: "30px",
              overflow: "hidden",
              transition: 'width 0.3s ease, height 0.3s ease',
            }}
          >




            {/* Modern Header */}
            {/* Modern Header with Extend Button */}
            {/* Modern Header with Extend Button */}

            <div
              className={
                screen === 'intro' || screen === 'form'
                  ? isExtended
                    ? 'curved-rectangle-increase'
                    : 'curved-rectangle'
                  : ''
              }
              style={{
                background: "linear-gradient(135deg, #3484daff, #2fc4e2ff)",
                padding: '20px',
                color: 'white',
                minHeight: "120px",
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
              }}
            >
              {/* Top Image */}
              <div style={{ display: 'flex', marginBottom: '10px' }}>
                <img
                  src="./image.webp"
                  style={{
                    width: "45px",
                    height: "45px",
                    borderRadius: '50%',
                    objectFit: 'cover',

                  }}
                />
                {/* <h4 style={{
      paddingTop:"10px",
      paddingLeft:"35%",
      fontSize:"16px",
      fontWeight:"bold"
    }}> Cloud Botics Consultancy</h4> */}
                <button
                  onClick={() => setIsExtended(!isExtended)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    right: "0px",
                    fontSize: '22px',
                    // marginLeft: '0%',
                    marginRight: "10px",
                    borderRadius: '8px',
                    transition: 'background-color 0.3s',
                    position: "absolute"

                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.27)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  aria-label={isExtended ? "Shrink Chatbot" : "Extend Chatbot"}
                  title={isExtended ? "Shrink Chatbot" : "Extend Chatbot"}
                >
                  {isExtended ? <HiOutlineArrowsExpand /> : <RiExpandDiagonalLine />}
                </button>
              </div>

              {/* Name & Extend Button Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: "10px"
                }}
              >
                <div>
                  <b>
                    <h4 style={{ margin: 0, fontWeight: 'bold', fontFamily: "" }}>
                      Hi {userName}
                    </h4>
                  </b>
                  <p style={{ margin: 0, fontSize: 14, paddingTop: '5px' }}>
                    I am <b>SuAI</b> from <b>Cloud Botics Consultancy.</b><br></br>How can we help?
                  </p>
                </div>


              </div>
            </div>





            {/* Main Body */}
            <Card.Body style={{ overflowY: 'auto', flex: 1, padding: '10px' }}>

              {screen === 'intro' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '15px' }}
                >
                  {/* Send a message card */}
                  <div
                    style={{
                      background: 'white',
                      borderRadius: '10px',
                      padding: '15px',
                      marginBottom: '12px',
                      boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleHelpClick("Send us a message")}
                  >
                    <div>
                      <strong style={{ fontSize: '15px', color: '#000' }}>Send us a message</strong>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>We typically reply within an hour</p>
                    </div>
                    <FaChevronRight color="#3484daff" size={16} />
                  </div>

                  {/* Search for help card */}
                  <div
                    style={{
                      background: 'white',
                      borderRadius: '10px',
                      padding: '10px 15px',
                      boxShadow: '0 2px 20px rgba(0,0,0,0.1)'
                    }}
                  >
                    {/* Search title */}
                    {/* <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', background: "#e7e6e6bb", height: "35px", padding: "20px", borderRadius: "20px", }}>
                      <strong style={{ flex: 1, fontSize: '15px', color: '#000' }}>Search for help</strong>
                      <FaSearch color="#3484daff" size={14} />
                    </div> */}

                    {/* Help options */}
                    {helpOptions.map((opt, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '14px 15px ',
                          borderBottom: idx < helpOptions.length - 1 ? '1px solid #eee' : 'none',
                          cursor: 'pointer',

                        }}
                        onClick={() => handleHelpClick(opt)}
                      >
                        <span style={{ color: '#000', fontSize: '14px' }}>{opt}</span>
                        <FaChevronRight color="#ccc" size={14} />
                      </div>
                    ))}
                  </div>
                  <br />
                </motion.div>
              )}


              {screen === 'form' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ textAlign: 'left' }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    {/* <img src="./logo.jpg" alt="Form" style={{ width: '60px', height: '60px', borderRadius: "50%", marginBottom: '15px' }} /> */}
                    <br />
                    <h5 style={{ color: '#333', marginBottom: '10px' }}>Welcome!</h5>
                    <p style={{ color: '#666', fontSize: '14px' }}>Please share your details so I can assist you better.</p>
                  </div>
                  <Form style={{ maxWidth: '300px', margin: 'auto' }}>
                    <Form.Label style={{ fontWeight: '500', color: '#333' }}>Name</Form.Label>

                    <Form.Group className="mb-3">
                      <Form.Control type="text" required placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} className='name-email-field' />
                    </Form.Group>
                    <Form.Label style={{ fontWeight: '500', color: '#333' }}>Email</Form.Label>

                    <Form.Group className="mb-3">
                      <Form.Control type="email" required placeholder="Your Email" value={email} className='name-email-field' onChange={(e) => setEmail(e.target.value)} />
                    </Form.Group>
                    <center><Button className='chatbot-startbutton' onClick={handleFormSubmit}>Start Chatting</Button></center>
                  </Form>
                </motion.div>
              )}

              {screen === 'chat' && (

                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '10px' }}>
                    {messages.map((msg, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
                        {msg.type === 'bot' && (
                          <img src="./image.webp"  style={{ width: '28px', height: '28px', marginRight: '8px', borderRadius: '50%' }} />
                        )}
                        <div style={{
                          maxWidth: '75%',
                          paddingLeft: '13px',
                          paddingTop: '14px',
                          paddingRight: '13px',
                          borderRadius: '15px',
                          color: msg.type === 'user' ? 'white' : 'black',
                          background: msg.type === 'user' ? 'linear-gradient(135deg, #3484daff, #2fc4e2ff)' : '#f1f1f1',
                          fontSize: "14px"
                        }}>
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                    {typingMessage && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <img src="./image.webp"  style={{ width: '28px', height: '28px', marginRight: '8px', borderRadius: '50%' }} />
                        <div className="typing-indicator">
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div style={{
                    display: 'flex',
                    padding: '8px',
                    // borderTop: '1px solid #ddd',
                    boxShadow: "0 -4px 10px -4px #dfdfdf8a",
                    background: '#fff'
                  }}>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '20px',
                        border: '1px solid #ccc',
                        outline: 'none',
                        fontSize: '14px'
                      }}
                    />
                    <Button
                      onClick={sendMessage}
                      style={{
                        marginLeft: '8px',
                        borderRadius: '50%',
                        background: "linear-gradient(135deg, #3484daff, #2fc4e2ff)",
                        width: '40px',
                        border: "none",
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FaArrowAltCircleUp size={20} />
                    </Button>
                  </div>
                </div>
              )}

              {screen === 'appointment' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ textAlign: 'left', padding: '15px' }}
                >
                  <div style={{
                    textAlign: 'center', marginBottom: '20px', scrollbarWidth: 'none',       // Firefox
                    msOverflowStyle: 'none',
                  }} className="hide-scrollbar">
                    <iframe
                      src="https://calendly.com/cloudboticsconsultancy/30min"
                      frameBorder="0"
                      width={isExtended ? 570 : 370}
                      height={isExtended ? 650 : 400}
                      style={{ border: 'none', borderRadius: '10px' }}
                    ></iframe>

                  </div>


                </motion.div>
              )}




            </Card.Body>

            <Card.Footer
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                padding: '10px 0',
                borderTop: '1px solid #ddd',
                background: '#f8f9fa',
                fontFamily: "'Segoe UI', sans-serif",
                fontWeight: 500,
                boxShadow: (screen === 'intro' || screen === 'form' || screen === 'appointment') ? "0 5px 10px #b3b3b3ff" : "none"
              }}
            >
              {[
                { icon: FaHome, label: 'Home', screenName: 'intro' },
                { icon: FaEnvelope, label: 'Messages', screenName: 'chat' },
                { icon: FaBookmark, label: 'Book Meeting', screenName: 'appointment' }
              ].map((item, idx) => {
                const Icon = item.icon;
                const isActive = screen === item.screenName;

                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      color: isActive ? '#2f9ae2ff' : '#555',
                      padding: '5px 10px',
                      borderRadius: '8px'
                    }}
                    onClick={() => {
                      if (item.screenName === 'chat') {
                        const storedName = sessionStorage.getItem("chat_name");
                        const storedEmail = sessionStorage.getItem("chat_email");
                        if (storedName && storedEmail) {
                          setScreen('chat');
                        } else {
                          setScreen('form');
                        }
                      } else if (item.screenName) {
                        setScreen(item.screenName);
                      }

                      if (item.action) item.action();
                    }}

                  >
                    <Icon size={22} style={{ transition: 'color 0.3s ease' }} />
                    <div style={{ fontSize: 12, marginTop: 2 }}>{item.label}</div>
                  </motion.div>
                );
              })}
            </Card.Footer>



          </Card>
        </motion.div>
      )}
    </>
  );
};

export default Chatbot;
