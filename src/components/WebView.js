import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Box, CircularProgress, Alert, Snackbar, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components with better performance
const StyledBox = styled(Box)({
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    // Fix for iOS Safari
    '@supports (-webkit-touch-callout: none)': {
        height: '-webkit-fill-available'
    }
});

const LoadingOverlay = styled(Box)({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(5px)',
    zIndex: 1000
});

const StyledIframe = styled('iframe')(({ loading }) => ({
    width: '100%',
    height: '100%',
    border: 'none',
    opacity: loading ? 0 : 1,
    transition: 'opacity 0.3s ease',
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Fix for iOS Safari
    '@supports (-webkit-touch-callout: none)': {
        height: '-webkit-fill-available'
    }
}));

const WebView = memo(({ onGameComplete }) => {
    const theme = useTheme();
    const iframeRef = useRef(null);
    const observerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const retryTimeoutRef = useRef(null);
    const maxRetries = 3;
    const [retryCount, setRetryCount] = useState(0);
    const [hackStarted, setHackStarted] = useState(false);

    // Enhanced script injection with retry mechanism
    const injectScripts = useCallback((iframeDoc) => {
        try {
            const monitoringScript = `
                // Improved URL monitoring with debounce
                const debounce = (fn, delay) => {
                    let timeoutId;
                    return (...args) => {
                        clearTimeout(timeoutId);
                        timeoutId = setTimeout(() => fn(...args), delay);
                    };
                };

                // Enhanced WinGo page detection with hack monitoring
                const checkWinGoPage = () => {
                    if (!window.location.href.includes('/home/AllLotteryGames/WinGo?id=1')) return;
                    
                    console.log('WinGo page detected');
                    
                    // Add blinking animation style
                    if (!document.getElementById('blinkAnimation')) {
                        const styleSheet = document.createElement('style');
                        styleSheet.id = 'blinkAnimation';
                        styleSheet.textContent = \`
                            @keyframes blink {
                                0%, 100% { opacity: 1; }
                                50% { opacity: 0; }
                            }
                            .blink-animation {
                                animation: blink 0.5s linear infinite;
                            }
                        \`;
                        document.head.appendChild(styleSheet);
                    }

                    // Monitor hack button and game completion
                    const setupMonitoring = () => {
                        // Monitor hack button clicks
                        const hackButton = document.querySelector('.hack-button');
                        if (hackButton && !hackButton.dataset.monitored) {
                            hackButton.dataset.monitored = 'true';
                            hackButton.addEventListener('click', () => {
                                // Notify parent when hack starts
                                window.parent.postMessage({ 
                                    type: 'HACK_STARTED',
                                    timestamp: new Date().getTime()
                                }, '*');
                                console.log('Hack started');

                                // Monitor for hack completion
                                const checkHackCompletion = () => {
                                    const resultElements = document.querySelectorAll('.Betting__C-head-g, .Betting__C-head-r');
                                    resultElements.forEach(element => {
                                        if (!element.dataset.processed) {
                                            element.dataset.processed = 'true';
                                            window.parent.postMessage({ 
                                                type: 'HACK_COMPLETE',
                                                timestamp: new Date().getTime()
                                            }, '*');
                                            console.log('Hack completion detected');
                                            element.classList.add('blink-animation');
                                            setTimeout(() => element.classList.remove('blink-animation'), 3000);
                                        }
                                    });
                                };

                                // Check for completion after a delay
                                setTimeout(checkHackCompletion, 2000);
                            });
                        }
                    };

                    // Initial setup
                    setupMonitoring();

                    // Setup observer for dynamic content
                    const observer = new MutationObserver(() => {
                        setupMonitoring();
                    });

                    observer.observe(document.body, { 
                        subtree: true, 
                        childList: true 
                    });

                    // Store observer for cleanup
                    window.monitoringObserver = observer;
                };

                // Enhanced URL change detection
                let lastUrl = window.location.href;
                const handleUrlChange = debounce(() => {
                    const currentUrl = window.location.href;
                    if (currentUrl !== lastUrl) {
                        lastUrl = currentUrl;
                        checkWinGoPage();
                    }
                }, 300);

                // URL change observer
                const urlObserver = new MutationObserver(handleUrlChange);
                urlObserver.observe(document, { 
                    subtree: true, 
                    childList: true,
                    attributes: true,
                    attributeFilter: ['href']
                });

                // Initial check
                checkWinGoPage();

                // Cleanup function
                window.cleanupWinGoMonitoring = () => {
                    urlObserver.disconnect();
                    if (window.monitoringObserver) {
                        window.monitoringObserver.disconnect();
                    }
                    const style = document.getElementById('blinkAnimation');
                    if (style) style.remove();
                };
            `;

            const script = iframeDoc.createElement('script');
            script.textContent = monitoringScript;
            iframeDoc.head.appendChild(script);
            
            console.log('Script injection successful');
            setRetryCount(0);
        } catch (error) {
            console.error('Script injection failed:', error);
            handleError('Script injection failed', error);
        }
    }, []);

    // Improved error handling
    const handleError = useCallback((message, error) => {
        setError(`${message}: ${error.message}`);
        if (retryCount < maxRetries) {
            retryTimeoutRef.current = setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setLoading(true);
                if (iframeRef.current) {
                    iframeRef.current.src = '/proxy';
                }
            }, 3000);
        }
    }, [retryCount]);

    // Enhanced navigation tracking
    const setupNavigationTracking = useCallback(() => {
        if (!iframeRef.current) return;

        try {
            const iframe = iframeRef.current;
            const iframeDoc = iframe.contentDocument;

            // Cleanup previous observer
            if (observerRef.current) {
                observerRef.current.disconnect();
            }

            // Setup new observer
            observerRef.current = new MutationObserver(() => {
                try {
                    const currentUrl = iframe.contentWindow.location.href;
                    console.log('Navigation to:', currentUrl);
                } catch (error) {
                    // Ignore cross-origin errors
                }
            });

            observerRef.current.observe(iframeDoc, {
                subtree: true,
                childList: true
            });

        } catch (error) {
            handleError('Navigation tracking failed', error);
        }
    }, [handleError]);

    // Improved iframe load handling
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const handleLoad = () => {
            setLoading(false);
            
            setTimeout(() => {
                try {
                    const iframeDoc = iframe.contentWindow.document;
                    injectScripts(iframeDoc);
                    setupNavigationTracking();
                } catch (error) {
                    handleError('Failed to initialize iframe', error);
                }
            }, 1000);
        };

        const handleLoadError = () => {
            handleError('Failed to load page', new Error('Network error'));
        };

        iframe.addEventListener('load', handleLoad);
        iframe.addEventListener('error', handleLoadError);
        
        return () => {
            iframe.removeEventListener('load', handleLoad);
            iframe.removeEventListener('error', handleLoadError);
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            // Cleanup scripts in iframe
            try {
                iframe.contentWindow.cleanupWinGoMonitoring?.();
            } catch (error) {
                // Ignore cross-origin errors
            }
        };
    }, [injectScripts, setupNavigationTracking, handleError]);

    const handleHackComplete = useCallback(() => {
        console.log('Hack completed, triggering game count update');
        if (onGameComplete) {
            onGameComplete();
        }
    }, [onGameComplete]);

    // Add this useEffect to listen for hack completion
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === 'HACK_COMPLETE') {
                console.log('Received HACK_COMPLETE message');
                handleHackComplete();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleHackComplete]);

    return (
        <StyledBox>
            <StyledIframe
                ref={iframeRef}
                src="/proxy"
                loading={loading ? 1 : 0}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                allow="fullscreen"
                title="Web View"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block',
                    WebkitOverflowScrolling: 'touch', // Enable smooth scrolling on iOS
                    overscrollBehavior: 'none' // Prevent pull-to-refresh
                }}
            />
            {loading && (
                <LoadingOverlay>
                    <CircularProgress 
                        size={48}
                        sx={{
                            color: '#00ff00'
                        }}
                    />
                </LoadingOverlay>
            )}
            
            <Snackbar 
                open={!!error} 
                autoHideDuration={6000} 
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    severity="error" 
                    variant="filled" 
                    onClose={() => setError(null)}
                    sx={{
                        boxShadow: theme.shadows[3]
                    }}
                >
                    {error}
                    {retryCount < maxRetries && ' (Retrying...)'}
                </Alert>
            </Snackbar>
        </StyledBox>
    );
});

WebView.displayName = 'WebView';

export default WebView;
