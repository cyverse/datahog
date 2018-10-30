class LogsRouter:

    def db_for_read(self, model, **hints):
        if model._meta.app_label == 'logs':
            return 'logs'
        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label == 'logs':
            return 'logs'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label == 'logs':
            return db == 'logs'
        elif db == 'logs':
            return False
        return None