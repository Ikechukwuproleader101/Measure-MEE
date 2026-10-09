# Measure Me — Services

This directory contains standalone, specialized services that run separately from the primary Node.js backend API, typically utilizing alternative runtimes or languages (such as Python for computer vision and 3D processing).

## Architecture & Conventions

- Each service resides in its own isolated subfolder.
- Each service maintains its own `README.md`, runtime configuration, dependency manifest (e.g., `requirements.txt`, `package.json`), and `.env.example`.
- All services must respect user data privacy guarantees.

## Active & Planned Services

- **`cv-service/`**: Python-based service for Open3D mesh generation and advanced geometric processing.
