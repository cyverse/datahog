from .models import UpdateLog

class MainRouter:

    def db_for_read(self, model, **hints):
        if model == UpdateLog:
            return 'logs'
        return 'files'

    def db_for_write(self, model, **hints):
        if model == UpdateLog:
            return 'logs'
        return 'files'
