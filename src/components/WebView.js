import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';

const WebView = () => {
    const iframeRef = useRef(null);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (iframe) {
            iframe.addEventListener('load', () => {
                setLoading(false);
                
                // Wait for iframe content to be fully loaded
                setTimeout(() => {
                    try {
                        // Get iframe document
                        const iframeDoc = iframe.contentWindow.document;
                        
                        // Add watermark
                        const watermark = iframeDoc.createElement('div');
                        watermark.style.cssText = `
                            position: fixed;
                            bottom: 20px;
                            right: 20px;
                            background: rgba(0, 0, 0, 0.7);
                            color: white;
                            padding: 8px 15px;
                            border-radius: 8px;
                            z-index: 2147483646;
                            font-family: Arial, sans-serif;
                            font-size: 14px;
                        `;
                        watermark.innerHTML = 'Developed by Cursor';
                        iframeDoc.body.appendChild(watermark);

                        // Inject script to monitor URL changes
                        const script = iframeDoc.createElement('script');
                        script.textContent = `
                            // Monitor URL changes
                            let lastUrl = window.location.href;
                            
                            // Function to check for WinGo page
                            function checkWinGoPage() {
                                if (window.location.href.includes('/home/AllLotteryGames/WinGo?id=1')) {
                                    console.log('WinGo page detected');
                                    const greenElements = document.querySelectorAll('.Betting__C-head-g');
                                    const redElements = document.querySelectorAll('.Betting__C-head-r');
                                    const elements = [...greenElements, ...redElements];
                                    
                                    if (elements.length > 0) {
                                        const randomElement = elements[Math.floor(Math.random() * elements.length)];
                                        const blinkAnimation = \`
                                            @keyframes blink {
                                                0% { opacity: 1; }
                                                50% { opacity: 0; }
                                                100% { opacity: 1; }
                                            }
                                        \`;
                                        
                                        const styleSheet = document.createElement('style');
                                        styleSheet.textContent = blinkAnimation;
                                        document.head.appendChild(styleSheet);
                                        
                                        randomElement.style.animation = 'blink 0.5s linear infinite';
                                        setTimeout(() => {
                                            randomElement.style.animation = '';
                                        }, 3000);
                                    }
                                }
                            }

                            // Check on URL changes
                            setInterval(() => {
                                if (window.location.href !== lastUrl) {
                                    lastUrl = window.location.href;
                                    checkWinGoPage();
                                }
                            }, 1000);

                            // Initial check
                            checkWinGoPage();
                        `;
                        iframeDoc.head.appendChild(script);
                        
                        console.log('Script injection successful');
                    } catch (error) {
                        console.error('Script injection failed:', error);
                    }
                }, 1000); // Wait 1 second for content to load
            });
        }
    }, []);

    return (
        <Box sx={{ width: '100%', height: '100vh', position: 'relative' }}>
            {loading && (
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                }}>
                    <CircularProgress />
                </Box>
            )}
            <iframe
                ref={iframeRef}
                src="/proxy"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    opacity: loading ? 0 : 1,
                    transition: 'opacity 0.3s ease'
                }}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                allow="fullscreen"
            />
        </Box>
    );
};

export default WebView;
