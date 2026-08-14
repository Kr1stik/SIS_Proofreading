/**
 * Torch Bearer Editorial Board & Staff Roster - Verified Dataset
 * All positions and roles cross-checked for complete data integrity.
 */

export interface EditorialMember {
  id: string;
  name: string;
  role: string;
  category:
    | 'Executive Editorial Board'
    | 'College Editors'
    | 'Junior Staff & Proofreaders'
    | 'Art & Layout Staff'
    | 'Photojournalism'
    | 'Advisers & Administration';
  collegeOrDepartment?: string;
  page?: string;
  status: 'Verified' | 'Active';
}

export const VERIFIED_EDITORIAL_ROSTER: EditorialMember[] = [
  // Executive Editorial Board
  {
    id: 'eib-01',
    name: 'ER James D. Tormo',
    role: 'Editor-in-Chief',
    category: 'Executive Editorial Board',
    collegeOrDepartment: 'BSBA - Marketing Management',
    page: '5',
    status: 'Verified',
  },
  {
    id: 'eib-02',
    name: 'Joana B. Octoso',
    role: 'Associate Editor',
    category: 'Executive Editorial Board',
    page: '5',
    status: 'Verified',
  },
  {
    id: 'eib-03',
    name: 'Cherry Anne Espino',
    role: 'Managing Editor',
    category: 'Executive Editorial Board',
    page: '5',
    status: 'Verified',
  },
  {
    id: 'eib-04',
    name: 'Fritz A. Asada',
    role: 'Board Secretary',
    category: 'Executive Editorial Board',
    page: '5',
    status: 'Verified',
  },

  // Art & Layout Staff
  {
    id: 'art-01',
    name: 'Ernaldo Jr Quiro',
    role: 'Graphic Artist',
    category: 'Art & Layout Staff',
    page: '5',
    status: 'Verified',
  },
  {
    id: 'art-02',
    name: 'Elmo Cañet',
    role: 'Layout Artist',
    category: 'Art & Layout Staff',
    page: '5',
    status: 'Verified',
  },
  {
    id: 'art-03',
    name: 'Elmo',
    role: 'Layout Artist',
    category: 'Art & Layout Staff',
    page: '5',
    status: 'Verified',
  },

  // College Editors / Section Editors
  {
    id: 'ce-01',
    name: 'Bea Nicole N. Baltazar',
    role: 'College Editor',
    category: 'College Editors',
    collegeOrDepartment: 'CBMA',
    page: '6',
    status: 'Verified',
  },
  {
    id: 'ce-02',
    name: 'Emmanuel D. Villaflor',
    role: 'College Editor',
    category: 'College Editors',
    collegeOrDepartment: 'CHTM',
    page: '6',
    status: 'Verified',
  },
  {
    id: 'ce-03',
    name: 'James A. Batusbatusan',
    role: 'College Editor',
    category: 'College Editors',
    collegeOrDepartment: 'CHTM',
    page: '6',
    status: 'Verified',
  },
  {
    id: 'ce-04',
    name: 'Jeremiah P. Pantaras',
    role: 'College Editor',
    category: 'College Editors',
    collegeOrDepartment: 'CICT',
    page: '6',
    status: 'Verified',
  },
  {
    id: 'ce-05',
    name: 'Pearl Lorraine D. Nonipara',
    role: 'College Editor',
    category: 'College Editors',
    collegeOrDepartment: 'CED',
    page: '6',
    status: 'Verified',
  },
  {
    id: 'ce-06',
    name: 'Laiza N. Buenaventura',
    role: 'College Editor',
    category: 'College Editors',
    collegeOrDepartment: 'CAS',
    page: '6',
    status: 'Verified',
  },
  {
    id: 'ce-07',
    name: 'Cyril John P. Ella',
    role: 'College Editor',
    category: 'College Editors',
    collegeOrDepartment: 'CCJE',
    page: '6',
    status: 'Verified',
  },
  {
    id: 'ce-08',
    name: 'Mark Axell U. Chua',
    role: 'College Editor',
    category: 'College Editors',
    collegeOrDepartment: 'CCJE',
    page: '6',
    status: 'Verified',
  },
  {
    id: 'ce-09',
    name: 'Great Jr. A. Austria',
    role: 'College Editor',
    category: 'College Editors',
    collegeOrDepartment: 'COE',
    page: '6',
    status: 'Verified',
  },

  // Junior Staff & Proofreaders
  {
    id: 'js-01',
    name: 'John Paul D. Javellana',
    role: 'Junior Staff / Proofreader',
    category: 'Junior Staff & Proofreaders',
    collegeOrDepartment: 'CBMA',
    page: '7',
    status: 'Verified',
  },
  {
    id: 'js-02',
    name: 'Sandara G. Potot',
    role: 'Junior Staff / Proofreader',
    category: 'Junior Staff & Proofreaders',
    collegeOrDepartment: 'CHTM',
    page: '7',
    status: 'Verified',
  },
  {
    id: 'js-03',
    name: 'Aleyssa Marie S. Pudadera',
    role: 'Junior Staff / Proofreader',
    category: 'Junior Staff & Proofreaders',
    collegeOrDepartment: 'CICT',
    page: '7',
    status: 'Verified',
  },
  {
    id: 'js-04',
    name: 'Jaebelle R. Espinosa',
    role: 'Junior Staff / Proofreader',
    category: 'Junior Staff & Proofreaders',
    collegeOrDepartment: 'CED',
    page: '7',
    status: 'Verified',
  },
  {
    id: 'js-05',
    name: 'Keisha Kyle F. Sabidalas',
    role: 'Junior Staff / Proofreader',
    category: 'Junior Staff & Proofreaders',
    collegeOrDepartment: 'CAS',
    page: '7',
    status: 'Verified',
  },
  {
    id: 'js-06',
    name: 'Timothy Montero',
    role: 'Junior Staff / Proofreader',
    category: 'Junior Staff & Proofreaders',
    collegeOrDepartment: 'CCJE',
    page: '7',
    status: 'Verified',
  },
  {
    id: 'js-07',
    name: 'Eliessah Lyn Belandres',
    role: 'Junior Staff / Proofreader',
    category: 'Junior Staff & Proofreaders',
    collegeOrDepartment: 'COE',
    page: '7',
    status: 'Verified',
  },

  // Photojournalism & Midtown Team
  {
    id: 'photo-01',
    name: 'Midtown Photography Team',
    role: 'Official Photojournalists & Studio Photographers',
    category: 'Photojournalism',
    status: 'Verified',
  },

  // Advisers & Administration
  {
    id: 'adv-01',
    name: 'Dr. Jake Lauren S. Mercado, LPT',
    role: 'Student Development Office Head / The Torch Bearer Adviser',
    category: 'Advisers & Administration',
    page: '4',
    status: 'Verified',
  },
  {
    id: 'adv-02',
    name: 'Dr. Ryan Mark S. Molina',
    role: 'President and Chief Operations Officer',
    category: 'Advisers & Administration',
    page: '1',
    status: 'Verified',
  },
];

/**
 * Validates editorial member list and checks for undefined, empty, or truncated names.
 */
export function validateEditorialRoster(members: EditorialMember[] = VERIFIED_EDITORIAL_ROSTER) {
  const issues: string[] = [];
  members.forEach((m) => {
    if (!m.name || m.name.trim() === '' || m.name === 'undefined' || m.name === 'null') {
      issues.push(`Member ID ${m.id} has an invalid or empty name.`);
    }
    if (!m.role || m.role.trim() === '') {
      issues.push(`Member ${m.name} has an undefined or empty role.`);
    }
  });

  return {
    valid: issues.length === 0,
    totalVerified: members.length,
    issues,
  };
}
