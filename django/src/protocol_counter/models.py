from django.db import models

class ProtocolCounter(models.Model):
    year = models.IntegerField(unique=True, db_column="ano")
    last_number = models.IntegerField(default=0, db_column="ultimo_numero")

    def __str__(self):
        return f"{self.year} - {self.last_number}"
