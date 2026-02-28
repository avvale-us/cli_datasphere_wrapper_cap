# CAP API Wrapper for SAP Datasphere CLI

This project is a SAP Cloud Application Programming (CAP) Node.js wrapper for the `@sap/datasphere-cli`. It translates CAP API calls (HTTP requests) into CLI commands, executing them locally or in the Cloud Foundry environment.

## Prerequisites

- **Node.js**: Recommended v18+ 
- **SAP Datasphere CLI**: Provided as a project dependency (`@sap/datasphere-cli`).
- **SAP Cloud Application Programming Model CLI**: Ensure you have `@sap/cds-dk` installed globally (optional but helpful).

## Setup & Configuration

This wrapper requires two JSON files in the root folder (`cli_datasphere_wrapper_cap`) to function properly:

1. **`config.json`**: Controls the target environment (e.g., host).
   ```json
   {
       "datasphere_host": "https://<your-tenant>.eu10.hcs.cloud.sap/"
   }
   ```
2. **`secrets.json`**: Provides the CLI with your OAuth client credentials.
   ```json
   {
       "client_id": "<your-client-id>",
       "client_secret": "<your-client-secret>",
       "token_url": "<your-token-url>"
   }
   ```

*(Note: `config.json` and `secrets.json` are excluded from source control for security reasons depending on your setup. Please provide these fields according to your BTP Datasphere landscape.)*

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local CAP server:
   ```bash
   npm start
   ```
   *or*
   ```bash
   cds run
   ```
By default, the server listens at `http://localhost:4004`. The wrapper is protected using the `dummy` auth strategy for simple testing in development. 

## Deployment

To build and deploy the application to SAP BTP Cloud Foundry Environment:

```bash
npm run build:deploy
```
This executes the `mbt build` command and then pushes the generated `.mtar` archive.

## API Endpoints

The `DatasphereCliService` exposes several endpoints that map to datasphere CLI commands.

* **POST `/odata/v4/datasphere-cli/runTaskChain`**
  Executes a task chain. Requires `space` and `object` in the body.
* **GET `/odata/v4/datasphere-cli/getLogs(space='...',object='...')`**
  Lists the logs for a specific object (e.g. task chain).
* **GET `/odata/v4/datasphere-cli/getLogDetails(space='...',log_id='...',info_level='status')`**
  Fetches details of a specific run log.
* **GET `/odata/v4/datasphere-cli/getSecrets()`**
  Retrieves current credentials configuration from `secrets.json`.
* **POST `/odata/v4/datasphere-cli/updateSecrets`**
  Sets standard client credentials configurations gracefully to `secrets.json`. Expects `payload` in the body.
* **GET `/odata/v4/datasphere-cli/getHost()`**
  Retrieves current host from `config.json`.
* **POST `/odata/v4/datasphere-cli/updateHost`**
  Changes the default host. Requires `new_host` string in the body.

## Testing Documentation

A `.http` file is provided (`test.http`) which can be used alongside the **REST Client** extension in VS Code. It sets up basic variables and demonstrates executing all available API endpoints.
