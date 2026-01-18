__all__ = ("DomainCheckingMiddleware",)


class DomainCheckingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, req):
        domain = req.get_host().split(":")[0]
        # *.local things are for local development
        if domain.endswith("osu.sheppsu.me") or domain.endswith("osu.local"):
            req.urlconf = "playtest.osu.urls"
        elif (
            domain.endswith("c.sheppsu.me")
            or domain.endswith("c.local")
            or domain.endswith("c4.sheppsu.me")
            or domain.endswith("c4.local")
        ):
            req.urlconf = "playtest.cho.urls"

        return self.get_response(req)
