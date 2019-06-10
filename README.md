DataHog
=======

Running the Docker Image
------------------------
1. Use `docker build . -t <name>` to create the image.
2. Use `docker run -it -p 8000:8000 <name>` to start it in a container.

Running Locally
---------------
1. Install SQLite 3
2. Install Python 3.6.6
3. Install the pip packages in `django/requirements.txt`
4. Install Node.JS 8.12.0
5. Install the npm packages using `npm install` inside the `react` directory.
6. Run `npm run js` to build the JS files.
7. Run `python manage.py makemigrations` and `python manage.py migrate` inside the `django` directory to populate your database.
8. Run `python manage.py runserver` run the server.