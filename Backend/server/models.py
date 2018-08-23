from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class Todo(models.Model):
    id = models.AutoField('id', primary_key=True)
    content = models.TextField('content', null=False)
    expire_at = models.BigIntegerField('expire_at', null=True, default=-1,
                                       validators=[MinValueValidator(-1)])
    priority = models.PositiveIntegerField('priority', null=True, default=0,
                                           validators=[MinValueValidator(0), MaxValueValidator(3)])
    completed = models.PositiveIntegerField('completed', null=True, default=0,
                                            validators=[MinValueValidator(0), MaxValueValidator(1)])

    objects = models.Manager()

    class Meta:
        ordering = ('id', 'expire_at', 'priority')
