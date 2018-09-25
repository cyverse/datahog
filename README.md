iRODS File Dashboard
====================

Setting Up
----------
1. Install SQLite 3
2. Install Python 3.6.6 in a virtual environment
3. Install the pip packages in `requirements.txt`
4. Install Node.JS 8.12.0
5. Install the npm packages using `npm install`
6. Run `python manage.py makemigrations` and `python manage.py migrate` to populate your database
7. Run `python manage.py runserver` run the server
8. In another terminal, run `npm run dev` to bundle the JS/CSS files and start an auto-update service