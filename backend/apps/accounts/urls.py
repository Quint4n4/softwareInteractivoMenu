from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import BrandingApi, BrandingLogoApi, MeApi, RegisterApi, ThrottledLoginView

urlpatterns = [
    path("token/", ThrottledLoginView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("register/", RegisterApi.as_view(), name="register"),
    path("me/", MeApi.as_view(), name="me"),
    path("branding/", BrandingApi.as_view(), name="branding"),
    path("branding/logo/", BrandingLogoApi.as_view(), name="branding_logo"),
]
