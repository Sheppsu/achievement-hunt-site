# Setup (recommended inside a venv)
- `pip install -r requirements.txt`
- `npm install` in app/frontend
- Setup a local postgresql database
- Make a copy of template.env as .env and fill it in
- `py manage.py migrate` or `python3 manage.py migrate`
- run the `create_achievements.py` file if u want some test achievements

# Running
- `py manage.py runserver` or `python3 manage.py runserver` or whatever your python cmd is
- `npm run watch` or `npm run build-debug` in app/frontend