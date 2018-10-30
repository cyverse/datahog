class FileDataRouter:

    def db_for_read(self, model, **hints):
        if model._meta.app_label == 'file_data':
            return 'file_data'
        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label == 'file_data':
            return 'file_data'
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label == 'file_data':
            return db == 'file_data'
        elif db == 'file_data':
            return False
        return None