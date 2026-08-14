import os
from django.conf import settings
from rest_framework import serializers
from .models import Document, Spreadsheet


def get_absolute_file_url(file_field, request=None):
    """
    Constructs an absolute URL for a FileField or ImageField.
    Prioritizes explicit BACKEND_URL / Render hostname configuration,
    then falls back to request.build_absolute_uri(), and finally the relative path.
    """
    if not file_field:
        return None

    try:
        relative_url = file_field.url
    except Exception:
        return None

    # 1. Configured BACKEND_URL or Render URL
    backend_url = (
        getattr(settings, 'BACKEND_URL', None)
        or os.environ.get('BACKEND_URL')
        or os.environ.get('RENDER_EXTERNAL_URL')
        or (f"https://{os.environ['RENDER_EXTERNAL_HOSTNAME']}" if os.environ.get('RENDER_EXTERNAL_HOSTNAME') else None)
    )

    if backend_url:
        backend_url = backend_url.rstrip('/')
        if not relative_url.startswith('/'):
            relative_url = f"/{relative_url}"
        return f"{backend_url}{relative_url}"

    # 2. Build absolute URI from request context
    if request is not None:
        return request.build_absolute_uri(relative_url)

    return relative_url


class DocumentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='title', read_only=True)
    url = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'title', 'name', 'file', 'url', 'file_url', 'uploaded_at']

    def get_url(self, obj):
        return get_absolute_file_url(obj.file, self.context.get('request'))

    def get_file_url(self, obj):
        return self.get_url(obj)


class SpreadsheetSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='title', read_only=True)
    url = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Spreadsheet
        fields = ['id', 'title', 'name', 'file', 'url', 'file_url', 'uploaded_at']

    def get_url(self, obj):
        return get_absolute_file_url(obj.file, self.context.get('request'))

    def get_file_url(self, obj):
        return self.get_url(obj)
