import os
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Document, Spreadsheet


class FileManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_upload_document_success(self):
        test_file = SimpleUploadedFile("sample.pdf", b"%PDF-1.4 test document content", content_type="application/pdf")
        url = reverse('upload_document')
        response = self.client.post(url, {'file': test_file, 'title': 'Sample PDF'}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('url', response.data)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['title'], 'Sample PDF')
        self.assertTrue(response.data['url'].startswith('http'))

    def test_upload_spreadsheet_success(self):
        test_file = SimpleUploadedFile("data.xlsx", b"dummy xlsx content", content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        url = reverse('upload_spreadsheet')
        response = self.client.post(url, {'file': test_file, 'title': 'Data Sheet'}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('url', response.data)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['title'], 'Data Sheet')
        self.assertTrue(response.data['url'].startswith('http'))

    def test_manage_files_get(self):
        doc_file = SimpleUploadedFile("doc.pdf", b"pdf content", content_type="application/pdf")
        sheet_file = SimpleUploadedFile("sheet.xlsx", b"sheet content", content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        doc = Document.objects.create(title="My Doc", file=doc_file)
        sheet = Spreadsheet.objects.create(title="My Sheet", file=sheet_file)

        url = reverse('manage_files')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['documents']), 1)
        self.assertEqual(len(response.data['spreadsheets']), 1)
        self.assertEqual(response.data['documents'][0]['title'], 'My Doc')
        self.assertTrue(response.data['documents'][0]['url'].startswith('http'))

    @override_settings(BACKEND_URL='https://sis-proofread-api.onrender.com')
    def test_backend_url_setting_override(self):
        doc_file = SimpleUploadedFile("render_doc.pdf", b"pdf content", content_type="application/pdf")
        doc = Document.objects.create(title="Render Doc", file=doc_file)
        url = reverse('manage_files')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['documents'][0]['url'].startswith('https://sis-proofread-api.onrender.com/media/'))


