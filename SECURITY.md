# Security Policy

## Reporting a Vulnerability

If you find a security issue, please do not open a public issue with exploit details. Contact the maintainer privately through the email listed on the GitHub profile, then include:

- A short description of the issue
- Steps to reproduce
- Impact and affected area
- Suggested fix, if known

## Scope

Security-sensitive areas include authentication, role-based access, student progress data, teacher/admin views, YouTube API access, Gemini API access, and database storage.

## Secret Handling

Never commit `.env` files, API keys, database URLs, JWT secrets, tokens, student data, teacher data, or admin credentials. Use local environment files and deployment-provider secret storage.
