import React, { useState, useEffect } from 'react';

const TelegramButton = () => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('telegramButtonPosition');
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    }
  }, []);

  const buttonStyle = {
    position: 'fixed',
    top: `${position.y}px`,
    left: `${position.x}px`,
    padding: '10px 20px',
    backgroundColor: '#229ED9', // Telegram blue
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: isDragging ? 'grabbing' : 'grab',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    fontWeight: 'bold',
    zIndex: 1001,
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    animation: 'pulse 2s infinite',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    userSelect: 'none',
    touchAction: 'none'
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Keep button within viewport
    const maxX = window.innerWidth - 150;
    const maxY = window.innerHeight - 50;
    const x = Math.min(Math.max(0, newX), maxX);
    const y = Math.min(Math.max(0, newY), maxY);
    
    setPosition({ x, y });
    // Save position to localStorage
    localStorage.setItem('telegramButtonPosition', JSON.stringify({ x, y }));
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    
    // Keep button within viewport
    const maxX = window.innerWidth - 150;
    const maxY = window.innerHeight - 50;
    const x = Math.min(Math.max(0, newX), maxX);
    const y = Math.min(Math.max(0, newY), maxY);
    
    setPosition({ x, y });
    // Save position to localStorage
    localStorage.setItem('telegramButtonPosition', JSON.stringify({ x, y }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  const keyframes = `
    @keyframes pulse {
      0% {
        transform: scale(1);
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }
      50% {
        transform: scale(1.05);
        box-shadow: 0 5px 15px rgba(34,158,217,0.4);
      }
      100% {
        transform: scale(1);
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={buttonStyle}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.504 1.201-.825 1.23-.703.064-1.237-.461-1.917-.903-1.065-.692-1.665-1.122-2.702-1.799-1.195-.779-.421-1.206.261-1.906.179-.182 3.293-3.017 3.352-3.275.007-.032.014-.157-.059-.223-.074-.066-.172-.044-.249-.026-.107.025-1.812 1.153-5.113 3.382-.484.332-.921.495-1.312.487-.432-.015-1.261-.245-1.871-.447-.756-.254-1.357-.389-1.306-.821.027-.221.324-.437.892-.647 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.119.098.152.228.166.331.015.116.033.337.019.533z"/>
        </svg>
        <a 
          href="https://t.me/ethicalh4cker" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: 'white', textDecoration: 'none' }}
          onClick={(e) => e.stopPropagation()}
        >
          Contact on Telegram
        </a>
      </div>
    </>
  );
};

export default TelegramButton; 