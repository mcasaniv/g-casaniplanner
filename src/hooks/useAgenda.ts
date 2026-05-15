import { useState, useEffect } from 'react';
import { Topic, Task, Exam, TaskType, ScheduleEntry, DayOfWeek, Habit, HabitFrequency, MateriaConfig, Materia } from '../types';
import { TASK_SCHEDULE } from '../constants';
import { addDays, parseISO, format } from 'date-fns';

export function useAgenda() {
  const [topics, setTopics] = useState<Topic[]>(() => {
    const saved = localStorage.getItem('agenda_topics');
    return saved ? JSON.parse(saved) : [];
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('agenda_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('agenda_exams');
    return saved ? JSON.parse(saved) : [];
  });
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(() => {
    const saved = localStorage.getItem('agenda_schedule');
    return saved ? JSON.parse(saved) : [];
  });
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('agenda_habits');
    return saved ? JSON.parse(saved) : [];
  });
  const [materiaConfigs, setMateriaConfigs] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('agenda_materia_configs');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('agenda_topics', JSON.stringify(topics));
    localStorage.setItem('agenda_tasks', JSON.stringify(tasks));
    localStorage.setItem('agenda_exams', JSON.stringify(exams));
    localStorage.setItem('agenda_schedule', JSON.stringify(schedule));
    localStorage.setItem('agenda_habits', JSON.stringify(habits));
    localStorage.setItem('agenda_materia_configs', JSON.stringify(materiaConfigs));
  }, [topics, tasks, exams, schedule, habits, materiaConfigs]);

  // Migración para temas antiguos que no tienen semana
  useEffect(() => {
    const topicsWithoutWeek = topics.filter(t => t.week === undefined);
    if (topicsWithoutWeek.length > 0) {
      // Intentamos agrupar por semanas basadas en la fecha de creación del primer tema
      const allDates = topics.map(t => parseISO(t.dateAdded).getTime());
      if (allDates.length === 0) return;
      
      const firstDateRecord = Math.min(...allDates);
      const startOfCycle = new Date(firstDateRecord);
      // Ajustamos al inicio de esa semana (lunes) para que sea más coherente
      const dayOffset = (startOfCycle.getUTCDay() + 6) % 7; // 0 para lunes, 6 para domingo
      const mondayOfFirstWeek = new Date(startOfCycle);
      mondayOfFirstWeek.setUTCDate(startOfCycle.getUTCDate() - dayOffset);
      mondayOfFirstWeek.setUTCHours(0,0,0,0);

      setTopics(prev => prev.map(t => {
        if (t.week !== undefined) return t;
        const topicDate = parseISO(t.dateAdded);
        const diffInMs = topicDate.getTime() - mondayOfFirstWeek.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const week = Math.max(1, Math.floor(diffInDays / 7) + 1);
        return { ...t, week };
      }));
    }
  }, [topics]);

  const addTopic = (topic: Omit<Topic, 'id'>) => {
    const newTopic: Topic = { ...topic, id: crypto.randomUUID(), manualRepasos: 0, parts: [] };
    setTopics(prev => [...prev, newTopic]);

    const baseDate = parseISO(topic.dateAdded);
    const newTasks: Task[] = [];
    
    const addTask = (type: string, date: Date) => {
      newTasks.push({
        id: crypto.randomUUID(),
        topicId: newTopic.id,
        type: type,
        status: 'pending',
        dueDate: date.toISOString()
      });
    };

    const isHighPriority = ['Ciencias', 'Razonamiento', 'Matemática'].includes(topic.curso);
    const config = materiaConfigs[topic.materia];

    if (config) {
      if (config.includes('Estudiar')) addTask('Estudiar', baseDate);
      if (config.includes('Apunte')) addTask('Apunte', baseDate);
      if (config.includes('Crear Flashcards')) addTask('Crear Flashcards', baseDate);
      if (config.includes('Subir práctica')) addTask('Subir práctica', baseDate);
      if (config.includes('Vocabulario')) addTask('Vocabulario', baseDate);
      if (config.includes('Resumen')) addTask('Resumen', baseDate);
      if (config.includes('Esquema')) addTask('Esquema', baseDate);
      if (config.includes('Lectura Prep.')) addTask('Lectura Prep.', baseDate);
      if (config.includes('Video/Clase')) addTask('Video/Clase', baseDate);
      if (config.includes('Cuestionario')) addTask('Cuestionario', baseDate);
      if (config.includes('Simulacro')) addTask('Simulacro', baseDate);
    } else {
      if (isHighPriority) {
        addTask('Estudiar', baseDate);
        addTask('Apunte', baseDate);
        addTask('Crear Flashcards', baseDate);
        addTask('Subir práctica', baseDate);
      } else {
        addTask('Estudiar', baseDate);
        addTask('Crear Flashcards', baseDate);
        addTask('Subir práctica', baseDate);
      }
    }
    
    // Repasos y Prácticas dependientes de config
    const hasRepasos = !config || config.includes('Repasos');
    const hasPracticas = !config || config.includes('Práctica');

    if (hasRepasos) {
      addTask('Repaso 1', addDays(baseDate, 1));
      addTask('Repaso 2', addDays(baseDate, 4));
      
      let domingo = addDays(baseDate, 7 - baseDate.getDay());
      if (domingo <= addDays(baseDate, 4)) {
        domingo = addDays(domingo, 7);
      }
      addTask('Repaso 3', domingo);
      
      const repaso4Date = addDays(domingo, 7);
      addTask('Repaso 4', repaso4Date);
      
      const repaso5Date = addDays(repaso4Date, 7);
      addTask('Repaso 5', repaso5Date);
    }

    if (hasPracticas) {
      addTask('Práctica 1', addDays(baseDate, 1));
      addTask('Práctica 2', addDays(baseDate, 14));
    }

    setTasks(prev => [...prev, ...newTasks]);
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (task && !task.topicId && task.status === 'pending') {
        // Tarea general completada -> se elimina definitivamente
        return prev.filter(t => t.id !== taskId);
      }
      return prev.map(t => {
        if (t.id === taskId) {
          const isCompleting = t.status === 'pending';
          return { 
            ...t, 
            status: isCompleting ? 'completed' : 'pending',
            completedAt: isCompleting ? new Date().toISOString() : undefined
          };
        }
        return t;
      });
    });
  };

  const addCustomTask = (topicId: string, type: string, dueDate: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      topicId,
      type,
      status: 'pending',
      dueDate
    };
    setTasks(prev => [...prev, newTask]);
  };

  const addGeneralTask = (type: string, dueDate: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      type,
      status: 'pending',
      dueDate
    };
    setTasks(prev => [...prev, newTask]);
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const addExam = (exam: Omit<Exam, 'id'>) => {
    setExams(prev => [...prev, { ...exam, id: crypto.randomUUID() }]);
  };

  const deleteTopic = (topicId: string) => {
    setTopics(prev => prev.filter(t => t.id !== topicId));
    setTasks(prev => prev.filter(t => t.topicId !== topicId));
  };

  const deleteExam = (examId: string) => {
    setExams(prev => prev.filter(e => e.id !== examId));
  };

  const updateExamScore = (examId: string, score: string) => {
    setExams(prev => prev.map(e => e.id === examId ? { ...e, score } : e));
  };

  const updateTopicMastery = (topicId: string, flashcardsMastery: string, practicaMastery: string) => {
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, flashcardsMastery, practicaMastery } : t));
  };

  const updateTopicPartMastery = (topicId: string, type: 'flashcards' | 'practica', partId: string, score: string) => {
    setTopics(prev => prev.map(t => {
      if (t.id === topicId) {
        if (type === 'flashcards') {
          const newParts = (t.flashcardsParts || []).map(p => p.id === partId ? { ...p, score } : p);
          return { ...t, flashcardsParts: newParts };
        } else {
          const newParts = (t.practicaParts || []).map(p => p.id === partId ? { ...p, score } : p);
          return { ...t, practicaParts: newParts };
        }
      }
      return t;
    }));
  };

  const addTopicPart = (topicId: string, type: 'flashcards' | 'practica', partName: string) => {
    setTopics(prev => prev.map(t => {
      if (t.id === topicId) {
        if (type === 'flashcards') {
          return { ...t, flashcardsParts: [...(t.flashcardsParts || []), { id: crypto.randomUUID(), name: partName }] };
        } else {
          return { ...t, practicaParts: [...(t.practicaParts || []), { id: crypto.randomUUID(), name: partName }] };
        }
      }
      return t;
    }));
  };

  const removeTopicPart = (topicId: string, type: 'flashcards' | 'practica', partId: string) => {
    setTopics(prev => prev.map(t => {
      if (t.id === topicId) {
        if (type === 'flashcards') {
          return { ...t, flashcardsParts: (t.flashcardsParts || []).filter(p => p.id !== partId) };
        } else {
          return { ...t, practicaParts: (t.practicaParts || []).filter(p => p.id !== partId) };
        }
      }
      return t;
    }));
  };

  const incrementManualRepaso = (topicId: string) => {
    setTopics(prev => prev.map(t => {
      if (t.id === topicId) {
        return { ...t, manualRepasos: (t.manualRepasos || 0) + 1 };
      }
      return t;
    }));
  };

  const reorderTopic = (topicId: string, direction: 'up' | 'down') => {
    setTopics(prev => {
      const index = prev.findIndex(t => t.id === topicId);
      if (index < 0) return prev;
      const topic = prev[index];
      
      const sameMateriaTopics = prev.filter(t => t.materia === topic.materia);
      const sameMateriaIndex = sameMateriaTopics.findIndex(t => t.id === topicId);
      
      if (direction === 'up' && sameMateriaIndex > 0) {
        const swapTopic = sameMateriaTopics[sameMateriaIndex - 1];
        const swapIndex = prev.findIndex(t => t.id === swapTopic.id);
        const newTopics = [...prev];
        newTopics[index] = swapTopic;
        newTopics[swapIndex] = topic;
        return newTopics;
      } else if (direction === 'down' && sameMateriaIndex < sameMateriaTopics.length - 1) {
        const swapTopic = sameMateriaTopics[sameMateriaIndex + 1];
        const swapIndex = prev.findIndex(t => t.id === swapTopic.id);
        const newTopics = [...prev];
        newTopics[index] = swapTopic;
        newTopics[swapIndex] = topic;
        return newTopics;
      }
      return prev;
    });
  };

  const addScheduleEntry = (day: DayOfWeek, materia: any) => {
    setSchedule(prev => [...prev, { id: crypto.randomUUID(), day, materia }]);
  };

  const deleteScheduleEntry = (id: string) => {
    setSchedule(prev => prev.filter(s => s.id !== id));
  };

  const addHabit = (name: string, selectedDays: DayOfWeek[]) => {
    const startDate = format(new Date(), 'yyyy-MM-dd');
    setHabits(prev => [...prev, { id: crypto.randomUUID(), name, selectedDays, startDate, completedDates: [] }]);
  };

  const toggleHabit = (habitId: string, date: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const completed = h.completedDates.includes(date);
      return {
        ...h,
        completedDates: completed ? h.completedDates.filter(d => d !== date) : [...h.completedDates, date]
      };
    }));
  };

  const deleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
  };

  const importData = (importedTopics: Topic[], importedTasks: Task[], importedExams: Exam[], importedSchedule?: ScheduleEntry[], importedHabits?: Habit[], importedConfigs?: Record<string, string[]>) => {
    setTopics(importedTopics);
    setTasks(importedTasks);
    setExams(importedExams);
    if (importedSchedule) {
      setSchedule(importedSchedule);
    }
    if (importedHabits) {
      setHabits(importedHabits);
    }
    if (importedConfigs) {
      setMateriaConfigs(importedConfigs);
    }
  };

  const updateMateriaConfig = (materia: string, tasks: string[]) => {
    setMateriaConfigs(prev => ({ ...prev, [materia]: tasks }));
  };

  return { topics, tasks, exams, schedule, habits, materiaConfigs, addTopic, toggleTask, addExam, deleteTopic, deleteExam, importData, updateExamScore, updateTopicMastery, updateTopicPartMastery, addTopicPart, removeTopicPart, incrementManualRepaso, reorderTopic, addCustomTask, addGeneralTask, deleteTask, addScheduleEntry, deleteScheduleEntry, addHabit, toggleHabit, deleteHabit, updateMateriaConfig };
}
