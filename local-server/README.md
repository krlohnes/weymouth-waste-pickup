# Local Development Server

This directory contains a simple Node.js server for local development of the Weymouth Waste Pickup application.

## Setup

1. Install dependencies:
   ```bash
   cd local-server
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open your browser to `http://localhost:3000`

## Why This Exists

Browsers block local file access when opening HTML files directly (`file://` protocol). This simple Express server allows you to:
- Test the application locally with full functionality
- Load JSON data files properly
- Develop and debug without needing to deploy

## GitHub Pages

This directory is ignored by GitHub Pages, so it won't be deployed to your live site.