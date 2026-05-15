import { Curso, Materia, TaskType } from './types';

export const CURSOS_MATERIAS: Record<Curso, Materia[]> = {
  'Ciencias': ['FÍSICA', 'BIOLOGÍA', 'ANATOMÍA', 'QUÍMICA'],
  'Sociales': ['HISTORIA', 'GEOGRAFÍA'],
  'DPCC': ['CÍVICA', 'PSICOLOGÍA', 'FILOSOFÍA'],
  'Idioma': ['INGLÉS'],
  'Matemática': ['ARITMÉTICA', 'ÁLGEBRA', 'GEOMETRÍA', 'TRIGONOMETRÍA'],
  'Comunicación': ['LENGUAJE', 'LITERATURA'],
  'Razonamiento': ['RAZ. LÓGICO', 'RAZ. MATEMÁTICO', 'RAZ. VERBAL']
};

export const TASK_SCHEDULE: Record<TaskType, number> = {
  'Estudiar': 0,
  'Apunte': 0,
  'Crear Flashcards': 1,
  'Práctica': 1,
  'Repaso Flashcards 1': 3,
  'Repaso Flashcards 2': 7,
  'Rehacer Práctica': 14
};
