class CorsMiddleware(object):
    def process_response(self, request, response):
        # A dirty fix here, cuz I can't figure out what's wrong with the django-corn-headers dependency.
        # -- Makito
        response['Access-Control-Allow-Origin'] = 'stacktodo.mak1t0.cc'
        return response
