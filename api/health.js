module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    res.json({ 
      ok: true, 
      message: 'PCE Faculty Leave Portal API running',
      timestamp: new Date().toISOString()
    });
  };