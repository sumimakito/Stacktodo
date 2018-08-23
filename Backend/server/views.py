from rest_framework import viewsets, filters

from server.models import Todo
from server.serializers import TodoSerializer


class TodoViewSet(viewsets.ModelViewSet):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer
    filter_backends = (filters.OrderingFilter,)
    filter_fields = ('expire_at', 'completed',)
    ordering = ('-id', '-expire_at', 'completed',)

    def get_queryset(self):
        fexp = self.request.query_params.get('f_exp', None)
        fstate = self.request.query_params.get('f_state', None)
        tzero_ = self.request.query_params.get('t_zero', None)
        queryset = self.filter_queryset(self.queryset)
        if fexp is not None and tzero_ is not None:
            str.isdigit(str(tzero_).encode('utf8'))
            tzero = int(str(tzero_).encode('utf8'))
            if fexp == 'today':
                queryset = queryset.filter(expire_at__gte=tzero, expire_at__lt=tzero + (24 * 60 * 60 * 1000))
            elif fexp == 'in7days':
                queryset = queryset.filter(expire_at__gte=tzero, expire_at__lt=tzero + (8 * 24 * 60 * 60 * 1000))
            elif fexp == 'future':
                queryset = queryset.filter(expire_at__gte=tzero)
            elif fexp == 'expired':
                queryset = queryset.filter(expire_at__gte=0, expire_at__lt=tzero)
        if fstate is not None:
            if fstate == 'completed':
                queryset = queryset.filter(completed=1)
            elif fstate == 'uncompleted':
                queryset = queryset.filter(completed=0)
        return queryset
