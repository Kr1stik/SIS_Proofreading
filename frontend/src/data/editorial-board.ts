/**
 * Editorial Board Members and Staff Roster Dataset
 */

export interface EditorialBoardMember {
  id: string;
  name: string;
  position: string;
  role?: string;
  department?: string;
  category?: string;
  photoUrl?: string;
  page?: string;
}

export const EDITORIAL_BOARD_MEMBERS: EditorialBoardMember[] = [
  // Executive Editorial Board
  {
    id: 'eb-01',
    name: 'ER James D. Tormo',
    position: 'Editor-in-Chief',
    role: 'Editor-in-Chief',
    department: 'BSBA Marketing Management',
    category: 'Executive Editorial Board',
    page: '5',
  },
  {
    id: 'eb-02',
    name: 'Joana B. Octoso',
    position: 'Associate Editor',
    role: 'Associate Editor',
    category: 'Executive Editorial Board',
    page: '5',
  },
  {
    id: 'eb-03',
    name: 'Cherry Anne Espino',
    position: 'Managing Editor',
    role: 'Managing Editor',
    category: 'Executive Editorial Board',
    page: '5',
  },
  {
    id: 'eb-04',
    name: 'Fritz A. Asada',
    position: 'Board Secretary',
    role: 'Board Secretary',
    category: 'Executive Editorial Board',
    page: '5',
  },

  // Art & Layout Staff
  {
    id: 'eb-05',
    name: 'Ernaldo Jr Quiro',
    position: 'Graphic Artist',
    role: 'Graphic Artist',
    category: 'Art & Layout Staff',
    page: '5',
  },
  {
    id: 'eb-06',
    name: 'Elmo Cañet',
    position: 'Layout Artist',
    role: 'Layout Artist',
    department: 'Editorial Board',
    category: 'Art & Layout Staff',
    page: '5',
  },
  {
    id: 'eb-07',
    name: 'Elmo',
    position: 'Layout Artist',
    role: 'Layout Artist',
    department: 'Editorial Board',
    category: 'Art & Layout Staff',
    page: '5',
  },

  // College Editors
  {
    id: 'eb-08',
    name: 'Bea Nicole N. Baltazar',
    position: 'College Editor',
    role: 'College Editor',
    department: 'CBMA',
    category: 'College Editors',
    page: '6',
  },
  {
    id: 'eb-09',
    name: 'Emmanuel D. Villaflor',
    position: 'College Editor',
    role: 'College Editor',
    department: 'CHTM',
    category: 'College Editors',
    page: '6',
  },
  {
    id: 'eb-10',
    name: 'James A. Batusbatusan',
    position: 'College Editor',
    role: 'College Editor',
    department: 'CHTM',
    category: 'College Editors',
    page: '6',
  },
  {
    id: 'eb-11',
    name: 'Jeremiah P. Pantaras',
    position: 'College Editor',
    role: 'College Editor',
    department: 'CICT',
    category: 'College Editors',
    page: '6',
  },
  {
    id: 'eb-12',
    name: 'Pearl Lorraine D. Nonipara',
    position: 'College Editor',
    role: 'College Editor',
    department: 'CED',
    category: 'College Editors',
    page: '6',
  },
  {
    id: 'eb-13',
    name: 'Laiza N. Buenaventura',
    position: 'College Editor',
    role: 'College Editor',
    department: 'CAS',
    category: 'College Editors',
    page: '6',
  },
  {
    id: 'eb-14',
    name: 'Cyril John P. Ella',
    position: 'College Editor',
    role: 'College Editor',
    department: 'CCJE',
    category: 'College Editors',
    page: '6',
  },
  {
    id: 'eb-15',
    name: 'Mark Axell U. Chua',
    position: 'College Editor',
    role: 'College Editor',
    department: 'CCJE',
    category: 'College Editors',
    page: '6',
  },
  {
    id: 'eb-16',
    name: 'Great Jr. A. Austria',
    position: 'College Editor',
    role: 'College Editor',
    department: 'COE',
    category: 'College Editors',
    page: '6',
  },

  // Junior Staff & Proofreaders
  {
    id: 'eb-17',
    name: 'John Paul D. Javellana',
    position: 'Junior Staff / Proofreader',
    role: 'Junior Staff / Proofreader',
    department: 'CBMA',
    category: 'Junior Staff & Proofreaders',
    page: '7',
  },
  {
    id: 'eb-18',
    name: 'Sandara G. Potot',
    position: 'Junior Staff / Proofreader',
    role: 'Junior Staff / Proofreader',
    department: 'CHTM',
    category: 'Junior Staff & Proofreaders',
    page: '7',
  },
  {
    id: 'eb-19',
    name: 'Aleyssa Marie S. Pudadera',
    position: 'Junior Staff / Proofreader',
    role: 'Junior Staff / Proofreader',
    department: 'CICT',
    category: 'Junior Staff & Proofreaders',
    page: '7',
  },
  {
    id: 'eb-20',
    name: 'Jaebelle R. Espinosa',
    position: 'Junior Staff / Proofreader',
    role: 'Junior Staff / Proofreader',
    department: 'CED',
    category: 'Junior Staff & Proofreaders',
    page: '7',
  },
  {
    id: 'eb-21',
    name: 'Keisha Kyle F. Sabidalas',
    position: 'Junior Staff / Proofreader',
    role: 'Junior Staff / Proofreader',
    department: 'CAS',
    category: 'Junior Staff & Proofreaders',
    page: '7',
  },
  {
    id: 'eb-22',
    name: 'Timothy Montero',
    position: 'Junior Staff / Proofreader',
    role: 'Junior Staff / Proofreader',
    department: 'CCJE',
    category: 'Junior Staff & Proofreaders',
    page: '7',
  },
  {
    id: 'eb-23',
    name: 'Eliessah Lyn Belandres',
    position: 'Junior Staff / Proofreader',
    role: 'Junior Staff / Proofreader',
    department: 'COE',
    category: 'Junior Staff & Proofreaders',
    page: '7',
  },

  // Photojournalism
  {
    id: 'eb-24',
    name: 'Midtown Photography Team',
    position: 'Official Photojournalists & Studio Photographers',
    role: 'Photojournalist',
    category: 'Photojournalism',
  },

  // Advisers & Administration
  {
    id: 'eb-25',
    name: 'Dr. Jake Lauren S. Mercado, LPT',
    position: 'Student Development Office Head / The Torch Bearer Adviser',
    role: 'Adviser',
    category: 'Advisers & Administration',
    page: '4',
  },
  {
    id: 'eb-26',
    name: 'Dr. Ryan Mark S. Molina',
    position: 'President and Chief Operations Officer',
    role: 'Administration',
    category: 'Advisers & Administration',
    page: '1',
  },
];
