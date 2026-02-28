const cds = require('@sap/cds');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

const CONFIG_FILE = path.join(__dirname, '..', 'config.json');
const SECRETS_FILE = path.join(__dirname, '..', 'secrets.json');

module.exports = cds.service.impl(async function() {

    // --- Utility Methods ---
    async function getDatasphereHost() {
        try {
            const data = await fs.readFile(CONFIG_FILE, 'utf8');
            const config = JSON.parse(data);
            return config.datasphere_host || null;
        } catch (e) {
            console.error('Failed to read host from config:', e);
            throw new Error('Config file error');
        }
    }

    async function setDatasphereHost(newHost) {
        try {
            const data = await fs.readFile(CONFIG_FILE, 'utf8');
            const config = JSON.parse(data);
            config.datasphere_host = newHost;
            await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 4));
        } catch (e) {
            console.error('Failed to write host to config:', e);
            throw new Error('Config file error');
        }
    }

    async function runCommand(command) {
        console.log(`Executing: ${command}`);
        try {
            const { stdout, stderr } = await execAsync(command);
            if (stderr) console.error(`Command stderr: ${stderr}`);
            return stdout;
        } catch (error) {
            console.error(`Command execution failed: ${error.message}`);
            throw new Error(`Command failed: ${error.stderr || error.message}`);
        }
    }

    async function login() {
        console.log("Logging in to Datasphere...");
        const host = await getDatasphereHost();
        // Since datasphere-cli is local/global, assuming 'npx datasphere' or global 'datasphere'
        const command = `npx datasphere login --secrets-file "${SECRETS_FILE}" --host "${host}"`;
        await runCommand(command);
        console.log("Login successful.");
    }

    async function logout() {
        console.log("Logging out from Datasphere... (optional)");
        const command = `npx datasphere logout`;
        try {
            await runCommand(command);
        } catch(e) { /* ignore logout errors */ }
    }

    // --- Service Handlers ---

    this.on('runTaskChain', async (req) => {
        const { space, object } = req.data;
        const host = await getDatasphereHost();
        
        try {
            await login();
            const command = `npx datasphere tasks chains run --space "${space}" --object "${object}" --host "${host}"`;
            const result = await runCommand(command);
            return result;
        } catch (e) {
            req.reject(500, e.message);
        } finally {
            await logout();
        }
    });

    this.on('getLogs', async (req) => {
        const { space, object } = req.data;
        const host = await getDatasphereHost();
        
        try {
            await login();
            const command = `npx datasphere tasks logs list --space "${space}" --object "${object}" --host "${host}"`;
            const result = await runCommand(command);
            return result;
        } catch (e) {
            req.reject(500, e.message);
        } finally {
            await logout();
        }
    });

    this.on('getLogDetails', async (req) => {
        const { space, log_id, info_level } = req.data;
        const host = await getDatasphereHost();
        const infoLvl = info_level || 'status';
        
        try {
            await login();
            const command = `npx datasphere tasks logs get --space "${space}" --log-id "${log_id}" --info-level "${infoLvl}" --host "${host}"`;
            const result = await runCommand(command);
            return result;
        } catch (e) {
            req.reject(500, e.message);
        } finally {
            await logout();
        }
    });

    this.on('getSecrets', async (req) => {
        try {
            const data = await fs.readFile(SECRETS_FILE, 'utf8');
            return data;
        } catch (e) {
            req.reject(404, "Secrets file not found");
        }
    });

    this.on('updateSecrets', async (req) => {
        const { payload } = req.data;
        try {
            let parsedPayload;
            if (typeof payload === 'string') {
                parsedPayload = JSON.parse(payload);
            } else {
                parsedPayload = payload;
            }
            await fs.writeFile(SECRETS_FILE, JSON.stringify(parsedPayload, null, 4));
            return JSON.stringify({ message: "Secrets saved successfully" });
        } catch (e) {
            req.reject(500, "Failed to write secrets: " + e.message);
        }
    });

    this.on('getHost', async (req) => {
        const host = await getDatasphereHost();
        return JSON.stringify({ datasphere_host: host });
    });

    this.on('updateHost', async (req) => {
        const { new_host } = req.data;
        try {
            await setDatasphereHost(new_host);
            return JSON.stringify({ message: `Datasphere host updated to ${new_host}` });
        } catch (e) {
            req.reject(500, e.message);
        }
    });
});
