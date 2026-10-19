# Render Deployment Documentation

## Required Environment Variables (Names Only)

- `PORT`: The port on which the Express web server listens (Render defaults to `10000`).
- `NODE_ENV`: Application deployment environment (`production` for deployed web service).
- `DATABASE_URL`: PostgreSQL database connection string provided by the Render database service.

## Render Free-Tier Database & Service Specifications & Limits

- **PostgreSQL RAM & CPU:** 1 GB RAM and 0.1 shared CPU core.
- **PostgreSQL Storage Limit:** 1 GB disk storage limit for free PostgreSQL instances.
- **Expiration Policy:** Free PostgreSQL databases on Render expire 90 days after creation.
- **Web Service Behavior:** Free tier web services automatically spin down after 15 minutes of inactivity (cold start takes ~30–50 seconds on subsequent requests).
