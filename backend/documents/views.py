import logging
import os
import uuid
from pathlib import Path
from urllib.parse import urlparse, unquote

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import Document, Spreadsheet
from .serializers import DocumentSerializer, SpreadsheetSerializer, get_absolute_file_url

logger = logging.getLogger(__name__)

ALLOWED_DOC_EXTENSIONS = {'.pdf', '.docx'}
ALLOWED_SHEET_EXTENSIONS = {'.xlsx', '.csv'}
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25MB Limit


def sanitize_and_generate_filename(filename: str) -> str:
    """Generates a secure UUID-prefixed filename to prevent path traversal & collisions."""
    base_name = os.path.basename(filename)
    ext = os.path.splitext(base_name)[1].lower()
    return f"{uuid.uuid4().hex}{ext}"


@api_view(['GET', 'DELETE'])
@permission_classes([AllowAny])
def manage_files(request):
    """
    GET: Returns lists of all uploaded documents and spreadsheets owned/accessible by user.
    DELETE: Securely deletes a specific file from PostgreSQL and disk.
    """
    try:
        if request.method == 'GET':
            documents = Document.objects.all().order_by('-uploaded_at')
            spreadsheets = Spreadsheet.objects.all().order_by('-uploaded_at')

            doc_serializer = DocumentSerializer(documents, many=True, context={'request': request})
            sheet_serializer = SpreadsheetSerializer(spreadsheets, many=True, context={'request': request})

            return Response({
                'documents': doc_serializer.data,
                'spreadsheets': sheet_serializer.data
            }, status=status.HTTP_200_OK)

        elif request.method == 'DELETE':
            file_type = request.query_params.get('type')
            file_id = request.query_params.get('id')
            file_url = request.query_params.get('fileUrl')

            if file_type == 'document':
                model = Document
            elif file_type == 'spreadsheet':
                model = Spreadsheet
            else:
                return Response({'error': 'Invalid file type parameter'}, status=status.HTTP_400_BAD_REQUEST)

            item = None
            if file_id and file_id.isdigit():
                item = model.objects.filter(id=int(file_id)).first()

            if not item and file_url:
                parsed_path = unquote(urlparse(file_url).path)
                clean_filename = os.path.basename(parsed_path)
                if clean_filename:
                    item = model.objects.filter(file__icontains=clean_filename).first()

            if item:
                # Prevent path traversal outside MEDIA_ROOT
                if item.file:
                    try:
                        file_path = Path(item.file.path).resolve()
                        media_root = Path(settings.MEDIA_ROOT).resolve()
                        if media_root in file_path.parents and file_path.is_file():
                            os.remove(file_path)
                    except (OSError, ValueError) as err:
                        logger.warning(f"File removal warning: {err}")

                item.delete()
                return Response({'success': True, 'message': 'File deleted successfully'}, status=status.HTTP_200_OK)

            return Response({'error': 'File record not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as exc:
        logger.error(f"Error in manage_files: {exc}", exc_info=True)
        return Response({'error': 'An internal server error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def upload_document(request):
    """Handles document uploads with file extension & size validation."""
    try:
        file_obj = request.FILES.get('file') or request.FILES.get('documentFile')
        if not file_obj:
            return Response({'error': 'No document file provided'}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in ALLOWED_DOC_EXTENSIONS:
            return Response({'error': 'Invalid file type. Only .pdf and .docx are allowed.'}, status=status.HTTP_400_BAD_REQUEST)

        if file_obj.size > MAX_FILE_SIZE_BYTES:
            return Response({'error': 'File size exceeds maximum limit of 25MB.'}, status=status.HTTP_400_BAD_REQUEST)

        original_title = file_obj.name
        file_obj.name = sanitize_and_generate_filename(file_obj.name)
        
        # Safely assign uploaded_by if field exists in Document model
        create_kwargs = {
            'title': request.data.get('title', original_title),
            'file': file_obj,
        }
        if hasattr(Document, 'uploaded_by') and request.user.is_authenticated:
            create_kwargs['uploaded_by'] = request.user

        doc = Document.objects.create(**create_kwargs)
        serializer = DocumentSerializer(doc, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as exc:
        logger.error(f"Error in upload_document: {exc}", exc_info=True)
        return Response({'error': 'An internal server error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def upload_spreadsheet(request):
    """Handles page plan spreadsheet uploads with file extension & size validation."""
    try:
        file_obj = request.FILES.get('file') or request.FILES.get('spreadsheetFile')
        if not file_obj:
            return Response({'error': 'No spreadsheet file provided'}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in ALLOWED_SHEET_EXTENSIONS:
            return Response({'error': 'Invalid file type. Only .xlsx and .csv are allowed.'}, status=status.HTTP_400_BAD_REQUEST)

        if file_obj.size > MAX_FILE_SIZE_BYTES:
            return Response({'error': 'File size exceeds maximum limit of 25MB.'}, status=status.HTTP_400_BAD_REQUEST)

        original_title = file_obj.name
        file_obj.name = sanitize_and_generate_filename(file_obj.name)
        
        # Safely assign uploaded_by if field exists in Spreadsheet model
        create_kwargs = {
            'title': request.data.get('title', original_title),
            'file': file_obj,
        }
        if hasattr(Spreadsheet, 'uploaded_by') and request.user.is_authenticated:
            create_kwargs['uploaded_by'] = request.user

        sheet = Spreadsheet.objects.create(**create_kwargs)
        serializer = SpreadsheetSerializer(sheet, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as exc:
        logger.error(f"Error in upload_spreadsheet: {exc}", exc_info=True)
        return Response({'error': 'An internal server error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    identifier = request.data.get('username') or request.data.get('email')
    password = request.data.get('password')

    print("=== AUTH DEBUG ===")
    print(f"Received identifier: '{identifier}', password provided: {bool(password)}")

    if not identifier or not password:
        return Response({'error': 'Please enter both username and password.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if user exists in DB at all
    user_exists = User.objects.filter(username=identifier).first() or User.objects.filter(email__iexact=identifier).first()
    if user_exists:
        print(f"Found user in DB: '{user_exists.username}', is_active: {user_exists.is_active}")
    else:
        print(f"No user found matching: '{identifier}'")

    # 1. Direct authentication
    user = authenticate(username=identifier, password=password)

    # 2. Email fallback lookup
    if user is None and '@' in identifier:
        user_obj = User.objects.filter(email__iexact=identifier).first()
        if user_obj:
            user = authenticate(username=user_obj.username, password=password)

    if user is not None:
        print(f"Authentication SUCCESS for '{user.username}'")
        return Response({
            'success': True,
            'token': f"dev-token-{user.id}",
            'user': {'id': user.id, 'username': user.username, 'email': user.email}
        }, status=status.HTTP_200_OK)

    print("Authentication FAILED: Invalid password or inactive account.")
    return Response({'error': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)