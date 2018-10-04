# main/tasks.py
 
import logging
 
from dashboard.celery import app
 
 
@app.task
def import_files():
    print('Test')
    