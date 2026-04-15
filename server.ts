import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Gaxios } from 'gaxios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-app';

// Initialize SQLite database
const db = new Database('app.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'User',
    status TEXT NOT NULL DEFAULT 'Active',
    photoUrl TEXT
  );

  CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS versions (
    id TEXT PRIMARY KEY,
    entityType TEXT NOT NULL,
    entityId TEXT NOT NULL,
    data TEXT NOT NULL,
    createdBy TEXT,
    createdAt INTEGER NOT NULL,
    versionMessage TEXT
  );
`);

// Seed initial state if empty
const stateRow = db.prepare('SELECT data FROM app_state WHERE id = 1').get() as { data: string } | undefined;
let masterState: any = {};

if (stateRow) {
  masterState = JSON.parse(stateRow.data);
} else {
  // We will initialize this from the client on first connect if empty, or we can leave it empty
  masterState = {
    personas: [],
    projects: [],
    journeys: [],
    tasks: [],
    processMaps: [],
    products: [],
    services: [],
    sprints: [],
    auditLogs: [],
    companyProfile: {
      name: '',
      vertical: '',
      description: '',
      customerBenefits: '',
      targetEmotions: [],
      measurementMethods: [],
      pastAnalyses: []
    },
    stakeholders: [
      {
        id: 'stk_1',
        name: 'Robert Miller',
        category: 'Executive Sponsor',
        organization: 'ExampleCorp',
        email: 'robert@example.com',
        isGlobal: true
      },
      {
        id: 'stk_2',
        name: 'Linda Thompson',
        category: 'Director/Head of Service',
        organization: 'ExampleCorp',
        email: 'linda@example.com',
        isGlobal: true
      },
      {
        id: 'stk_3',
        name: 'IT Infrastructure Team',
        category: 'Corporate Function (IT, Finance, HR, Legal, Comms)',
        organization: 'ExampleCorp',
        isGlobal: true
      },
      {
        id: 'stk_4',
        name: 'Acme Contractors',
        category: 'Key Partner (Contractor, Housing, NHS, Third Sector)',
        organization: 'Acme Corp',
        isGlobal: true
      },
      {
        id: 'stk_5',
        name: 'Financial Conduct Authority',
        category: 'Regulator',
        isGlobal: true
      },
      {
        id: 'stk_6',
        name: 'Green Valley Tenants Association',
        category: 'Resident/Tenant Group',
        isGlobal: true
      },
      {
        id: 'stk_7',
        name: 'National Workers Union',
        category: 'Union',
        isGlobal: true
      }
    ],
    projectStakeholders: [
      {
        id: 'stk_1',
        name: 'Robert Miller',
        category: 'Executive Sponsor',
        organization: 'ExampleCorp',
        email: 'robert@example.com',
        isGlobal: true,
        projectId: 'proj_test',
        power: 9,
        interest: 9,
        sentiment: 'Positive',
        sentimentHistory: [
          { date: new Date(Date.now() - 86400000 * 7).toISOString(), sentiment: 'Neutral', note: 'Initial briefing' },
          { date: new Date().toISOString(), sentiment: 'Positive', note: 'Excited about the vision' }
        ],
        engagementStrategy: 'Maintain close relationship through weekly updates and strategic alignment sessions.',
        linkedItems: []
      },
      {
        id: 'stk_3',
        name: 'IT Infrastructure Team',
        category: 'Corporate Function (IT, Finance, HR, Legal, Comms)',
        organization: 'ExampleCorp',
        isGlobal: true,
        projectId: 'proj_test',
        power: 7,
        interest: 4,
        sentiment: 'Neutral',
        sentimentHistory: [
          { date: new Date().toISOString(), sentiment: 'Neutral' }
        ],
        engagementStrategy: 'Keep informed about technical requirements and ensure early involvement in infrastructure decisions.',
        linkedItems: []
      },
      {
        id: 'pstk_1',
        name: 'Local Community Board',
        category: 'Community Group',
        projectId: 'proj_test',
        isGlobal: false,
        power: 4,
        interest: 10,
        sentiment: 'Negative',
        sentimentHistory: [
          { date: new Date().toISOString(), sentiment: 'Negative', note: 'Concerned about noise and disruption' }
        ],
        engagementStrategy: 'Proactive consultation and community engagement events to address concerns and build trust.',
        linkedItems: []
      }
    ]
  };
  db.prepare('INSERT INTO app_state (id, data) VALUES (1, ?)').run(JSON.stringify(masterState));
}

function saveState() {
  db.prepare('UPDATE app_state SET data = ? WHERE id = 1').run(JSON.stringify(masterState));
}

app.use(express.json());

// Proxy for Gemini API calls from the frontend SDK
app.all('/gemini-api-proxy/*', async (req, res) => {
  try {
    const targetPath = req.url.replace('/gemini-api-proxy', '');
    const targetUrl = `https://generativelanguage.googleapis.com${targetPath}`;
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    
    const headers: Record<string, string> = {
      'x-goog-api-key': apiKey,
    };
    
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const apiRes = await fetch(targetUrl, fetchOptions);
    const data = await apiRes.json();
    res.status(apiRes.status).json(data);
  } catch (error) {
    console.error('Gemini proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy request to Gemini API' });
  }
});
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = 'usr_' + Date.now();
    const photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    
    // For the beta, everyone who registers is an admin by default
    const role = 'Admin'; 

    db.prepare('INSERT INTO users (id, name, email, password, role, status, photoUrl) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      id, name, email, hashedPassword, role, 'Active', photoUrl
    );

    const token = jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, name, email, role, status: 'Active', photoUrl } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT id, name, email, role, status, photoUrl FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.put('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { name, photoUrl } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    db.prepare('UPDATE users SET name = ?, photoUrl = ? WHERE id = ?').run(name, photoUrl || null, decoded.id);
    
    const user = db.prepare('SELECT id, name, email, role, status, photoUrl FROM users WHERE id = ?').get(decoded.id);
    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Management Routes
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, status, photoUrl FROM users').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', (req, res) => {
  const { name, email, role, password } = req.body;
  
  try {
    // Enforce 10 user limit for beta
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (userCount.count >= 11) { // 10 + 1 initial admin/user
      return res.status(400).json({ error: 'Beta limit reached: Maximum 10 additional accounts allowed.' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const id = 'usr_' + Date.now();
    const photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    const hashedPassword = bcrypt.hashSync(password || 'password123', 10);

    db.prepare('INSERT INTO users (id, name, email, password, role, status, photoUrl) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      id, name, email, hashedPassword, role || 'User', 'Active', photoUrl
    );

    res.json({ id, name, email, role: role || 'User', status: 'Active', photoUrl });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, role, status } = req.body;
  try {
    db.prepare('UPDATE users SET name = ?, role = ?, status = ? WHERE id = ?').run(name, role, status, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// API routes FIRST
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    hasKey: !!process.env.GEMINI_API_KEY, 
    keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) : null 
  });
});

app.post('/api/versions', (req, res) => {
  const { entityType, entityId, data, createdBy, versionMessage } = req.body;
  if (!entityType || !entityId || !data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const id = 'ver_' + Date.now();
    db.prepare('INSERT INTO versions (id, entityType, entityId, data, createdBy, createdAt, versionMessage) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      id, entityType, entityId, JSON.stringify(data), createdBy || null, Date.now(), versionMessage || null
    );
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error saving version:', error);
    res.status(500).json({ error: 'Failed to save version' });
  }
});

app.get('/api/versions/:entityType/:entityId', (req, res) => {
  const { entityType, entityId } = req.params;
  try {
    const versions = db.prepare('SELECT * FROM versions WHERE entityType = ? AND entityId = ? ORDER BY createdAt DESC').all(entityType, entityId);
    res.json(versions.map((v: any) => ({ ...v, data: JSON.parse(v.data) })));
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// Trustpilot Integration Proxy
app.get('/api/trustpilot/reviews', async (req, res) => {
  const apiKey = process.env.TRUSTPILOT_API_KEY;
  const domain = req.query.domain as string;

  if (!apiKey) {
    return res.status(400).json({ 
      error: 'Trustpilot API Key missing. Please set TRUSTPILOT_API_KEY in secrets.' 
    });
  }

  if (!domain) {
    return res.status(400).json({ 
      error: 'Please provide a website domain to fetch reviews.' 
    });
  }

  try {
    const gaxios = new Gaxios();
    
    // 1. Find the Business Unit ID for the given domain
    const findResponse = await gaxios.request({
      url: `https://api.trustpilot.com/v1/business-units/find`,
      method: 'GET',
      params: { name: domain },
      headers: { 'apikey': apiKey }
    });

    const businessUnitId = findResponse.data?.id;
    if (!businessUnitId) {
      throw new Error(`Could not find a Trustpilot business unit for domain: ${domain}`);
    }

    // 2. Fetch the reviews using the Business Unit ID
    const reviewsResponse = await gaxios.request({
      url: `https://api.trustpilot.com/v1/business-units/${businessUnitId}/reviews`,
      method: 'GET',
      params: { perPage: 20 },
      headers: { 'apikey': apiKey }
    });

    res.json(reviewsResponse.data);
  } catch (error: any) {
    console.error('Trustpilot API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch reviews from Trustpilot',
      details: error.response?.data?.message || error.message
    });
  }
});

// Google Reviews Integration Proxy (using Places API)
app.get('/api/google/reviews', async (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return res.status(400).json({ 
      error: 'Google configuration missing. Please set GOOGLE_MAPS_API_KEY and GOOGLE_PLACE_ID in secrets.' 
    });
  }

  try {
    const gaxios = new Gaxios();
    const response = await gaxios.request({
      url: `https://maps.googleapis.com/maps/api/place/details/json`,
      method: 'GET',
      params: {
        place_id: placeId,
        fields: 'reviews',
        key: apiKey
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(response.data.error_message || response.data.status);
    }

    res.json(response.data.result);
  } catch (error: any) {
    console.error('Google Places API error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch reviews from Google',
      details: error.message
    });
  }
});

// HubSpot Integration Proxy
app.get('/api/hubspot/tickets', async (req, res) => {
  const apiKey = process.env.HUBSPOT_ACCESS_TOKEN;

  if (!apiKey) {
    return res.status(400).json({ 
      error: 'HubSpot configuration missing. Please set HUBSPOT_ACCESS_TOKEN in secrets.' 
    });
  }

  try {
    const gaxios = new Gaxios();
    const response = await gaxios.request({
      url: `https://api.hubapi.com/crm/v3/objects/tickets`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ tickets: response.data.results });
  } catch (error: any) {
    console.error('HubSpot API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch tickets from HubSpot',
      details: error.response?.data?.message || error.message
    });
  }
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

async function startServer() {
  console.log('Starting server initialization...');
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Initializing Vite middleware...');
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite middleware initialized.');
    } catch (error) {
      console.error('Failed to initialize Vite middleware:', error);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', async (req, res) => {
      try {
        const fs = await import('fs');
        let html = await fs.promises.readFile(path.join(distPath, 'index.html'), 'utf-8');
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
        html = html.replace(
          '</head>',
          `<script>
            window.process = window.process || {};
            window.process.env = window.process.env || {};
            window.process.env.GEMINI_API_KEY = ${JSON.stringify(apiKey)};
            window.process.env.API_KEY = ${JSON.stringify(apiKey)};
            window.process.env.NODE_ENV = ${JSON.stringify(process.env.NODE_ENV || 'production')};
          </script></head>`
        );
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.send(html);
      } catch (e) {
        console.error(e);
        res.status(500).send('Error loading index.html');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'exists' : 'missing');
    import('fs').then(fs => fs.writeFileSync('env_check.txt', process.env.GEMINI_API_KEY || 'MISSING'));
  });

  // WebSocket Server for Real-Time Collaboration
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    // Send initial state to the newly connected client
    ws.send(JSON.stringify({ type: 'INITIAL_STATE', payload: masterState }));

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'UPDATE_COLLECTION') {
          const { collection, items } = data.payload;
          
          // Update master state
          masterState[collection] = items;
          saveState();

          // Broadcast to all OTHER clients
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'COLLECTION_UPDATED',
                payload: { collection, items }
              }));
            }
          });
        }
        
        if (data.type === 'SYNC_ALL') {
          // Client is sending its full state (e.g. on first load if server state is empty)
          masterState = { ...masterState, ...data.payload };
          saveState();
          
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'INITIAL_STATE', payload: masterState }));
            }
          });
        }

      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
  });
}

startServer();
