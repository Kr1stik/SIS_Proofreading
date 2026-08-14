from django.core.management.base import BaseCommand
from documents.models import Spreadsheet, ProofreadRecord


EDITORIAL_ROSTER_DATA = [
    # Executive Editorial Board
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - Editorial Board',
        'page_label': '5',
        'student_name': 'ER James D. Tormo',
        'role_title': 'Editor-in-Chief',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - Editorial Board',
        'page_label': '5',
        'student_name': 'Joana B. Octoso',
        'role_title': 'Associate Editor',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - Editorial Board',
        'page_label': '5',
        'student_name': 'Cherry Anne Espino',
        'role_title': 'Managing Editor',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - Editorial Board',
        'page_label': '5',
        'student_name': 'Fritz A. Asada',
        'role_title': 'Board Secretary',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - Editorial Board',
        'page_label': '5',
        'student_name': 'Ernaldo Jr Quiro',
        'role_title': 'Graphic Artist',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - Editorial Board',
        'page_label': '5',
        'student_name': 'Elmo Cañet',
        'role_title': 'Layout Artist',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - Editorial Board',
        'page_label': '5',
        'student_name': 'Elmo',
        'role_title': 'Layout Artist',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },

    # College Editors
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - College Editors',
        'page_label': '6',
        'student_name': 'Bea Nicole N. Baltazar',
        'role_title': 'CBMA',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - College Editors',
        'page_label': '6',
        'student_name': 'Emmanuel D. Villaflor',
        'role_title': 'CHTM',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - College Editors',
        'page_label': '6',
        'student_name': 'James A. Batusbatusan',
        'role_title': 'CHTM',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - College Editors',
        'page_label': '6',
        'student_name': 'Jeremiah P. Pantaras',
        'role_title': 'CICT',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - College Editors',
        'page_label': '6',
        'student_name': 'Pearl Lorraine D. Nonipara',
        'role_title': 'CED',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - College Editors',
        'page_label': '6',
        'student_name': 'Laiza N. Buenaventura',
        'role_title': 'CAS',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - College Editors',
        'page_label': '6',
        'student_name': 'Cyril John P. Ella',
        'role_title': 'CCJE',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - College Editors',
        'page_label': '6',
        'student_name': 'Mark Axell U. Chua',
        'role_title': 'CCJE',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - College Editors',
        'page_label': '6',
        'student_name': 'Great Jr. A. Austria',
        'role_title': 'COE',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },

    # Junior Staff & Proofreaders
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - Junior Staff',
        'page_label': '7',
        'student_name': 'John Paul D. Javellana',
        'role_title': 'CBMA',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - Junior Staff',
        'page_label': '7',
        'student_name': 'Sandara G. Potot',
        'role_title': 'CHTM',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - Junior Staff',
        'page_label': '7',
        'student_name': 'Aleyssa Marie S. Pudadera',
        'role_title': 'CICT',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - Junior Staff',
        'page_label': '7',
        'student_name': 'Jaebelle R. Espinosa',
        'role_title': 'CED',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - Junior Staff',
        'page_label': '7',
        'student_name': 'Keisha Kyle F. Sabidalas',
        'role_title': 'CAS',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - Junior Staff',
        'page_label': '7',
        'student_name': 'Timothy Montero',
        'role_title': 'CCJE',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - Junior Staff',
        'page_label': '7',
        'student_name': 'Eliessah Lyn Belandres',
        'role_title': 'COE',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },

    # Advisers & President
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - Advisers',
        'page_label': '4',
        'student_name': 'Dr. Jake Lauren S. Mercado, LPT',
        'role_title': 'SDO Head / The Torch Bearer 2026 Adviser',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
    {
        'sheet_name': 'Content',
        'department': 'Torch Bearer 2026 - Advisers',
        'page_label': '1',
        'student_name': 'Dr. Ryan Mark S. Molina',
        'role_title': 'President and Chief Operations Officer',
        'photo_status': 'A',
        'text_status': 'A',
        'instruction_note': 'c/o Torch Bearer 2026 - Layout with PSD File',
        'is_header': False,
    },
]


class Command(BaseCommand):
    help = 'Seeds and verifies verified Editorial Board Roster into ProofreadRecord model'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Verifying Editorial Board Roster records...'))
        
        spreadsheet, _ = Spreadsheet.objects.get_or_create(
            title='Torch Bearer 2026 Page Plan Content'
        )

        created_count = 0
        updated_count = 0

        for item in EDITORIAL_ROSTER_DATA:
            name = item['student_name'].strip()
            if not name:
                self.stdout.write(self.style.ERROR(f"Skipping record with empty name: {item}"))
                continue

            record, created = ProofreadRecord.objects.update_or_create(
                spreadsheet=spreadsheet,
                student_name=name,
                defaults=item,
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Editorial Board verification complete! {created_count} created, {updated_count} updated.'
        ))
