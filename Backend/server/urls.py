from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter

from server import views

router = DefaultRouter()
router.register(r'todos', views.TodoViewSet)

urlpatterns = [
    url(r'^', include(router.urls)),
]
