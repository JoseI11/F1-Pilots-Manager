
# F1 Pilots Manager

Read in: [Spanish](README.es.md) | [English](README.md) 



## Overview
F1 Pilots Manager is a web application to manage Formula 1 drivers, built with a RESTful API in Flask.  

It includes a full CRUD, filtering/search, pagination, and basic statistics with charts.
## Demo

Currently not deployed. Run it locally using the steps below.


## Features

- Full CRUD for drivers (create, read, update, delete)
- Filtering and search
- Pagination
- Server-side validation and error handling
- Responsive UI (desktop and mobile)
- Driver statistics and charts
## Tech Stack
- **Python + Flask** – Backend framework used to build a clean RESTful API quickly.
- **SQLite** – Simple local database for fast setup and portability.
- **HTML5 / CSS3 / Vanilla JavaScript** – Lightweight frontend without extra complexity.
- **Bootstrap 5** – Responsive layout and UI components.
- **Chart.js** – Data visualization for driver statistics.
- **PostImages** – Hosts screenshots/images to keep the repository lightweight.
## Screenshots

![PC](https://i.postimg.cc/7LhzNLkD/Macbook-Air-127-0-0-1.png)

![Cellphone](https://i.postimg.cc/pdrjBdHt/Samsung-Galaxy-S20-127-0-0-1.png)

## Getting Started
Clone the repository:

```bash
git clone https://github.com/JoseI11/F1-Pilots-Manager.git
cd F1-Pilots-Manager
```
Create and activate a virtual environment:
```bash
python -m venv venv
# macOS/Linux
source venv/bin/activate
# Windows (PowerShell)
venv\Scripts\Activate.ps1
```
Install dependencies:
```bash
pip install -r requirements.txt
```
Run the app:
```bash
python app.py
```
Open in your browser:
```bash
http://localhost:5000
```

## Roadmap

- Add sorting options (points, wins, team).
- Improve statistics dashboard (more charts and insights).
- Add tests for API endpoints.
- Add Docker support for easier setup.
## Authors

- [@José Imhoff](https://www.linkedin.com/in/joseimhoff/)

