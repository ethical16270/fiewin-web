class URLLogger {
  static loggedURLs = new Set();

  static log(url) {
    if (!this.loggedURLs.has(url)) {
      this.loggedURLs.add(url);
      console.log('New URL visited:', url);
      
      // You can also send this to your server
      this.sendToServer(url);
    }
  }

  static sendToServer(url) {
    // Send URL to your server
    fetch('/api/log-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      })
    }).catch(error => console.error('Error logging URL:', error));
  }

  static getHistory() {
    return Array.from(this.loggedURLs);
  }
}

export default URLLogger; 