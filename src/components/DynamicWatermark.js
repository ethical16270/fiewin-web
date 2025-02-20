import React, { useEffect, useState } from 'react';

const DynamicWatermark = () => {
  const [watermarkText, setWatermarkText] = useState('');

  useEffect(() => {
    // Get user IP or other identifying information
    const getUserInfo = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setWatermarkText(`FieWin - ${data.ip}`);
      } catch (error) {
        setWatermarkText('FieWin');
      }
    };

    getUserInfo();
  }, []);

  const style = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 1000,
    opacity: 0.1,
    display: 'flex',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    transform: 'rotate(-45deg)',
    userSelect: 'none'
  };

  const textStyle = {
    padding: '20px',
    fontSize: '16px',
    color: '#000',
    whiteSpace: 'nowrap'
  };

  const watermarkGrid = Array(100).fill(watermarkText).map((text, index) => (
    <span key={index} style={textStyle}>{text}</span>
  ));

  return (
    <div style={style}>
      {watermarkGrid}
    </div>
  );
};

export default DynamicWatermark; 