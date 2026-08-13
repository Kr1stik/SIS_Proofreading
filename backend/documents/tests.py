from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Department, Submission

class DocumentUploadTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('upload-document')

    def test_upload_without_file_fails(self):
        response = self.client.post(self.url, {}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_upload_file_success(self):
        test_file = SimpleUploadedFile("test.txt", b"sample content", content_type="text/plain")
        response = self.client.post(
            self.url,
            {'file': test_file, 'student_name': 'John Doe', 'department_name': 'Computer Science'},
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['student_name'], 'John Doe')
        self.assertEqual(response.data['department'], 'Computer Science')
        self.assertEqual(Submission.objects.count(), 1)

    def test_get_submissions_list(self):
        dept = Department.objects.create(name='Physics')
        Submission.objects.create(department=dept, student_name='Jane Smith')
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['student_name'], 'Jane Smith')

