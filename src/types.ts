export type Curso = 
  | 'Ciencias' 
  | 'Sociales' 
  | 'DPCC' 
  | 'Idioma' 
  | 'Matemática' 
  | 'Comunicación' 
  | 'Razonamiento';

export type Materia = 
  | 'FÍSICA' | 'BIOLOGÍA' | 'ANATOMÍA' | 'QUÍMICA' 
  | 'HISTORIA' | 'GEOGRAFÍA' | 'FILOSOFÍA' 
  | 'CÍVICA' | 'PSICOLOGÍA' 
  | 'INGLÉS' 
  | 'ARITMÉTICA' | 'ÁLGEBRA' | 'GEOMETRÍA' | 'TRIGONOMETRÍA' 
  | 'LENGUAJE' | 'LITERATURA' 
  | 'RAZ. LÓGICO' | 'RAZ. MATEMÁTICO' | 'RAZ. VERBAL';

export type TaskType = string;

export type ExamType = 'Práctica' | 'Ranking' | 'General';

export interface TopicPart {
  id: string;
  name: string;
  flashcardsMastery?: string;
  practicaMastery?: string;
}

export interface SectionPart {
  id: string;
  name: string;
  score?: string;
}

export interface MateriaConfig {
  materia: Materia;
  enabledTasks: string[]; // e.g. ['Estudiar', 'Apunte', 'Crear Flashcards', 'Subir práctica', 'Repasos']
}

export interface Topic {
  id: string;
  curso: Curso;
  materia: Materia;
  tema: string;
  dateAdded: string;
  flashcardsMastery?: string;
  practicaMastery?: string;
  parts?: TopicPart[];
  flashcardsParts?: SectionPart[];
  practicaParts?: SectionPart[];
  manualRepasos?: number;
  week?: number;
}

export interface Task {
  id: string;
  topicId?: string;
  type: string;
  status: 'pending' | 'completed';
  dueDate: string;
  completedAt?: string;
}

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export type HabitFrequency = 'Diario' | 'Interdiario' | 'Cada 3 días' | 'Semanal';

export interface ScheduleEntry {
  id: string;
  day: DayOfWeek;
  materia: Materia;
}

export interface Habit {
  id: string;
  name: string;
  selectedDays: DayOfWeek[];
  frequency?: HabitFrequency; // For backward compatibility
  startDate: string;
  completedDates: string[];
}

export interface Exam {
  id: string;
  title: string;
  type: ExamType;
  date: string;
  materia?: Materia | 'Todas';
  score?: string;
}
