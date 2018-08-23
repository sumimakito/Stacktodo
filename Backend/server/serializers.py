from rest_framework import serializers

from server.models import Todo


class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = ('id', 'content', 'expire_at', 'priority', 'completed')
