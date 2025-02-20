import React from 'react';

const Watermark = () => {
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

  const watermarkText = '@smsn_knt';

  // Create a grid of watermark text
  const watermarkGrid = Array(100).fill(watermarkText).map((text, index) => (
    <span key={index} style={textStyle}>{text}</span>
  ));

  return (
    <div style={style}>
      {watermarkGrid}
    </div>
  );
};

export default Watermark; 