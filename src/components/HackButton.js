import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const HackButton = () => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isHacking, setIsHacking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [theme, setTheme] = useState('matrix');
  const audio = useMemo(() => ({
    start: new Audio('/sounds/hack-start.mp3'),
    running: new Audio('/sounds/hack-running.mp3'),
    complete: new Audio('/sounds/hack-complete.mp3'),
    click: new Audio('/sounds/click.mp3'),
    expand: new Audio('/sounds/expand.mp3')
  }), []);
  const navigate = useNavigate();

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('hackButtonPosition');
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    }
  }, []);

  // Configure audio settings
  useEffect(() => {
    const configureAudio = () => {
      // Configure each audio element individually
      audio.start.volume = volume;
      audio.running.volume = volume;
      audio.complete.volume = volume;
      audio.click.volume = volume;
      audio.expand.volume = volume;
      
      // Set loop for running sound
      audio.running.loop = true;
    };

    configureAudio();

    return () => {
      // Cleanup each audio element individually
      audio.start.pause();
      audio.running.pause();
      audio.complete.pause();
      audio.click.pause();
      audio.expand.pause();
      
      audio.start.currentTime = 0;
      audio.running.currentTime = 0;
      audio.complete.currentTime = 0;
      audio.click.currentTime = 0;
      audio.expand.currentTime = 0;
    };
  }, [audio, volume]);

  // Memoize styles
  const styles = useMemo(() => ({
    container: {
      position: 'fixed',
      top: `${position.y}px`,
      left: `${position.x}px`,
      padding: isExpanded ? '20px' : '10px',
      background: (() => {
        switch (theme) {
          case 'matrix': return 'rgba(0, 20, 0, 0.95)';
          case 'cyber': return 'rgba(0, 0, 0, 0.85)';
          case 'synthwave': return 'rgba(45, 0, 75, 0.95)';
          case 'hacker': return 'rgba(0, 15, 30, 0.95)';
          default: return 'rgba(0, 20, 0, 0.95)';
        }
      })(),
      borderRadius: '10px',
      border: (() => {
        switch (theme) {
          case 'matrix': return '1px solid #00ff00';
          case 'cyber': return '1px solid #ff0000';
          case 'synthwave': return '1px solid #ff00ff';
          case 'hacker': return '1px solid #00ffff';
          default: return '1px solid #00ff00';
        }
      })(),
      boxShadow: (() => {
        switch (theme) {
          case 'matrix': return '0 0 20px rgba(0, 255, 0, 0.3)';
          case 'cyber': return '0 0 20px rgba(255, 0, 0, 0.3)';
          case 'synthwave': return '0 0 20px rgba(255, 0, 255, 0.3)';
          case 'hacker': return '0 0 20px rgba(0, 255, 255, 0.3)';
          default: return '0 0 20px rgba(0, 255, 0, 0.3)';
        }
      })(),
      cursor: isDragging ? 'grabbing' : 'grab',
      zIndex: 1001,
      userSelect: 'none',
      touchAction: 'none',
      minWidth: isExpanded ? '200px' : 'auto',
      backdropFilter: 'blur(5px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: `scale(${isExpanded ? 1 : 0.8})`,
      opacity: cooldown > 0 ? 0.7 : 1
    },
    toggleButtonStyle: {
      padding: '10px',
      background: 'transparent',
      color: (() => {
        switch (theme) {
          case 'matrix': return '#00ff00';
          case 'cyber': return '#ff0000';
          case 'synthwave': return '#ff00ff';
          case 'hacker': return '#00ffff';
          default: return '#00ff00';
        }
      })(),
      border: (() => {
        switch (theme) {
          case 'matrix': return '1px solid #00ff00';
          case 'cyber': return '1px solid #ff0000';
          case 'synthwave': return '1px solid #ff00ff';
          case 'hacker': return '1px solid #00ffff';
          default: return '1px solid #00ff00';
        }
      })(),
      borderRadius: '5px',
      fontSize: '14px',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontFamily: 'monospace',
      width: isExpanded ? '100%' : 'auto',
      animation: 'glowPulse 2s infinite'
    },
    hackButtonStyle: {
      width: '100%',
      padding: '15px',
      background: 'linear-gradient(45deg, #ff0000, #ff4444)',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      fontSize: '18px',
      fontWeight: 'bold',
      cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
      textShadow: '0 0 5px rgba(255, 0, 0, 0.5)',
      boxShadow: '0 0 15px rgba(255, 0, 0, 0.3)',
      fontFamily: 'monospace',
      marginTop: '10px',
      animation: isHacking ? 'hackPulse 1s infinite' : 'none',
      opacity: cooldown > 0 ? 0.5 : 1
    },
    telegramStyle: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px',
      background: '#229ED9',
      color: 'white',
      borderRadius: '5px',
      textDecoration: 'none',
      fontSize: '14px',
      fontFamily: 'monospace',
      marginTop: '10px',
      transition: 'all 0.3s ease'
    }
  }), [position, isExpanded, isDragging, theme, cooldown, isHacking]);

  const keyframes = `
    @keyframes hackPulse {
      0% {
        transform: scale(1);
        box-shadow: 0 0 15px ${theme === 'matrix' ? 'rgba(0, 255, 0, 0.3)' : 
                             theme === 'cyber' ? 'rgba(255, 0, 0, 0.3)' :
                             theme === 'synthwave' ? 'rgba(255, 0, 255, 0.3)' :
                             theme === 'hacker' ? 'rgba(0, 255, 255, 0.3)' :
                             'rgba(0, 255, 0, 0.3)'};
      }
      50% {
        transform: scale(1.05);
        box-shadow: 0 0 30px ${theme === 'matrix' ? 'rgba(0, 255, 0, 0.5)' :
                             theme === 'cyber' ? 'rgba(255, 0, 0, 0.5)' :
                             theme === 'synthwave' ? 'rgba(255, 0, 255, 0.5)' :
                             theme === 'hacker' ? 'rgba(0, 255, 255, 0.5)' :
                             'rgba(0, 255, 0, 0.5)'};
      }
      100% {
        transform: scale(1);
        box-shadow: 0 0 15px ${theme === 'matrix' ? 'rgba(0, 255, 0, 0.3)' :
                             theme === 'cyber' ? 'rgba(255, 0, 0, 0.3)' :
                             theme === 'synthwave' ? 'rgba(255, 0, 255, 0.3)' :
                             theme === 'hacker' ? 'rgba(0, 255, 255, 0.3)' :
                             'rgba(0, 255, 0, 0.3)'};
      }
    }

    @keyframes glowPulse {
      0% { box-shadow: 0 0 5px ${theme === 'matrix' ? '#00ff00' :
                                theme === 'cyber' ? '#ff0000' :
                                theme === 'synthwave' ? '#ff00ff' :
                                theme === 'hacker' ? '#00ffff' :
                                '#00ff00'}; }
      50% { box-shadow: 0 0 20px ${theme === 'matrix' ? '#00ff00' :
                                    theme === 'cyber' ? '#ff0000' :
                                    theme === 'synthwave' ? '#ff00ff' :
                                    theme === 'hacker' ? '#00ffff' :
                                    '#00ff00'}; }
      100% { box-shadow: 0 0 5px ${theme === 'matrix' ? '#00ff00' :
                                    theme === 'cyber' ? '#ff0000' :
                                    theme === 'synthwave' ? '#ff00ff' :
                                    theme === 'hacker' ? '#00ffff' :
                                    '#00ff00'}; }
    }
  `;

  const handleHackComplete = () => {
    console.log('Hack execution completed');
    // Notify parent component via postMessage
    window.postMessage('HACK_COMPLETE', '*');
  };

  const handleStartHack = useCallback(() => {
    if (cooldown > 0 || isHacking) return;

    const accessType = localStorage.getItem('hackAccess');
    
    if (!accessType) {
      navigate('/');
      return;
    }

    setIsHacking(true);
    
    // Play hack start sound
    audio.start.play()
      .then(() => {
        setTimeout(() => {
          audio.running.play();
          
          // Inject hacking animation
          const hackingScript = `
            const hackStyles = document.createElement('style');
            hackStyles.id = 'hack-animation-style';
            hackStyles.textContent = \`
              @keyframes glitchText {
                0% {
                  transform: translate(-2px, 2px);
                  text-shadow: -2px 0 #ff0000, 2px 2px #00ff00;
                }
                25% {
                  transform: translate(2px, -2px);
                  text-shadow: 2px 2px #ff0000, -2px -2px #0000ff;
                }
                50% {
                  transform: translate(-1px, -1px);
                  text-shadow: 3px 0 #00ff00, -3px 0 #ff0000;
                }
                75% {
                  transform: translate(1px, 1px);
                  text-shadow: -3px 0 #0000ff, 1px -1px #ff0000;
                }
                100% {
                  transform: translate(2px, -2px);
                  text-shadow: -1px 0 #ff0000, 1px 1px #00ff00;
                }
              }

              @keyframes glitchBar {
                0% { transform: scaleY(1); }
                50% { transform: scaleY(0.8); }
                51% { transform: scaleY(1.2); }
                100% { transform: scaleY(1); }
              }

              @keyframes scanline {
                0% {
                  transform: translateY(-100%);
                }
                100% {
                  transform: translateY(100%);
                }
              }

              .hacking-container {
                position: relative;
                margin-top: 10px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid #00ff00;
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
              }

              .hacking-animation {
                animation: glitchText 0.2s infinite;
                color: #00ff00 !important;
                font-family: monospace !important;
              }

              .hack-progress-wrapper {
                position: relative;
                width: 100%;
                height: 20px;
                background: rgba(0, 20, 0, 0.8);
                border: 1px solid #00ff00;
                overflow: hidden;
              }

              .hack-progress-bar {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 0%;
                background: linear-gradient(
                  90deg,
                  transparent,
                  rgba(0, 255, 0, 0.2) 20%,
                  rgba(0, 255, 0, 0.5) 50%,
                  rgba(0, 255, 0, 0.2) 80%,
                  transparent
                );
                animation: glitchBar 0.1s infinite;
              }

              .hack-progress-scanline {
                position: absolute;
                width: 100%;
                height: 20px;
                background: linear-gradient(
                  to bottom,
                  transparent,
                  rgba(0, 255, 0, 0.1),
                  transparent
                );
                animation: scanline 1s linear infinite;
              }

              .hack-progress-text {
                position: absolute;
                width: 100%;
                text-align: center;
                color: #00ff00;
                font-family: monospace;
                font-size: 12px;
                line-height: 20px;
                text-shadow: 0 0 5px #00ff00;
                z-index: 1;
                mix-blend-mode: overlay;
              }

              .hack-status {
                margin-top: 5px;
                color:rgb(0, 0, 0);
                font-family: monospace;
                font-size: 12px;
                text-shadow: 0 0 5px #00ff00;
              }

              .glitch-text {
                animation: glitchText 0.2s infinite;
              }
            \`;
            document.head.appendChild(hackStyles);

            const timeLeftElement = document.querySelector('.TimeLeft__C');
            if (timeLeftElement) {
              timeLeftElement.classList.add('hacking-animation');
              
              const hackingContainer = document.createElement('div');
              hackingContainer.className = 'hacking-container';
              
              const progressWrapper = document.createElement('div');
              progressWrapper.className = 'hack-progress-wrapper';
              
              const progressBar = document.createElement('div');
              progressBar.className = 'hack-progress-bar';
              
              const scanline = document.createElement('div');
              scanline.className = 'hack-progress-scanline';
              
              const progressText = document.createElement('div');
              progressText.className = 'hack-progress-text';
              
              const statusText = document.createElement('div');
              statusText.className = 'hack-status';
              
              progressWrapper.appendChild(progressBar);
              progressWrapper.appendChild(scanline);
              progressWrapper.appendChild(progressText);
              
              hackingContainer.appendChild(progressWrapper);
              hackingContainer.appendChild(statusText);
              
              timeLeftElement.parentNode.insertBefore(hackingContainer, timeLeftElement.nextSibling);

              const hackMessages = [
                'BYPASSING SECURITY...',
                'INJECTING MALICIOUS CODE...',
                'EXPLOITING VULNERABILITIES...',
                'CORRUPTING DATABASE...',
                'OVERRIDING CONTROLS...',
                'EXECUTING PAYLOAD...',
                'GAINING ROOT ACCESS...'
              ];

              let progress = 0;
              let messageIndex = 0;
              const progressInterval = setInterval(() => {
                progress += Math.random() * 2;
                if (progress > 100) progress = 100;
                
                progressBar.style.width = progress + '%';
                progressText.innerHTML = \`HACKING PROGRESS: <span class="glitch-text">\${Math.floor(progress)}%</span>\`;
                
                if (progress > messageIndex * 15) {
                  statusText.textContent = hackMessages[messageIndex];
                  messageIndex = Math.min(messageIndex + 1, hackMessages.length - 1);
                }
                
                if (progress >= 100) {
                  statusText.textContent = 'HACK COMPLETE';
                  clearInterval(progressInterval);
                }
              }, 50);

              setTimeout(() => {
                timeLeftElement.classList.remove('hacking-animation');
                hackingContainer.remove();
                clearInterval(progressInterval);

                const elements = document.querySelectorAll('.Betting__C-head-g, .Betting__C-head-r');
                if (elements.length > 0) {
                  const randomElement = elements[Math.floor(Math.random() * elements.length)];
                  randomElement.style.animation = 'blink 0.5s linear infinite';
                  setTimeout(() => {
                    randomElement.style.animation = '';
                  }, 3000);
                }
              }, 5000);
            }
          `;

          // Execute the script in the iframe
          const iframe = document.querySelector('iframe');
          if (iframe) {
            try {
              iframe.contentWindow.eval(hackingScript);
            } catch (error) {
              console.error('Script injection failed:', error);
            }
          }

          // Stop running sound and play complete sound after 5 seconds
          setTimeout(() => {
            audio.running.pause();
            audio.running.currentTime = 0;
            audio.complete.play().catch(console.error);
            setIsHacking(false);
            handleHackComplete();
          }, 5000);
        }, 1000);
      })
      .catch(console.error);

    // Start cooldown
    setCooldown(20);
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Add visual feedback
    navigator.vibrate?.(200); // Haptic feedback on supported devices
    
    // Add success rate
    const successRate = Math.random() > 0.3;
    if (!successRate) {
      setTimeout(() => {
        audio.running.pause();
        setIsHacking(false);
        alert('Hack failed! Security systems detected intrusion.');
      }, 3000);
      return;
    }
  }, [cooldown, isHacking, audio, navigate, handleHackComplete]);

  const handleExpand = () => {
    if (!isDragging) {
      setIsExpanded(!isExpanded);
      // Play expand sound
      audio.expand.play().catch(console.error);
    }
  };

  // Dragging logic
  const handleMouseDown = useCallback((e) => {
    // Only start dragging if clicking the container or panel header
    if (e.target.tagName.toLowerCase() === 'button' || e.target.tagName.toLowerCase() === 'a') {
      return;
    }
    
    // Handle both mouse and touch events
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y
    });
  }, [position]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    // Handle both mouse and touch events
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    
    const maxX = window.innerWidth - 250;
    const maxY = window.innerHeight - 150;
    const x = Math.min(Math.max(0, newX), maxX);
    const y = Math.min(Math.max(0, newY), maxY);
    
    setPosition({ x, y });
    localStorage.setItem('hackButtonPosition', JSON.stringify({ x, y }));
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      // Add both mouse and touch event listeners
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      // Remove both mouse and touch event listeners
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'h' && e.ctrlKey) {
        handleExpand();
      } else if (e.key === 'Enter' && isExpanded) {
        handleStartHack();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleStartHack, isExpanded]);

  return (
    <>
      <style>{keyframes}</style>
      <div 
        style={styles.container}
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          e.preventDefault(); // Prevent default touch behavior
          handleMouseDown(e);
        }}
        role="application"
        aria-label="Hack Control Panel"
      >
        <div 
          style={{
            padding: '5px',
            cursor: isDragging ? 'grabbing' : 'grab',
            borderBottom: isExpanded ? '1px solid rgba(0, 255, 0, 0.3)' : 'none',
            marginBottom: isExpanded ? '10px' : 0
          }}
        >
          <button 
            style={{
              ...styles.toggleButtonStyle,
              cursor: isDragging ? 'grabbing' : 'grab',
              width: '100%',
              margin: 0
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleExpand();
            }}
          >
            {isExpanded ? '[ HACK PANEL ]' : '[ H ]'}
          </button>
        </div>
        
        {isExpanded && (
          <div style={{ padding: '0 5px' }}>
            {/* Add volume control */}
            <div style={{ marginBottom: '10px' }}>
              <label 
                htmlFor="volume" 
                style={{ color: '#00ff00', fontSize: '12px', fontFamily: 'monospace' }}
              >
                VOLUME
              </label>
              <input
                type="range"
                id="volume"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Add theme selector */}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                width: '100%',
                marginBottom: '10px',
                background: 'transparent',
                color: (() => {
                  switch (theme) {
                    case 'matrix': return '#00ff00';
                    case 'cyber': return '#ff0000';
                    case 'synthwave': return '#ff00ff';
                    case 'hacker': return '#00ffff';
                    default: return '#00ff00';
                  }
                })(),
                border: `1px solid ${(() => {
                  switch (theme) {
                    case 'matrix': return '#00ff00';
                    case 'cyber': return '#ff0000';
                    case 'synthwave': return '#ff00ff';
                    case 'hacker': return '#00ffff';
                    default: return '#00ff00';
                  }
                })()}`,
                padding: '5px'
              }}
            >
              <option value="matrix">Matrix Theme</option>
              <option value="cyber">Cyber Theme</option>
              <option value="synthwave">Synthwave Theme</option>
              <option value="hacker">Hacker Theme</option>
            </select>

            <button 
              style={styles.hackButtonStyle}
              onClick={(e) => {
                e.stopPropagation();
                handleStartHack();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (!cooldown) {
                  audio.click.play().catch(console.error);
                }
              }}
              disabled={cooldown > 0 || isHacking}
            >
              {isHacking ? 'HACKING...' : cooldown > 0 ? `WAIT ${cooldown}s` : 'START HACK'}
            </button>
            <a 
              href="https://t.me/ethicalh4cker" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                ...styles.toggleButtonStyle,
                textDecoration: 'none',
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.504 1.201-.825 1.23-.703.064-1.237-.461-1.917-.903-1.065-.692-1.665-1.122-2.702-1.799-1.195-.779-.421-1.206.261-1.906.179-.182 3.293-3.017 3.352-3.275.007-.032.014-.157-.059-.223-.074-.066-.172-.044-.249-.026-.107.025-1.812 1.153-5.113 3.382-.484.332-.921.495-1.312.487-.432-.015-1.261-.245-1.871-.447-.756-.254-1.357-.389-1.306-.821.027-.221.324-.437.892-.647 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.119.098.152.228.166.331.015.116.033.337.019.533z"/>
              </svg>
              Contact
            </a>
          </div>
        )}
      </div>
    </>
  );
};

// Add prop types validation
HackButton.propTypes = {
  // Add if needed
};

export default React.memo(HackButton); 