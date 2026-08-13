from django.db import models
from django.contrib.auth.models import User

class Document(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

class Spreadsheet(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='spreadsheets/')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

class ProofreadRecord(models.Model):
    spreadsheet = models.ForeignKey(Spreadsheet, on_delete=models.CASCADE, related_name='records')
    sheet_name = models.CharField(max_length=100) # 'ABC Flyleaves', 'Content', 'XYZ Flyleaves'
    department = models.CharField(max_length=255, blank=True, null=True)
    page_label = models.CharField(max_length=20, blank=True, null=True)
    student_name = models.CharField(max_length=255)
    role_title = models.CharField(max_length=255, blank=True, null=True)
    photo_status = models.CharField(max_length=10, default='A')
    text_status = models.CharField(max_length=10, default='A')
    instruction_note = models.TextField(blank=True, null=True)
    is_header = models.BooleanField(default=False)