from django.urls import path
from .views import manage_files, upload_document, upload_spreadsheet, login_view

urlpatterns = [
    path('auth/login/', login_view, name='login'),
    path('files/', manage_files, name='manage_files'),
    path('upload/document/', upload_document, name='upload_document'),
    path('upload/spreadsheet/', upload_spreadsheet, name='upload_spreadsheet'),
]