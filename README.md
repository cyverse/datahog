iRODS File Dashboard
====================

Running the Docker Image
------------------------
1. Use `docker build . <name>` to create the image
2. Use `docker run -it -p 8000:8000 <name>` to start it.

Running Locally
---------------
1. Install SQLite 3
2. Install Python 3.6.6 in a virtual environment
3. Install the pip packages in `django/requirements.txt`
4. Install Node.JS 8.12.0
5. Install the npm packages using `npm install` inside the `react` directory.
6. Run `npm run js` to build the JS files, and `npm run css` to build the CSS files.
7. Run `python manage.py makemigrations` and `python manage.py migrate` to populate your database
8. Run `python manage.py runserver` run the server