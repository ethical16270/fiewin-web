import React from 'react';
import { Box } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Define the scrolling animation
const scrolling = keyframes`
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
`;

// Create styled components
const ScrollContainer = styled(Box)({
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'center'
});

const ScrollText = styled(Box)(({ theme }) => ({
  display: 'inline-block',
  whiteSpace: 'nowrap',
  color: '#00ff00',
  fontFamily: 'monospace',
  fontSize: '14px',
  fontWeight: 'bold',
  textShadow: '0 0 5px rgba(0,255,0,0.5)',
  animation: `${scrolling} 20s linear infinite`,
  paddingLeft: '100%'
}));

const ScrollingHeadline = ({ text = "This hack is made by JITU contact on telegram @smsn_knt" }) => {
  // Repeat the text to ensure continuous scrolling
  const repeatedText = `${text} • `.repeat(3);

  return (
    <ScrollContainer>
      <ScrollText component="span">
        {repeatedText}
      </ScrollText>
    </ScrollContainer>
  );
};

export default ScrollingHeadline; 