import React, { useState } from 'react';
import { format, isToday, isBefore, startOfDay, parseISO, differenceInDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, BookOpen, GraduationCap, Plus, CheckCircle2, Circle, Trash2, Clock, Moon, Sun, Download, Upload, BarChart2, Star, Heart, Sparkles, Lock, CalendarDays, ArrowUp, ArrowDown, Activity, Users, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useAgenda } from './hooks/useAgenda';
import { Curso, Materia, ExamType, Topic, DayOfWeek, HabitFrequency, Habit } from './types';
import { CURSOS_MATERIAS } from './constants';

import { Button } from './components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/Card';

const getWeekBadgeClass = (week: number) => {
  const styles = [
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
  ];
  return styles[(week - 1) % styles.length];
};
import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { Badge } from './components/ui/Badge';
import { Modal } from './components/ui/Modal';

type View = 'agenda' | 'temas' | 'examenes' | 'estadisticas' | 'horario' | 'habitos' | 'tutores';

const DEFAULT_TUTORS = [
  "https://i.pinimg.com/1200x/9d/2c/37/9d2c3766a5a72597c8eea54bea9d1de4.jpg",
  "https://i.pinimg.com/1200x/c7/b4/d2/c7b4d2fbe6feb22d89e966802c5652e5.jpg",
  "https://i.pinimg.com/webp/1200x/31/a9/64/31a9645bc24c96951f917c86968f49a3.webp",
  "https://i.pinimg.com/736x/86/87/74/868774ff08afce87eb6b207ffc24f902.jpg",
  "https://i.pinimg.com/webp/736x/89/60/56/896056ec3e9dbe88f0a1fdf9f0fdfc17.webp",
  "https://i.pinimg.com/webp/1200x/32/da/e9/32dae9477954b5d6f3ac8bfb4e63f4b8.webp",
  "https://i.pinimg.com/736x/0a/e1/65/0ae1655ac1df1613d365dec92cfcc8fd.jpg",
];

