const cds = require('@sap/cds');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_FILE = path.join(__dirname, '..', 'credentials.json');

// Replicates behavior of `auth.py`
function basicAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic');
        return res.status(401).json({ detail: 'Authorization header missing' });
    }

    const [authType, credentials] = authHeader.split(' ');

    if (authType.toLowerCase() !== 'basic') {
        res.setHeader('WWW-Authenticate', 'Basic');
        return res.status(401).json({ detail: 'Invalid authentication type' });
    }

    try {
        const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
        const [username, password] = decoded.split(':');

        const credentialsData = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
        const storedUsers = credentialsData.users || [];

        const userAuthValid = storedUsers.some(
            user => user.username === username && user.password_hash === password
        );

        if (userAuthValid) {
            return next(); // Auth succeeded
        } else {
            res.setHeader('WWW-Authenticate', 'Basic');
            return res.status(401).json({ detail: 'Incorrect username or password' });
        }
    } catch (e) {
        res.setHeader('WWW-Authenticate', 'Basic');
        return res.status(400).json({ detail: 'Invalid credentials format' });
    }
}

cds.on('bootstrap', app => {
    // Add custom Basic Auth middleware to all /odata/ routes in express
    app.use('/odata/', basicAuthMiddleware);

    // Provide a simple healthcheck route matching python "/"
    app.post('/', basicAuthMiddleware, (req, res) => {
        res.status(200).json({ message: "Authentication successful", status: "200 OK" });
    });

    app.all('/hello', basicAuthMiddleware, (req, res) => {
        res.status(200).json({ message: "Hello, World" });
    });
});