export default function App() {
  const { topics, tasks, exams, schedule, habits, materiaConfigs, addTopic, toggleTask, addExam, deleteTopic, deleteExam, importData, updateExamScore, updateTopicMastery, updateTopicPartMastery, addTopicPart, removeTopicPart, incrementManualRepaso, reorderTopic, addCustomTask, addGeneralTask, deleteTask, addScheduleEntry, deleteScheduleEntry, addHabit, toggleHabit, deleteHabit, updateMateriaConfig } = useAgenda();
  const [currentView, setCurrentView] = useState<View>('agenda');
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [isMateriaConfigModalOpen, setIsMateriaConfigModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleExport = () => {
    const data = { topics, tasks, exams, schedule, habits };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agenda-estudio-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.topics && data.tasks && data.exams) {
          importData(data.topics, data.tasks, data.exams, data.schedule, data.habits);
          alert('Datos importados correctamente');
        } else {
          alert('Formato de archivo inválido');
        }
      } catch (err) {
        alert('Error al leer el archivo');
      }
    };
    reader.readAsText(file);
  };

  // Modals state
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isTopicDetailsModalOpen, setIsTopicDetailsModalOpen] = useState(false);
  const [isGeneralTaskModalOpen, setIsGeneralTaskModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [examScoreInput, setExamScoreInput] = useState('');
  const [statsSortOrder, setStatsSortOrder] = useState<'creation_asc' | 'creation_desc' | 'name_asc' | 'name_desc' | 'manual' | 'week_asc' | 'week_desc'>('creation_asc');
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('agenda_expanded_sections');
    return saved ? JSON.parse(saved) : {};
  });

  React.useEffect(() => {
    localStorage.setItem('agenda_expanded_sections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  const toggleSection = (id: string, isOpen: boolean) => {
    setExpandedSections(prev => ({ ...prev, [id]: isOpen }));
  };
  const [animations, setAnimations] = useState<string[]>([]);
  const [tutors, setTutors] = useState<string[]>(() => {
    const saved = localStorage.getItem('agenda_tutors');
    return saved ? JSON.parse(saved) : DEFAULT_TUTORS;
  });
  const [newTutorUrl, setNewTutorUrl] = useState('');

  const [plannedObjectives, setPlannedObjectives] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('agenda_planned_objectives');
    return saved ? JSON.parse(saved) : {};
  });

  const [dailyChallenges, setDailyChallenges] = useState<{date: string, taskIds: string[]}>(() => {
    const saved = localStorage.getItem('agenda_daily_challenges');
    return saved ? JSON.parse(saved) : { date: '', taskIds: [] };
  });
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('agenda_streak') || '0'));
  const [lastStreakDate, setLastStreakDate] = useState(() => localStorage.getItem('agenda_last_streak_date') || '');

  React.useEffect(() => {
    localStorage.setItem('agenda_tutors', JSON.stringify(tutors));
  }, [tutors]);

  React.useEffect(() => {
    localStorage.setItem('agenda_daily_challenges', JSON.stringify(dailyChallenges));
  }, [dailyChallenges]);

  React.useEffect(() => {
    localStorage.setItem('agenda_planned_objectives', JSON.stringify(plannedObjectives));
  }, [plannedObjectives]);

  React.useEffect(() => {
    localStorage.setItem('agenda_streak', streak.toString());
    localStorage.setItem('agenda_last_streak_date', lastStreakDate);
  }, [streak, lastStreakDate]);

  React.useEffect(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // Check if streak is broken
    if (lastStreakDate && differenceInDays(new Date(), parseISO(lastStreakDate)) > 1) {
      setStreak(0);
    }

    const currentChallengeTasks = dailyChallenges.taskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean);
    const topicIdsInChallenges = currentChallengeTasks.map(t => t?.topicId).filter(Boolean);
    const hasDuplicateTopics = new Set(topicIdsInChallenges).size < topicIdsInChallenges.length;

    if (dailyChallenges.date !== todayStr || hasDuplicateTopics) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayNames: DayOfWeek[] = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const tomorrowName = dayNames[tomorrow.getDay()];
      
      const tomorrowMaterias = schedule.filter(s => s.day === tomorrowName).map(s => s.materia);

      const eligibleTasks = tasks.filter(t => t.status === 'pending' && t.topicId);
      
      const tasksWithTopicInfo = eligibleTasks.map(t => {
        const topic = topics.find(tp => tp.id === t.topicId);
        return {
          ...t,
          materia: topic?.materia,
          isTomorrow: topic ? tomorrowMaterias.includes(topic.materia) : false
        };
      });

      // Sort: Tomorrow's materias first, then by due date
      tasksWithTopicInfo.sort((a, b) => {
        if (a.isTomorrow && !b.isTomorrow) return -1;
        if (!a.isTomorrow && b.isTomorrow) return 1;
        return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
      });

      const selectedIds: string[] = [];
      const usedTopicIds = new Set<string>();

      for (const task of tasksWithTopicInfo) {
        if (selectedIds.length >= 3) break;
        if (task.topicId && !usedTopicIds.has(task.topicId)) {
          selectedIds.push(task.id);
          usedTopicIds.add(task.topicId);
        }
      }

      setDailyChallenges({ date: todayStr, taskIds: selectedIds });
    } else {
      // Check if all challenges are completed today
      if (dailyChallenges.taskIds.length > 0) {
        const allCompleted = dailyChallenges.taskIds.every(id => {
          const task = tasks.find(t => t.id === id);
          return !task || task.status === 'completed'; // If deleted or completed
        });
        
        if (allCompleted && lastStreakDate !== todayStr) {
          setStreak(s => s + 1);
          setLastStreakDate(todayStr);
        }
      }
    }
  }, [tasks, topics, schedule, dailyChallenges.date, dailyChallenges.taskIds, lastStreakDate]);

  const triggerAnimation = () => {
    const id = crypto.randomUUID();
    setAnimations(prev => [...prev, id]);
    setTimeout(() => {
      setAnimations(prev => prev.filter(a => a !== id));
    }, 2500);
  };

  const handleToggleTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status === 'pending') {
      triggerAnimation();
    }
    toggleTask(taskId);
  };

  const toggleObjective = (taskId: string, targetDateStr: string) => {
    setPlannedObjectives(prev => {
      const currentList = prev[targetDateStr] || [];
      if (currentList.includes(taskId)) {
        return { ...prev, [targetDateStr]: currentList.filter(id => id !== taskId) };
      } else {
        return { ...prev, [targetDateStr]: [...currentList, taskId] };
      }
    });
  };

  // New Topic Form State
  const [newTopic, setNewTopic] = useState({
    curso: 'Ciencias' as Curso,
    materia: 'FÍSICA' as Materia,
    tema: '',
    dateAdded: format(new Date(), 'yyyy-MM-dd'),
    week: 1
  });

  // New Exam Form State
  const [newExam, setNewExam] = useState({
    title: '',
    type: 'Práctica' as ExamType,
    date: format(new Date(), 'yyyy-MM-dd'),
    materia: 'Todas' as Materia | 'Todas'
  });

  // New Subtask/General Task State
  const [newSubtask, setNewSubtask] = useState({ title: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [newGeneralTask, setNewGeneralTask] = useState({ title: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [newFlashcardPartName, setNewFlashcardPartName] = useState('');
  const [newPracticaPartName, setNewPracticaPartName] = useState('');

  // New Schedule Entry State
  const [newScheduleEntry, setNewScheduleEntry] = useState({
    day: 'Lunes' as DayOfWeek,
    materia: 'FÍSICA' as Materia
  });

  // New Habit State
  const [newHabit, setNewHabit] = useState({ name: '', selectedDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as DayOfWeek[] });

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.tema) return;
    addTopic(newTopic);
    setIsTopicModalOpen(false);
    setNewTopic({ ...newTopic, tema: '' });
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExam.title) return;
    addExam(newExam);
    setIsExamModalOpen(false);
    setNewExam({ ...newExam, title: '' });
  };

  const isTaskVisible = (task: any) => {
    if (task.isHabit) return true;
    if (!task.topicId) return true; // General tasks
    
    const topicTasks = tasks.filter(t => t.topicId === task.topicId);
    const isCompleted = (type: string) => topicTasks.some(t => t.type === type && t.status === 'completed');
    
    if (task.type === 'Estudiar') return true;
    if (task.type === 'Apunte') return isCompleted('Estudiar');
    if (task.type === 'Flashcards' || task.type === 'Crear Flashcards') return isCompleted('Apunte');
    
    if (task.type.startsWith('Repaso')) {
      if (!isCompleted('Flashcards') && !isCompleted('Crear Flashcards')) return false;
      const numMatch = task.type.match(/\d+/);
      if (numMatch) {
        const num = parseInt(numMatch[0]);
        if (num > 1 && !isCompleted(`Repaso ${num - 1}`) && !isCompleted(`Repaso Flashcards ${num - 1}`)) return false;
      }
      return true;
    }
    
    if (task.type.startsWith('Práctica') || task.type === 'Rehacer Práctica') {
      if (!isCompleted('Flashcards') && !isCompleted('Crear Flashcards')) return false;
      if (task.type === 'Práctica 2' && !isCompleted('Práctica 1')) return false;
      if (task.type === 'Rehacer Práctica' && !isCompleted('Práctica')) return false;
      return true;
    }

    return true;
  };

  const getNextClassDays = (materia: string) => {
    const today = new Date().getDay();
    const dayMap: Record<string, number> = { 'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };
    const entries = schedule.filter(s => s.materia === materia);
    if (entries.length === 0) return 999;
    
    let minDays = 999;
    entries.forEach(e => {
      const classDay = dayMap[e.day];
      let diff = classDay - today;
      if (diff < 0) diff += 7;
      if (diff < minDays) minDays = diff;
    });
    return minDays;
  };

  const getNextClassStatus = (materia: string) => {
    const days = getNextClassDays(materia);
    if (days === 999) return null;
    if (days === 0) return 'Clase hoy';
    if (days === 1) return 'Clase mañana';
    return `Clase en ${days} días`;
  };

  const isHabitDue = (habit: Habit, dateStr: string) => {
    const date = parseISO(dateStr);
    const dayNames: DayOfWeek[] = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayOfWeek = dayNames[date.getDay()];
    
    if (habit.selectedDays) {
      return habit.selectedDays.includes(dayOfWeek);
    }
    
    // Fallback for older habits that used frequency
    const freq = habit.frequency || 'Diario';
    const start = habit.startDate || format(new Date(), 'yyyy-MM-dd');
    const diff = differenceInDays(date, parseISO(start));
    if (diff < 0) return false;
    switch(freq) {
      case 'Diario': return true;
      case 'Interdiario': return diff % 2 === 0;
      case 'Cada 3 días': return diff % 3 === 0;
      case 'Semanal': return diff % 7 === 0;
      default: return false;
    }
  };

  const renderAgenda = () => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const todayStr = format(today, 'yyyy-MM-dd');
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
    
    const availableWeeks = Array.from(new Set(topics.map(t => t.week).filter(Boolean) as number[])).sort((a, b) => a - b);

    // Generate habit tasks
    const habitTasks: any[] = [];
    const dateStr = format(today, 'yyyy-MM-dd');
    habits.forEach(habit => {
      if (isHabitDue(habit, dateStr)) {
        const isCompleted = habit.completedDates.includes(dateStr);
        if (!isCompleted) {
          habitTasks.push({
            id: `habit-${habit.id}-${dateStr}`,
            isHabit: true,
            habitId: habit.id,
            dateStr: dateStr,
            type: habit.name,
            status: 'pending',
            dueDate: today.toISOString()
          });
        }
      }
    });

    const pendingTasks = [...tasks.filter(t => t.status === 'pending'), ...habitTasks];
    const visibleTasks = pendingTasks.filter(isTaskVisible).filter(task => {
      if (selectedWeeks.length === 0) return true;
      if (!task.topicId) return true; // Keep general tasks/habits unless they are associated with a filtered topic
      const topic = topics.find(t => t.id === task.topicId);
      return !topic || !topic.week || selectedWeeks.includes(topic.week);
    });
    
    const todayObjectiveIds = plannedObjectives[todayStr] || [];
    const tomorrowObjectiveIds = plannedObjectives[tomorrowStr] || [];
    
    const allObjectiveIdsToHide = new Set([...todayObjectiveIds, ...tomorrowObjectiveIds]);

    // Sort tasks by schedule priority first, then by due date
    const sortTasks = (taskList: any[]) => [...taskList].sort((a, b) => {
      const topicA = a.topicId ? topics.find(t => t.id === a.topicId) : null;
      const topicB = b.topicId ? topics.find(t => t.id === b.topicId) : null;
      
      const daysA = topicA ? getNextClassDays(topicA.materia) : 999;
      const daysB = topicB ? getNextClassDays(topicB.materia) : 999;
      
      if (daysA !== daysB) return daysA - daysB;
      return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
    });

    const groupedTasks = {
      objetivosHoy: sortTasks(todayObjectiveIds.map(id => visibleTasks.find(t => t.id === id)).filter(Boolean)),
      objetivosManana: sortTasks(tomorrowObjectiveIds.map(id => visibleTasks.find(t => t.id === id)).filter(Boolean)),
      estudio: sortTasks(visibleTasks.filter(t => t.type === 'Estudiar' && !allObjectiveIdsToHide.has(t.id))),
      apuntes: sortTasks(visibleTasks.filter(t => t.type === 'Apunte' && !allObjectiveIdsToHide.has(t.id))),
      flashcards: sortTasks(visibleTasks.filter(t => (t.type === 'Flashcards' || t.type === 'Crear Flashcards') && !allObjectiveIdsToHide.has(t.id))),
      repasos: sortTasks(visibleTasks.filter(t => t.type.startsWith('Repaso') && !allObjectiveIdsToHide.has(t.id))),
      practicas: sortTasks(visibleTasks.filter(t => (t.type.startsWith('Práctica') || t.type === 'Rehacer Práctica' || t.type === 'Subir práctica') && !allObjectiveIdsToHide.has(t.id))),
      general: sortTasks(visibleTasks.filter(t => !t.topicId && !t.isHabit && !allObjectiveIdsToHide.has(t.id))),
      habitos: sortTasks(visibleTasks.filter(t => t.isHabit))
    };

    const TaskItem: React.FC<{ task: any }> = ({ task }) => {
      const isOverdue = isBefore(parseISO(task.dueDate), today);
      const isDueToday = isToday(parseISO(task.dueDate));
      const isCompleted = task.status === 'completed';

      if (task.isHabit) {
        const habit = habits.find(h => h.id === task.habitId);
        return (
          <div className="flex items-center justify-between p-3 mb-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-3">
              <button 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                triggerAnimation();
                toggleHabit(task.habitId, task.dateStr);
              }} className="text-slate-400 hover:text-emerald-500 transition-colors">
                <Circle className="h-5 w-5" />
              </button>
              <div>
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{task.type}</p>
                {habit && (
                  <div className="flex gap-1 mt-0.5">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((letter, i) => {
                      const days: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                      const isSelected = habit.selectedDays.includes(days[i]);
                      if (!isSelected) return null;
                      return (
                        <span key={i} className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                          {letter}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20">Hábito</Badge>
              <span className={`text-[10px] font-medium ${isOverdue ? 'text-red-500 dark:text-red-400' : isDueToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {isOverdue ? 'Atrasado' : isDueToday ? 'Hoy' : format(parseISO(task.dueDate), "d MMM", { locale: es })}
              </span>
            </div>
          </div>
        );
      }

      const topic = task.topicId ? topics.find(t => t.id === task.topicId) : null;
      if (task.topicId && !topic) return null;

      const isTomorrowObjective = tomorrowObjectiveIds.includes(task.id);

      return (
        <div className={`flex items-center justify-between p-3 mb-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors hover:border-slate-200 dark:hover:border-slate-600 ${isCompleted ? 'opacity-60' : ''}`}>
          <div className="flex items-center gap-3">
            <button 
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleToggleTask(task.id)} 
              className={`transition-colors ${isCompleted ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-500'}`}
            >
              {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            </button>
            <div>
              <p className={`font-medium text-sm flex items-center gap-2 ${isCompleted ? 'text-slate-500 line-through dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                {task.type}
              </p>
              {topic && (
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{topic.tema}</p>
                  {topic.week && (
                    <Badge variant="outline" className={`text-[9px] h-3.5 py-0 px-1 font-bold ${getWeekBadgeClass(topic.week)}`}>
                      S{topic.week}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-1">
              {topic ? (
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="secondary">{topic.materia}</Badge>
                  {getNextClassStatus(topic.materia) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                      {getNextClassStatus(topic.materia)}
                    </span>
                  )}
                </div>
              ) : (
                <Badge variant="outline" className="text-slate-500 border-slate-300 dark:border-slate-600">General</Badge>
              )}
              <span className={`text-[10px] font-medium ${isOverdue && !isCompleted ? 'text-red-500 dark:text-red-400' : isDueToday && !isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {isCompleted ? 'Completado' : isOverdue ? 'Atrasado' : isDueToday ? 'Hoy' : format(parseISO(task.dueDate), "d MMM", { locale: es })}
              </span>
            </div>
            {!isCompleted && !task.isHabit && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleObjective(task.id, tomorrowStr);
                }}
                title={isTomorrowObjective ? "Quitar de objetivos de mañana" : "Añadir a objetivos de mañana"}
                className={`p-1.5 rounded-md transition-colors ${
                  isTomorrowObjective
                    ? 'bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-400 dark:hover:bg-purple-900/60'
                    : 'text-slate-300 hover:bg-slate-100 hover:text-purple-500 dark:text-slate-600 dark:hover:bg-slate-800'
                }`}
              >
                <Target className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      );
    };

    const renderTaskGroup = (title: string, icon: React.ReactNode, taskList: any[], colorClass: string) => {
      if (taskList.length === 0) return null;
      return (
        <Card className="mb-6">
          <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className={`text-lg flex items-center gap-2 ${colorClass}`}>
              {icon} {title} ({taskList.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {taskList.map(t => <TaskItem key={t.id} task={t} />)}
          </CardContent>
        </Card>
      );
    };

    const challengeTasks = dailyChallenges.taskIds
      .map(id => tasks.find(t => t.id === id))
      .filter(Boolean);

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Agenda</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full font-bold">
                <Sparkles className="h-4 w-4" />
                <span>Racha: {streak} {streak === 1 ? 'día' : 'días'}</span>
              </div>
              <Button onClick={() => setIsGeneralTaskModalOpen(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Tarea General
              </Button>
            </div>
          </div>

          {availableWeeks.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" /> Filtrar Semana
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedWeeks.length === 0 ? "default" : "outline"}
                    size="sm"
                    className="text-[10px] h-6 px-3 rounded-full"
                    onClick={() => setSelectedWeeks([])}
                  >
                    Todas
                  </Button>
                  {availableWeeks.map(w => (
                    <Button
                      key={w}
                      variant={selectedWeeks.includes(w) ? "default" : "outline"}
                      size="sm"
                      className={`text-[10px] h-6 px-3 rounded-full ${selectedWeeks.includes(w) ? getWeekBadgeClass(w) : ''}`}
                      onClick={() => {
                        setSelectedWeeks(prev => 
                          prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]
                        );
                      }}
                    >
                      S{w}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {challengeTasks.length > 0 && (
          <Card className="border-orange-200 dark:border-orange-900/50 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <Star className="h-5 w-5" /> Retos del Día
              </CardTitle>
              <CardDescription className="text-orange-600/80 dark:text-orange-400/80">
                Completa estos retos para mantener tu racha diaria.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {challengeTasks.map(t => <TaskItem key={t.id} task={t} />)}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {renderTaskGroup('Objetivos de Hoy', <Target className="h-5 w-5" />, groupedTasks.objetivosHoy, 'text-purple-600 dark:text-purple-400')}
          {renderTaskGroup('Objetivos para Mañana', <Target className="h-5 w-5" />, groupedTasks.objetivosManana, 'text-fuchsia-600 dark:text-fuchsia-400')}
          {renderTaskGroup('Estudio Pendiente', <BookOpen className="h-5 w-5" />, groupedTasks.estudio, 'text-blue-600 dark:text-blue-400')}
          {renderTaskGroup('Apuntes Pendientes', <GraduationCap className="h-5 w-5" />, groupedTasks.apuntes, 'text-indigo-600 dark:text-indigo-400')}
          {renderTaskGroup('Flashcards', <Star className="h-5 w-5" />, groupedTasks.flashcards, 'text-amber-600 dark:text-amber-400')}
          {renderTaskGroup('Repasos', <Clock className="h-5 w-5" />, groupedTasks.repasos, 'text-emerald-600 dark:text-emerald-400')}
          {renderTaskGroup('Prácticas', <CheckCircle2 className="h-5 w-5" />, groupedTasks.practicas, 'text-purple-600 dark:text-purple-400')}
          {renderTaskGroup('Tareas Generales', <Calendar className="h-5 w-5" />, groupedTasks.general, 'text-slate-600 dark:text-slate-400')}
          {renderTaskGroup('Hábitos', <Activity className="h-5 w-5" />, groupedTasks.habitos, 'text-rose-600 dark:text-rose-400')}
          
          {visibleTasks.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              ¡Todo al día! No hay tareas pendientes visibles.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTemas = () => {
    const availableWeeks = Array.from(new Set(topics.map(t => t.week).filter(Boolean) as number[])).sort((a, b) => a - b);

    const filteredTopics = topics.filter(t => {
      if (selectedWeeks.length === 0) return true;
      return t.week && selectedWeeks.includes(t.week);
    });

    // Group topics by curso, then by materia
    const topicsByCurso = filteredTopics.reduce((acc, topic) => {
      const curso = topic.curso || 'General';
      if (!acc[curso]) acc[curso] = {};
      if (!acc[curso][topic.materia]) acc[curso][topic.materia] = [];
      acc[curso][topic.materia].push(topic);
      return acc;
    }, {} as Record<string, Record<string, Topic[]>>);

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Temas Estudiados</h2>
            <Button onClick={() => setIsTopicModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Tema
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filtrar por Semana:</span>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedWeeks.length === 0 ? "default" : "outline"}
                  size="sm"
                  className="text-[10px] h-7 px-3 rounded-full"
                  onClick={() => setSelectedWeeks([])}
                >
                  Todas
                </Button>
                {availableWeeks.map(w => (
                  <Button
                    key={w}
                    variant={selectedWeeks.includes(w) ? "default" : "outline"}
                    size="sm"
                    className={`text-[10px] h-7 px-3 rounded-full ${selectedWeeks.includes(w) ? getWeekBadgeClass(w) : ''}`}
                    onClick={() => {
                      setSelectedWeeks(prev => 
                        prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]
                      );
                    }}
                  >
                    Semana {w}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {Object.keys(topicsByCurso).length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No has agregado ningún tema aún.
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(topicsByCurso).map(([curso, materias]) => (
              <div key={curso} className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-500" />
                  {curso}
                </h3>
                
                <div className="space-y-4">
                  {Object.entries(materias).map(([materia, materiaTopics]) => {
                    const sectionId = `temas-${curso}-${materia}`;
                    const isOpen = expandedSections[sectionId] !== false; // Default to true

                    return (
                      <details 
                        key={materia} 
                        open={isOpen} 
                        onToggle={(e) => toggleSection(sectionId, (e.target as HTMLDetailsElement).open)}
                        className="group bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
                      >
                        <summary className="text-lg font-semibold text-slate-800 dark:text-slate-200 cursor-pointer list-none flex items-center justify-between outline-none">
                          <span>{materia} <Badge variant="secondary" className="ml-2 font-normal">{materiaTopics.length}</Badge></span>
                          <div className="text-slate-400 group-open:rotate-180 transition-transform duration-200">
                            <ArrowDown className="h-5 w-5" />
                          </div>
                        </summary>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                          {materiaTopics.map(topic => {
                            const topicTasks = tasks.filter(t => t.topicId === topic.id);
                            const completed = topicTasks.filter(t => t.status === 'completed').length;
                            const progress = topicTasks.length > 0 ? Math.round((completed / topicTasks.length) * 100) : 0;

                            return (
                              <Card 
                                key={topic.id} 
                                className="relative overflow-hidden cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
                                onClick={() => {
                                  setSelectedTopicId(topic.id);
                                  setIsTopicDetailsModalOpen(true);
                                }}
                              >
                                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800">
                                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                                </div>
                                <CardHeader className="pb-2 pt-5">
                                  <div className="flex justify-between items-start">
                                    <div className="flex gap-2">
                                      <Badge variant="outline" className="mb-2 bg-white dark:bg-slate-900">{topic.curso}</Badge>
                                      {topic.week && (
                                        <Badge variant="outline" className={`mb-2 font-bold ${getWeekBadgeClass(topic.week)}`}>
                                          S{topic.week}
                                        </Badge>
                                      )}
                                    </div>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteTopic(topic.id);
                                      }} 
                                      className="text-slate-400 hover:text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <CardTitle className="text-lg leading-tight">{topic.tema}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex items-center justify-between text-sm text-slate-500 mt-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{progress}% completado</span>
                                    <span>{completed}/{topicTasks.length} tareas</span>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderExamenes = () => {
    const sortedExams = [...exams].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Exámenes</h2>
          <Button onClick={() => setIsExamModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Examen
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedExams.map(exam => {
            const daysLeft = differenceInDays(parseISO(exam.date), startOfDay(new Date()));
            const isPast = daysLeft < 0;

            return (
              <Card key={exam.id} className={isPast ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant={exam.type === 'General' ? 'destructive' : exam.type === 'Ranking' ? 'default' : 'secondary'}>
                      {exam.type}
                    </Badge>
                    <button onClick={() => deleteExam(exam.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <CardTitle className="text-lg mt-2">{exam.title}</CardTitle>
                  <CardDescription>{exam.materia}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {format(parseISO(exam.date), "d MMM yyyy", { locale: es })}
                    </span>
                    <span className={`text-sm font-bold ${isPast ? 'text-slate-500 dark:text-slate-400' : daysLeft <= 3 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {isPast ? 'Finalizado' : daysLeft === 0 ? '¡Hoy!' : `Faltan ${daysLeft} días`}
                    </span>
                  </div>
                  {isPast && (
                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      {exam.score !== undefined ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Calificación:</span>
                          <Badge variant="default" className="text-sm px-2 py-0.5">{exam.score}</Badge>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500 dark:text-slate-400 italic">Sin calificar</span>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSelectedExamId(exam.id);
                          setExamScoreInput(exam.score || '');
                          setIsScoreModalOpen(true);
                        }}
                      >
                        {exam.score !== undefined ? 'Editar Nota' : 'Calificar'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {exams.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              No tienes exámenes programados.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEstadisticas = () => {
    const availableWeeks = Array.from(new Set(topics.map(t => t.week).filter(Boolean) as number[])).sort((a, b) => a - b);

    const filteredTopics = topics.filter(t => {
      if (selectedWeeks.length === 0) return true;
      return t.week && selectedWeeks.includes(t.week);
    });

    const topicsByCurso = filteredTopics.reduce((acc, topic) => {
      const curso = topic.curso || 'General';
      if (!acc[curso]) acc[curso] = {};
      if (!acc[curso][topic.materia]) acc[curso][topic.materia] = [];
      acc[curso][topic.materia].push(topic);
      return acc;
    }, {} as Record<string, Record<string, Topic[]>>);

    const parseMastery = (val?: string) => {
      if (!val) return 0;
      const clean = val.trim();
      if (clean.endsWith('%')) {
        const num = parseInt(clean.replace('%', ''));
        if (!isNaN(num)) return num / 100;
      }
      if (clean.includes('/')) {
        const parts = clean.split('/');
        const num = parseInt(parts[0]);
        const den = parseInt(parts[1]);
        if (!isNaN(num) && !isNaN(den) && den > 0) return num / den;
      }
      const num = parseInt(clean);
      if (!isNaN(num) && num <= 100) return num / 100;
      return 0;
    };

    const calculateTopicMastery = (topic: Topic, topicTasks: any[]) => {
      let score = 0;
      
      // 1. Tareas básicas (30%)
      const isCompleted = (type: string) => topicTasks.some(t => t.type === type && t.status === 'completed');
      if (isCompleted('Estudiar')) score += 10;
      if (isCompleted('Apunte')) score += 10;
      if (isCompleted('Flashcards') || isCompleted('Crear Flashcards')) score += 10;

      // 2. Repasos (30%)
      const completedRepasos = topicTasks.filter(t => t.type.startsWith('Repaso') && t.status === 'completed').length;
      score += Math.min(completedRepasos, 5) * 6; // up to 30%

      // 3. Dominio Flashcards & Práctica (40%)
      let flashScore = 0;
      let pracScore = 0;

      const legacyParts = topic.parts || [];
      const flashParts = topic.flashcardsParts || (legacyParts.length > 0 ? legacyParts.map(p => ({id: p.id, name: p.name, score: p.flashcardsMastery})) : []);
      const pracParts = topic.practicaParts || (legacyParts.length > 0 ? legacyParts.map(p => ({id: p.id, name: p.name, score: p.practicaMastery})) : []);

      if (flashParts.length > 0) {
        flashScore = flashParts.reduce((sum, p) => sum + parseMastery(p.score), 0) / flashParts.length;
      } else {
        flashScore = parseMastery(topic.flashcardsMastery);
      }

      if (pracParts.length > 0) {
        pracScore = pracParts.reduce((sum, p) => sum + parseMastery(p.score), 0) / pracParts.length;
      } else {
        pracScore = parseMastery(topic.practicaMastery);
      }

      score += (isNaN(flashScore) ? 0 : flashScore) * 20;
      score += (isNaN(pracScore) ? 0 : pracScore) * 20;

      return Math.min(Math.round(score), 100);
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Estadísticas por Materia</h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-9 flex items-center gap-2"
                onClick={() => setIsMateriaConfigModalOpen(true)}
              >
                <Target className="h-4 w-4" /> Configurar Tareas
              </Button>
              <span className="text-sm text-slate-500 dark:text-slate-400">Ordenar por:</span>
              <Select 
                value={statsSortOrder} 
                onChange={(e) => setStatsSortOrder(e.target.value as any)}
                className="w-48 text-sm"
              >
                <option value="creation_asc">Más antiguos primero</option>
                <option value="creation_desc">Más recientes primero</option>
                <option value="name_asc">Nombre (A-Z)</option>
                <option value="name_desc">Nombre (Z-A)</option>
                <option value="week_asc">Semana (Asc)</option>
                <option value="week_desc">Semana (Desc)</option>
                <option value="manual">Manual</option>
              </Select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filtrar por Semana:</span>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedWeeks.length === 0 ? "default" : "outline"}
                  size="sm"
                  className="text-[10px] h-7 px-3 rounded-full"
                  onClick={() => setSelectedWeeks([])}
                >
                  Todas
                </Button>
                {availableWeeks.map(w => (
                  <Button
                    key={w}
                    variant={selectedWeeks.includes(w) ? "default" : "outline"}
                    size="sm"
                    className={`text-[10px] h-7 px-3 rounded-full ${selectedWeeks.includes(w) ? getWeekBadgeClass(w) : ''}`}
                    onClick={() => {
                      setSelectedWeeks(prev => 
                        prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]
                      );
                    }}
                  >
                    Semana {w}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {Object.keys(topicsByCurso).length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No hay temas registrados para mostrar estadísticas.
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(topicsByCurso).map(([curso, materias]) => (
              <div key={curso} className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-emerald-500" />
                  {curso}
                </h3>

                <div className="space-y-4">
                  {Object.entries(materias).map(([materia, materiaTopics]) => {
                    const sectionId = `stats-${curso}-${materia}`;
                    const isOpen = expandedSections[sectionId] !== false;

                    const sortedTopics = [...materiaTopics].sort((a, b) => {
                      if (statsSortOrder === 'manual') return 0; // Keep original array order
                      if (statsSortOrder === 'name_asc') return a.tema.localeCompare(b.tema);
                      if (statsSortOrder === 'name_desc') return b.tema.localeCompare(a.tema);
                      if (statsSortOrder === 'week_asc') return (a.week || 999) - (b.week || 999);
                      if (statsSortOrder === 'week_desc') return (b.week || 0) - (a.week || 0);
                      if (statsSortOrder === 'creation_desc') return parseISO(b.dateAdded).getTime() - parseISO(a.dateAdded).getTime();
                      return parseISO(a.dateAdded).getTime() - parseISO(b.dateAdded).getTime();
                    });

                    return (
                      <details 
                        key={materia} 
                        open={isOpen} 
                        onToggle={(e) => toggleSection(sectionId, (e.target as HTMLDetailsElement).open)}
                        className="group bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
                      >
                        <summary className="text-lg font-semibold text-slate-800 dark:text-slate-200 cursor-pointer list-none flex items-center justify-between outline-none pb-2 border-b border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-4">
                            <span className="text-emerald-700 dark:text-emerald-400">{materia}</span>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 font-normal">
                              Dominio General: {materiaTopics.length > 0 
                                ? Math.round(materiaTopics.reduce((acc, topic) => {
                                    const topicTasks = tasks.filter(t => t.topicId === topic.id);
                                    return acc + calculateTopicMastery(topic, topicTasks);
                                  }, 0) / materiaTopics.length)
                                : 0}%
                            </Badge>
                          </div>
                          <div className="text-slate-400 group-open:rotate-180 transition-transform duration-200">
                            <ArrowDown className="h-5 w-5" />
                          </div>
                        </summary>
                        
                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400">
                              <tr>
                                {statsSortOrder === 'manual' && <th className="px-4 py-3 w-16 rounded-tl-lg">Orden</th>}
                                <th className={`px-4 py-3 ${statsSortOrder !== 'manual' ? 'rounded-tl-lg' : ''}`}>Tema</th>
                                <th className="px-4 py-3 w-32 text-center">Repasos</th>
                                <th className="px-4 py-3 w-40">Flashcards</th>
                                <th className="px-4 py-3 w-40">Práctica</th>
                                <th className="px-4 py-3 w-20 rounded-tr-lg">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                              {sortedTopics.map((topic, index) => {
                                const topicTasks = tasks.filter(t => t.topicId === topic.id);
                                const completedRepasos = topicTasks.filter(t => t.type.startsWith('Repaso') && t.status === 'completed').length;
                                const totalRepasos = completedRepasos + (topic.manualRepasos || 0);
                                const isDominado = totalRepasos >= 5;

                                const legacyParts = topic.parts || [];
                                const flashParts = topic.flashcardsParts || (legacyParts.length > 0 ? legacyParts.map(p => ({id: p.id, name: p.name, score: p.flashcardsMastery})) : []);
                                const pracParts = topic.practicaParts || (legacyParts.length > 0 ? legacyParts.map(p => ({id: p.id, name: p.name, score: p.practicaMastery})) : []);

                                let flashAverage = 0;
                                if (flashParts.length > 0) {
                                  flashAverage = Math.round((flashParts.reduce((sum, p) => sum + parseMastery(p.score), 0) / flashParts.length) * 100);
                                }

                                let pracAverage = 0;
                                if (pracParts.length > 0) {
                                  pracAverage = Math.round((pracParts.reduce((sum, p) => sum + parseMastery(p.score), 0) / pracParts.length) * 100);
                                }

                                return (
                                <tr key={topic.id} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${topic.week ? (topic.week % 2 === 0 ? 'bg-slate-50/50 dark:bg-slate-800/10' : 'bg-white dark:bg-slate-900') : ''}`}>
                                  {statsSortOrder === 'manual' && (
                                    <td className="px-4 py-3">
                                      <div className="flex flex-col gap-1">
                                        <button 
                                          onClick={() => reorderTopic(topic.id, 'up')}
                                          disabled={index === 0}
                                          className="text-slate-400 hover:text-emerald-500 disabled:opacity-30 disabled:hover:text-slate-400"
                                        >
                                          <ArrowUp className="h-3 w-3" />
                                        </button>
                                        <button 
                                          onClick={() => reorderTopic(topic.id, 'down')}
                                          disabled={index === sortedTopics.length - 1}
                                          className="text-slate-400 hover:text-emerald-500 disabled:opacity-30 disabled:hover:text-slate-400"
                                        >
                                          <ArrowDown className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                  <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-slate-900 dark:text-slate-100">{topic.tema}</span>
                                      {topic.week && (
                                        <div className="flex mt-1">
                                          <Badge variant="outline" className={`text-[10px] h-4 py-0 font-bold ${getWeekBadgeClass(topic.week)}`}>
                                            Semana {topic.week}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {isDominado ? (
                                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                                        <Star className="h-3 w-3 mr-1 inline" /> Dominado
                                      </Badge>
                                    ) : (
                                      <div className="flex items-center justify-center gap-2">
                                        <span className="text-slate-600 dark:text-slate-400 font-medium">{totalRepasos} / 5</span>
                                        <button 
                                          onClick={() => incrementManualRepaso(topic.id)}
                                          className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60 flex items-center justify-center"
                                          title="Añadir repaso manual"
                                        >
                                          +
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {flashParts.length > 0 ? (
                                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block text-center bg-emerald-50 dark:bg-emerald-900/20 py-1.5 rounded-md border border-emerald-100 dark:border-emerald-800">
                                        Prom. {flashAverage}%
                                      </span>
                                    ) : (
                                      <Input 
                                        className="h-8 text-xs bg-slate-50 dark:bg-slate-950" 
                                        placeholder="Ej. 80% o 4/5" 
                                        defaultValue={topic.flashcardsMastery || ''}
                                        onBlur={(e) => updateTopicMastery(topic.id, e.target.value, topic.practicaMastery || '')}
                                      />
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {pracParts.length > 0 ? (
                                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block text-center bg-emerald-50 dark:bg-emerald-900/20 py-1.5 rounded-md border border-emerald-100 dark:border-emerald-800">
                                        Prom. {pracAverage}%
                                      </span>
                                    ) : (
                                      <Input 
                                        className="h-8 text-xs bg-slate-50 dark:bg-slate-950" 
                                        placeholder="Ej. 80% o 4/5" 
                                        defaultValue={topic.practicaMastery || ''}
                                        onBlur={(e) => updateTopicMastery(topic.id, topic.flashcardsMastery || '', e.target.value)}
                                      />
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-xs h-8 px-2 text-indigo-600 dark:text-indigo-400"
                                      onClick={() => {
                                        setSelectedTopicId(topic.id);
                                        setIsTopicDetailsModalOpen(true);
                                      }}
                                    >
                                      Dividir/Partes
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderHorario = () => {
    const days: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Horario Semanal</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Agrega tus cursos al horario. Las tareas se priorizarán automáticamente según la cercanía de la próxima clase.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {days.map(day => {
            const dayEntries = schedule.filter(s => s.day === day);
            return (
              <Card key={day} className="flex flex-col h-full">
                <CardHeader className="pb-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-base font-semibold text-slate-700 dark:text-slate-200">{day}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col gap-2">
                  {dayEntries.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-md">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{entry.materia}</span>
                      <button onClick={() => deleteScheduleEntry(entry.id)} className="text-slate-400 hover:text-red-500 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {dayEntries.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-2">Sin clases</p>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-auto w-full border-dashed"
                    onClick={() => {
                      setNewScheduleEntry({ ...newScheduleEntry, day });
                      setIsScheduleModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Agregar Materia
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderHabitos = () => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return format(d, 'yyyy-MM-dd');
    }).reverse();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Hábitos</h2>
          <Button onClick={() => setIsHabitModalOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Hábito
          </Button>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg w-1/3">Hábito</th>
                  {last7Days.map(date => (
                    <th key={date} className="px-2 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">{format(parseISO(date), 'EEE', { locale: es })}</span>
                        <span>{format(parseISO(date), 'd')}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 rounded-tr-lg w-16"></th>
                </tr>
              </thead>
              <tbody>
                {habits.map(habit => (
                  <tr key={habit.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{habit.name}</div>
                      <div className="flex gap-1 mt-1">
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((letter, i) => {
                          const days: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                          const isSelected = habit.selectedDays.includes(days[i]);
                          return (
                            <span 
                              key={i} 
                              className={`text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold ${
                                isSelected 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50' 
                                  : 'text-slate-300 dark:text-slate-700 border border-transparent'
                              }`}
                              title={days[i]}
                            >
                              {letter}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    {last7Days.map(date => {
                      const isCompleted = habit.completedDates.includes(date);
                      const dayName = format(parseISO(date), 'EEEE', { locale: es });
                      const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                      const isScheduledDay = habit.selectedDays.includes(capitalizedDay as DayOfWeek);
                      
                      return (
                        <td key={date} className={`px-2 py-3 text-center transition-colors ${isScheduledDay ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>
                          <button
                            onClick={() => toggleHabit(habit.id, date)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                              isCompleted 
                                ? 'bg-emerald-500 text-white shadow-sm scale-110' 
                                : isScheduledDay
                                  ? 'bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-800 text-emerald-200 dark:text-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600'
                                  : 'bg-slate-50 dark:bg-slate-800/50 text-slate-200 dark:text-slate-700 hover:text-slate-300 dark:hover:text-slate-600'
                            }`}
                            title={isScheduledDay ? 'Programado para hoy' : 'No programado'}
                          >
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isScheduledDay ? <Circle className="w-3 h-3" /> : <Circle className="w-3 h-3 opacity-20" />}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteHabit(habit.id)} className="text-slate-400 hover:text-red-500 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {habits.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 italic">
                      No hay hábitos registrados. ¡Agrega uno para empezar a hacer seguimiento!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTutores = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Tutores</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Agrega enlaces de imágenes para personalizar tu tutor diario.</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Añadir nuevo tutor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="URL de la imagen (ej. https://...)"
                value={newTutorUrl}
                onChange={e => setNewTutorUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => {
                if (newTutorUrl.trim()) {
                  setTutors([...tutors, newTutorUrl.trim()]);
                  setNewTutorUrl('');
                }
              }}>Añadir</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {tutors.map((url, idx) => (
            <Card key={idx} className="overflow-hidden relative group border-slate-200 dark:border-slate-800">
              <img src={url} alt={`Tutor ${idx + 1}`} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="destructive" size="sm" className="h-8 w-8 p-0" onClick={() => setTutors(tutors.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 text-center font-medium">
                Tutor {idx + 1}
              </div>
            </Card>
          ))}
          {tutors.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              No tienes tutores configurados. ¡Añade algunas imágenes!
            </div>
          )}
        </div>
      </div>
    );
  };

  const todayDate = new Date();
  // Use the local date string to ensure it changes exactly at midnight local time
  const dateString = format(todayDate, 'yyyy-MM-dd');
  // Create a simple hash from the date string to use as an index
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = dateString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const tutorIndex = Math.abs(hash) % (tutors.length || 1);
  const currentTutorImage = tutors.length > 0 ? tutors[tutorIndex] : "https://via.placeholder.com/150?text=Sin+Tutor";

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const completedTasksToday = tasks.filter(t => t.status === 'completed' && t.completedAt && isToday(parseISO(t.completedAt))).length;
  const completedHabitsToday = habits.filter(h => h.completedDates.includes(todayStr)).length;
  const totalCompletedToday = completedTasksToday + completedHabitsToday;

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 h-full overflow-y-auto">
        <div className="p-6 flex-shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-emerald-600" />
            CasaniPlanner
          </h1>
        </div>

        <div className="px-4 pb-4 flex-shrink-0">
          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm relative">
            <img src={currentTutorImage} alt="Tutor del día" className="w-full h-auto object-contain" referrerPolicy="no-referrer" />
            
            <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {totalCompletedToday} hoy
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-2 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
              Tu tutor del día
            </div>
            
            {/* Animation overlay */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
              <AnimatePresence>
                {animations.map(id => (
                  <motion.div key={id} className="absolute inset-0">
                    {[...Array(6)].map((_, i) => {
                      const colors = ['text-red-500', 'text-pink-400', 'text-rose-500', 'text-fuchsia-400', 'text-red-400', 'text-pink-500'];
                      const xDrift = (i % 2 === 0 ? 1 : -1) * (15 + i * 5);
                      const yEnd = -150 - (i * 20);
                      const delay = i * 0.15;
                      
                      return (
                        <motion.div
                          key={i}
                          initial={{ y: 0, x: 0, scale: 0, opacity: 0 }}
                          animate={{ 
                            y: [0, yEnd], 
                            x: [0, xDrift, -xDrift * 0.5, xDrift * 0.2], 
                            scale: [0, 1.2, 1, 0.8], 
                            opacity: [0, 1, 0.8, 0] 
                          }}
                          transition={{ duration: 2, delay, ease: "easeOut" }}
                          className={`absolute bottom-8 right-6 ${colors[i]}`}
                        >
                          <Heart className="w-6 h-6" fill="currentColor" />
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <nav className="px-4 pb-6 space-y-1 flex-1">
          <button
            onClick={() => setCurrentView('agenda')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'agenda' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="h-4 w-4" /> Agenda
          </button>
          <button
            onClick={() => setCurrentView('temas')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'temas' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="h-4 w-4" /> Temas
          </button>
          <button
            onClick={() => setCurrentView('examenes')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'examenes' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="h-4 w-4" /> Exámenes
          </button>
          <button
            onClick={() => setCurrentView('estadisticas')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'estadisticas' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart2 className="h-4 w-4" /> Estadísticas
          </button>
          <button
            onClick={() => setCurrentView('horario')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'horario' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarDays className="h-4 w-4" /> Horario
          </button>
          <button
            onClick={() => setCurrentView('habitos')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'habitos' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="h-4 w-4" /> Hábitos
          </button>
          <button
            onClick={() => setCurrentView('tutores')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'tutores' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="h-4 w-4" /> Tutores
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Exportar Datos
            </Button>
            <div className="relative">
              <label className="flex items-center w-full justify-start px-3 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors text-slate-900 dark:text-slate-100">
                <Upload className="mr-2 h-4 w-4" /> Importar Datos
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          {currentView === 'agenda' && renderAgenda()}
          {currentView === 'temas' && renderTemas()}
          {currentView === 'examenes' && renderExamenes()}
          {currentView === 'estadisticas' && renderEstadisticas()}
          {currentView === 'horario' && renderHorario()}
          {currentView === 'habitos' && renderHabitos()}
          {currentView === 'tutores' && renderTutores()}
        </div>
      </main>

      {/* Habit Modal */}
      <Modal isOpen={isHabitModalOpen} onClose={() => setIsHabitModalOpen(false)} title="Agregar Nuevo Hábito">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!newHabit.name.trim() || newHabit.selectedDays.length === 0) return;
          addHabit(newHabit.name, newHabit.selectedDays);
          setIsHabitModalOpen(false);
          setNewHabit({ name: '', selectedDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] });
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Hábito</label>
            <Input 
              value={newHabit.name} 
              onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
              placeholder="Ej. Leer 30 min, Hacer ejercicio..."
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Días de la semana</label>
            <div className="flex flex-wrap gap-2">
              {(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as DayOfWeek[]).map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const days = newHabit.selectedDays.includes(day)
                      ? newHabit.selectedDays.filter(d => d !== day)
                      : [...newHabit.selectedDays, day];
                    setNewHabit({ ...newHabit, selectedDays: days });
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    newHabit.selectedDays.includes(day)
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {day.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsHabitModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={newHabit.selectedDays.length === 0}>Agregar</Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Modal */}
      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title={`Agregar a ${newScheduleEntry.day}`}>
        <form onSubmit={(e) => {
          e.preventDefault();
          addScheduleEntry(newScheduleEntry.day, newScheduleEntry.materia);
          setIsScheduleModalOpen(false);
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Materia</label>
            <Select 
              value={newScheduleEntry.materia} 
              onChange={(e) => setNewScheduleEntry({ ...newScheduleEntry, materia: e.target.value as Materia })}
            >
              {Object.values(CURSOS_MATERIAS).flat().map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsScheduleModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </Modal>

      {/* Add Topic Modal */}
      <Modal isOpen={isTopicModalOpen} onClose={() => setIsTopicModalOpen(false)} title="Agregar Nuevo Tema">
        <form onSubmit={handleAddTopic} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Curso</label>
            <Select 
              value={newTopic.curso} 
              onChange={(e) => {
                const curso = e.target.value as Curso;
                setNewTopic({ ...newTopic, curso, materia: CURSOS_MATERIAS[curso][0] });
              }}
            >
              {Object.keys(CURSOS_MATERIAS).map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Materia</label>
            <Select 
              value={newTopic.materia} 
              onChange={(e) => setNewTopic({ ...newTopic, materia: e.target.value as Materia })}
            >
              {CURSOS_MATERIAS[newTopic.curso].map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tema</label>
            <Input 
              required
              placeholder="Ej. Movimiento Rectilíneo Uniforme" 
              value={newTopic.tema}
              onChange={(e) => setNewTopic({ ...newTopic, tema: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Semana</label>
            <Select 
              value={newTopic.week?.toString()} 
              onChange={(e) => setNewTopic({ ...newTopic, week: parseInt(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(w => (
                <option key={w} value={w}>Semana {w}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Clase</label>
            <Input 
              type="date" 
              required
              value={newTopic.dateAdded}
              onChange={(e) => setNewTopic({ ...newTopic, dateAdded: e.target.value })}
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsTopicModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Tema</Button>
          </div>
        </form>
      </Modal>

      {/* Add Exam Modal */}
      <Modal isOpen={isExamModalOpen} onClose={() => setIsExamModalOpen(false)} title="Programar Examen">
        <form onSubmit={handleAddExam} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título del Examen</label>
            <Input 
              required
              placeholder="Ej. Simulacro UNMSM" 
              value={newExam.title}
              onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
            <Select 
              value={newExam.type} 
              onChange={(e) => setNewExam({ ...newExam, type: e.target.value as ExamType })}
            >
              <option value="Práctica">Práctica</option>
              <option value="Ranking">Ranking</option>
              <option value="General">General</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Materia (Opcional)</label>
            <Select 
              value={newExam.materia} 
              onChange={(e) => setNewExam({ ...newExam, materia: e.target.value as any })}
            >
              <option value="Todas">Todas las materias</option>
              {Object.values(CURSOS_MATERIAS).flat().map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha del Examen</label>
            <Input 
              type="date" 
              required
              value={newExam.date}
              onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsExamModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Examen</Button>
          </div>
        </form>
      </Modal>

      {/* Score Modal */}
      <Modal isOpen={isScoreModalOpen} onClose={() => setIsScoreModalOpen(false)} title="Calificar Examen">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (selectedExamId && examScoreInput) {
            updateExamScore(selectedExamId, examScoreInput);
            setIsScoreModalOpen(false);
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nota / Puntaje</label>
            <Input 
              type="text" 
              required
              placeholder="Ej. 15, 100, 85.5, 30/100" 
              value={examScoreInput}
              onChange={(e) => setExamScoreInput(e.target.value)}
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsScoreModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Nota</Button>
          </div>
        </form>
      </Modal>

      {/* General Task Modal */}
      <Modal isOpen={isGeneralTaskModalOpen} onClose={() => setIsGeneralTaskModalOpen(false)} title="Agregar Tarea General">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (newGeneralTask.title) {
            addGeneralTask(newGeneralTask.title, newGeneralTask.date);
            setNewGeneralTask({ title: '', date: format(new Date(), 'yyyy-MM-dd') });
            setIsGeneralTaskModalOpen(false);
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tarea</label>
            <Input 
              required
              placeholder="Ej. Alistar mochila, regar plantas..." 
              value={newGeneralTask.title}
              onChange={(e) => setNewGeneralTask({ ...newGeneralTask, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha</label>
            <Input 
              type="date" 
              required
              value={newGeneralTask.date}
              onChange={(e) => setNewGeneralTask({ ...newGeneralTask, date: e.target.value })}
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsGeneralTaskModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Tarea</Button>
          </div>
        </form>
      </Modal>

      {/* Materia Config Modal */}
      <Modal isOpen={isMateriaConfigModalOpen} onClose={() => setIsMateriaConfigModalOpen(false)} title="Configurar Tareas por Materia">
        <div className="space-y-6">
          <p className="text-sm text-slate-500">
            Personaliza qué tareas se generan automáticamente para cada materia al añadir un tema.
          </p>
          
          <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {Object.entries(CURSOS_MATERIAS).map(([curso, materias]) => (
              <div key={curso} className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-white dark:bg-slate-950 py-1 z-10">{curso}</h3>
                <div className="grid gap-3">
                  {materias.map(materia => {
                    const currentConfig = materiaConfigs[materia] || (['Ciencias', 'Razonamiento', 'Matemática'].includes(curso) ? ['Estudiar', 'Apunte', 'Crear Flashcards', 'Subir práctica', 'Repasos', 'Práctica'] : ['Estudiar', 'Crear Flashcards', 'Subir práctica', 'Repasos', 'Práctica']);
                    const taskOptions = ['Estudiar', 'Apunte', 'Resumen', 'Esquema', 'Crear Flashcards', 'Lectura Prep.', 'Video/Clase', 'Cuestionario', 'Simulacro', 'Subir práctica', 'Vocabulario', 'Repasos', 'Práctica'];
                    
                    return (
                      <div key={materia} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{materia}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {taskOptions.map(task => {
                            const isChecked = currentConfig.includes(task);
                            return (
                              <label key={task} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition-all border ${isChecked ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                                <input 
                                  type="checkbox" 
                                  className="hidden" 
                                  checked={isChecked}
                                  onChange={() => {
                                    const next = isChecked 
                                      ? currentConfig.filter(t => t !== task)
                                      : [...currentConfig, task];
                                    updateMateriaConfig(materia, next);
                                  }}
                                />
                                {isChecked && <CheckCircle2 className="w-3 h-3" />}
                                {task}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-2 flex justify-end">
            <Button onClick={() => setIsMateriaConfigModalOpen(false)}>Listo</Button>
          </div>
        </div>
      </Modal>

      {/* Topic Details Modal */}
      {(() => {
        const topic = topics.find(t => t.id === selectedTopicId);
        if (!topic) return null;

        const topicTasks = tasks.filter(t => t.topicId === topic.id);
        const pendingTasks = topicTasks.filter(t => t.status === 'pending').sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
        const completedTasks = topicTasks.filter(t => t.status === 'completed').sort((a, b) => parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime());

        return (
          <Modal isOpen={isTopicDetailsModalOpen} onClose={() => setIsTopicDetailsModalOpen(false)} title="Detalles del Tema">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{topic.tema}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">{topic.curso}</Badge>
                  <Badge variant="outline">{topic.materia}</Badge>
                  {topic.week && (
                    <Badge variant="outline" className={getWeekBadgeClass(topic.week)}>
                      Semana {topic.week}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Topic Parts Manager */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Star className="h-4 w-4 text-emerald-500" /> Partes del Tema
                </h4>
                <p className="text-xs text-slate-500">Divide el tema en bloques según requieras para flashcards y práctica.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Flashcards */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300">Flashcards</h5>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (newFlashcardPartName.trim()) {
                        addTopicPart(topic.id, 'flashcards', newFlashcardPartName);
                        setNewFlashcardPartName('');
                      }
                    }} className="flex gap-2">
                      <Input 
                        placeholder="Nueva parte..." 
                        value={newFlashcardPartName}
                        onChange={(e) => setNewFlashcardPartName(e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                      <Button type="submit" size="sm" className="h-8 px-2">+</Button>
                    </form>

                    <div className="space-y-2">
                      {(topic.flashcardsParts || []).map(part => (
                        <div key={part.id} className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-2 relative pr-7">
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex-1 truncate" title={part.name}>{part.name}</span>
                          <Input 
                            className="h-6 w-16 text-[10px] bg-white dark:bg-slate-900 px-1 text-center" 
                            placeholder="Ej. 80%" 
                            defaultValue={part.score || ''}
                            onBlur={(e) => updateTopicPartMastery(topic.id, 'flashcards', part.id, e.target.value)}
                          />
                          <button 
                            onClick={() => removeTopicPart(topic.id, 'flashcards', part.id)}
                            className="absolute right-2 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Práctica */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300">Práctica</h5>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (newPracticaPartName.trim()) {
                        addTopicPart(topic.id, 'practica', newPracticaPartName);
                        setNewPracticaPartName('');
                      }
                    }} className="flex gap-2">
                      <Input 
                        placeholder="Nueva parte..." 
                        value={newPracticaPartName}
                        onChange={(e) => setNewPracticaPartName(e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                      <Button type="submit" size="sm" className="h-8 px-2">+</Button>
                    </form>

                    <div className="space-y-2">
                      {(topic.practicaParts || []).map(part => (
                        <div key={part.id} className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-2 relative pr-7">
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex-1 truncate" title={part.name}>{part.name}</span>
                          <Input 
                            className="h-6 w-16 text-[10px] bg-white dark:bg-slate-900 px-1 text-center" 
                            placeholder="Ej. 4/5" 
                            defaultValue={part.score || ''}
                            onBlur={(e) => updateTopicPartMastery(topic.id, 'practica', part.id, e.target.value)}
                          />
                          <button 
                            onClick={() => removeTopicPart(topic.id, 'practica', part.id)}
                            className="absolute right-2 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Legacy cleanup if needed */}
                {topic.parts && topic.parts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">Partes antiguas (por favor transfiérelas arriba):</p>
                    <div className="space-y-2 text-xs opacity-70">
                      {topic.parts.map(p => (
                        <div key={p.id} className="flex flex-col gap-1 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          <span className="font-semibold">{p.name}</span>
                          <span>F: {p.flashcardsMastery || '0'} | P: {p.practicaMastery || '0'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Add Subtask */}
              <form onSubmit={(e) => {
                e.preventDefault();
                if (newSubtask.title) {
                  addCustomTask(topic.id, newSubtask.title, newSubtask.date);
                  setNewSubtask({ title: '', date: format(new Date(), 'yyyy-MM-dd') });
                }
              }} className="flex gap-2 items-end bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nueva Subtarea</label>
                  <Input 
                    required
                    placeholder="Ej. Ver video explicativo" 
                    value={newSubtask.title}
                    onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Fecha</label>
                  <Input 
                    type="date" 
                    required
                    value={newSubtask.date}
                    onChange={(e) => setNewSubtask({ ...newSubtask, date: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <Button type="submit" size="sm" className="h-8"><Plus className="h-4 w-4" /></Button>
              </form>

              {/* Tasks List */}
              <div className="space-y-4">
                {pendingTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" /> Pendientes
                    </h4>
                    <div className="space-y-2">
                      {pendingTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-md">
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleToggleTask(task.id)} className="text-slate-300 dark:text-slate-600 hover:text-emerald-500">
                              <Circle className="h-5 w-5" />
                            </button>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{task.type}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{format(parseISO(task.dueDate), "d MMM yyyy", { locale: es })}</p>
                            </div>
                          </div>
                          <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-red-500 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {completedTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Completadas
                    </h4>
                    <div className="space-y-2">
                      {completedTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-2 rounded-md opacity-70">
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleToggleTask(task.id)} className="text-emerald-500">
                              <CheckCircle2 className="h-5 w-5" />
                            </button>
                            <div>
                              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-through">{task.type}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">{format(parseISO(task.dueDate), "d MMM yyyy", { locale: es })}</p>
                            </div>
                          </div>
                          <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-red-500 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {topicTasks.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No hay tareas para este tema.</p>
                )}
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
