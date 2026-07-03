import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ListTodo, 
  Bell, 
  Settings as SettingsIcon, 
  LogOut, 
  Search, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp, 
  Grid, 
  User as UserIcon,
  Filter, 
  Plus, 
  GripVertical, 
  Flag, 
  TrendingUp, 
  CheckCircle, 
  Edit2, 
  Trash2, 
  X,
  Info,
  Sliders,
  Check,
  AlertTriangle,
  Clock,
  Briefcase,
  Moon,
  Sun,
  RefreshCw,
  Lock,
  ArrowRight,
  Upload,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell, 
  Legend,
  PieChart,
  Pie
} from 'recharts';
import { Project, Milestone, TeamMember, Task, ProjectStatus } from './types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_MILESTONES, 
  INITIAL_MEMBERS, 
  INITIAL_TASKS, 
  THAI_MONTHS 
} from './data';

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const getMileDateParts = (dateStr: string) => {
  if (!dateStr) return { day: '', month: '' };
  const parts = dateStr.split('-');
  if (parts.length < 3) {
    // Legacy support: already in format like "15 พ.ค."
    const spaceParts = dateStr.split(' ');
    return { day: spaceParts[0] || '', month: spaceParts[1] || '' };
  }
  const day = parseInt(parts[2], 10).toString();
  const monthIdx = parseInt(parts[1], 10) - 1;
  const shortMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  return { day, month: shortMonths[monthIdx] || '' };
};

const getTeamColor = (teamName: string) => {
  const normalized = teamName.toLowerCase();
  if (normalized.includes('design') || normalized.includes('team a') || normalized.includes('ทีม a')) {
    return { color: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50' };
  }
  if (normalized.includes('development') || normalized.includes('team b') || normalized.includes('ทีม b') || normalized.includes('dev')) {
    return { color: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50' };
  }
  if (normalized.includes('marketing') || normalized.includes('team c') || normalized.includes('ทีม c')) {
    return { color: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-200', bg: 'bg-purple-50' };
  }
  if (normalized.includes('qa') || normalized.includes('test')) {
    return { color: 'bg-rose-500', text: 'text-rose-700', border: 'border-rose-200', bg: 'bg-rose-50' };
  }
  if (normalized.includes('support') || normalized.includes('service')) {
    return { color: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50' };
  }
  
  const colors = [
    { color: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50' },
    { color: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-200', bg: 'bg-indigo-50' },
    { color: 'bg-teal-500', text: 'text-teal-700', border: 'border-teal-200', bg: 'bg-teal-50' },
    { color: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-200', bg: 'bg-orange-50' },
    { color: 'bg-pink-500', text: 'text-pink-700', border: 'border-pink-200', bg: 'bg-pink-50' }
  ];
  let sum = 0;
  for (let i = 0; i < teamName.length; i++) {
    sum += teamName.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

export default function App() {
  // State for Projects, Milestones, Members, Tasks (loaded from localStorage if exists)
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('tasktracker_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    const saved = localStorage.getItem('tasktracker_milestones');
    return saved ? JSON.parse(saved) : INITIAL_MILESTONES;
  });

  const [members, setMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('tasktracker_members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [teamGroups, setTeamGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem('tasktracker_team_groups');
    return saved ? JSON.parse(saved) : [
      'Team A: UI/UX Design',
      'Team B: Development',
      'Team C: Marketing'
    ];
  });

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingGroupNameVal, setEditingGroupNameVal] = useState<string>('');
  const [newMemberAvatar, setNewMemberAvatar] = useState<string>('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasktracker_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  // Theme & UI state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('tasktracker_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('tasktracker_theme', theme);
  }, [theme]);

  const [selectedTab, setSelectedTab] = useState<'overview' | 'members' | 'tasks' | 'notifications' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeView, setTimeView] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('weekly');
  const [displayMode, setDisplayMode] = useState<'project' | 'team'>('team');
  const [selectedTeamTab, setSelectedTeamTab] = useState<'all' | 'team-a' | 'team-b' | 'team-c'>('all');
  
  // Month State
  const [currentMonthIndex, setCurrentMonthIndex] = useState(4); // พฤษภาคม (Index 4)
  const [currentYear, setCurrentYear] = useState(2024);
  const [isTimelineCalendarOpen, setIsTimelineCalendarOpen] = useState(false);
  const [calendarSubTab, setCalendarSubTab] = useState<'quick' | 'full'>('full');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'on-track' | 'at-risk' | 'delayed' | 'general'>('all');

  // Helper to get years present in data
  const getTimelineSelectOptions = () => {
    const yearsSet = new Set<number>([2023, 2024, 2025, 2026]);
    
    projects.forEach(p => {
      const start = p.startDate || getFallbackDateFromWeek(p.startWeek, 'start');
      const end = p.endDate || getFallbackDateFromWeek(p.endWeek, 'end');
      const sy = new Date(start).getFullYear();
      const ey = new Date(end).getFullYear();
      if (!isNaN(sy)) yearsSet.add(sy);
      if (!isNaN(ey)) yearsSet.add(ey);
    });

    tasks.forEach(t => {
      if (t.startDate) {
        const sy = new Date(t.startDate).getFullYear();
        if (!isNaN(sy)) yearsSet.add(sy);
      }
      if (t.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)) {
        const dy = new Date(t.dueDate).getFullYear();
        if (!isNaN(dy)) yearsSet.add(dy);
      }
    });

    milestones.forEach(m => {
      if (m.date && /^\d{4}-\d{2}-\d{2}$/.test(m.date)) {
        const my = new Date(m.date).getFullYear();
        if (!isNaN(my)) yearsSet.add(my);
      }
    });

    const years = Array.from(yearsSet).sort((a, b) => a - b);
    return { years };
  };

  // Helper to count tasks/projects active in a given year
  const getActivityCountForYear = (y: number) => {
    let count = 0;
    
    projects.forEach(p => {
      const startStr = p.startDate || getFallbackDateFromWeek(p.startWeek, 'start');
      const endStr = p.endDate || getFallbackDateFromWeek(p.endWeek, 'end');
      const startYear = new Date(startStr).getFullYear();
      const endYear = new Date(endStr).getFullYear();
      if (y >= startYear && y <= endYear) {
        count++;
      }
    });

    tasks.forEach(t => {
      if (t.startDate) {
        const sy = new Date(t.startDate).getFullYear();
        const dy = /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) ? new Date(t.dueDate).getFullYear() : 2024;
        if (y >= sy && y <= dy) {
          count++;
        }
      } else if (t.dueDate) {
        const dy = /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) ? new Date(t.dueDate).getFullYear() : 2024;
        if (y === dy) {
          count++;
        }
      }
    });

    return count;
  };

  // Helper to count tasks/projects active in a given month of a given year
  const getActivityCountForMonth = (y: number, m: number) => {
    let count = 0;
    const targetStart = new Date(y, m, 1);
    const targetEnd = new Date(y, m + 1, 0, 23, 59, 59);

    projects.forEach(p => {
      const startStr = p.startDate || getFallbackDateFromWeek(p.startWeek, 'start');
      const endStr = p.endDate || getFallbackDateFromWeek(p.endWeek, 'end');
      const pStart = new Date(startStr);
      const pEnd = new Date(endStr);
      if (!(pEnd < targetStart || pStart > targetEnd)) {
        count++;
      }
    });

    tasks.forEach(t => {
      const startStr = t.startDate || (t.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) ? t.dueDate : '2024-05-01');
      const endStr = t.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) ? t.dueDate : '2024-05-31';
      const tStart = new Date(startStr);
      const tEnd = new Date(endStr);
      if (!(tEnd < targetStart || tStart > targetEnd)) {
        count++;
      }
    });

    return count;
  };

  // Helper to get days in a month for calendar grid
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days: (number | null)[] = [];
    const startDayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, etc.
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }
    
    return days;
  };

  // Helper to retrieve activities for a specific day
  const getDayActivities = (year: number, month: number, day: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayTasks = tasks.filter(t => t.dueDate === formattedDate || t.startDate === formattedDate);
    const dayProjects = projects.filter(p => p.startDate === formattedDate || p.endDate === formattedDate);
    const dayMilestones = milestones.filter(m => m.date === formattedDate);
    
    return {
      tasks: dayTasks,
      projects: dayProjects,
      milestones: dayMilestones,
      totalCount: dayTasks.length + dayProjects.length + dayMilestones.length
    };
  };

  // Helper to calculate dynamic calendar header columns (7 columns)
  const getTimelineHeaders = () => {
    const headers = [];
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();

    if (timeView === 'weekly') {
      for (let i = 1; i <= 7; i++) {
        // Start date of week i starting from the 1st of currentMonthIndex
        const start = new Date(currentYear, currentMonthIndex, 1 + (i - 1) * 7);
        const end = new Date(currentYear, currentMonthIndex, 1 + (i - 1) * 7 + 6);
        
        // Format Thai text
        const startDay = start.getDate();
        const startMonthStr = THAI_MONTHS_SHORT[start.getMonth()];
        const endDay = end.getDate();
        const endMonthStr = THAI_MONTHS_SHORT[end.getMonth()];
        
        let label = `${startDay} ${startMonthStr} - ${endDay} ${endMonthStr}`;
        if (start.getMonth() === end.getMonth()) {
          label = `${startDay} - ${endDay} ${startMonthStr}`;
        }
        
        // Check if today falls in this range
        const isCurrent = today >= start && today <= new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1);
        
        headers.push({
          label,
          subLabel: `สัปดาห์ที่ ${i}`,
          isCurrent
        });
      }
    } else if (timeView === 'monthly') {
      for (let i = 0; i < 7; i++) {
        const m = (currentMonthIndex + i) % 12;
        const y = currentYear + Math.floor((currentMonthIndex + i) / 12);
        
        const label = `${THAI_MONTHS_SHORT[m]} ${y}`;
        const isCurrent = todayYear === y && todayMonth === m;
        
        headers.push({
          label,
          subLabel: `เดือนที่ ${i + 1}`,
          isCurrent
        });
      }
    } else if (timeView === 'quarterly') {
      const startQuarter = Math.floor(currentMonthIndex / 3);
      for (let i = 0; i < 7; i++) {
        const q = (startQuarter + i) % 4;
        const y = currentYear + Math.floor((startQuarter + i) / 4);
        
        const qNames = [
          'ไตรมาส 1 (ม.ค.-มี.ค.)',
          'ไตรมาส 2 (เม.ย.-มิ.ย.)',
          'ไตรมาส 3 (ก.ค.-ก.ย.)',
          'ไตรมาส 4 (ต.ค.-ธ.ค.)'
        ];
        
        const label = `${qNames[q]}`;
        const isCurrent = todayYear === y && Math.floor(todayMonth / 3) === q;
        
        headers.push({
          label,
          subLabel: `ปี ค.ศ. ${y}`,
          isCurrent
        });
      }
    } else { // yearly
      for (let i = 0; i < 7; i++) {
        const y = currentYear + i;
        const label = `ปี ค.ศ. ${y}`;
        const isCurrent = todayYear === y;
        
        headers.push({
          label,
          subLabel: `พ.ศ. ${y + 543}`,
          isCurrent
        });
      }
    }
    return headers;
  };

  const getFallbackDateFromWeek = (week: number, type: 'start' | 'end') => {
    const dayOffset = (week - 1) * 7;
    if (type === 'start') {
      const d = new Date(2024, 4, 1 + dayOffset);
      return d.toISOString().split('T')[0];
    } else {
      const d = new Date(2024, 4, 1 + dayOffset + 6);
      return d.toISOString().split('T')[0];
    }
  };

  const getTimelineDateRange = () => {
    const columnRanges: { start: Date; end: Date }[] = [];
    if (timeView === 'weekly') {
      for (let i = 1; i <= 7; i++) {
        const start = new Date(currentYear, currentMonthIndex, 1 + (i - 1) * 7);
        const end = new Date(currentYear, currentMonthIndex, 1 + (i - 1) * 7 + 6, 23, 59, 59);
        columnRanges.push({ start, end });
      }
    } else if (timeView === 'monthly') {
      for (let i = 0; i < 7; i++) {
        const m = (currentMonthIndex + i) % 12;
        const y = currentYear + Math.floor((currentMonthIndex + i) / 12);
        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 0, 23, 59, 59);
        columnRanges.push({ start, end });
      }
    } else if (timeView === 'quarterly') {
      const startQuarter = Math.floor(currentMonthIndex / 3);
      for (let i = 0; i < 7; i++) {
        const q = (startQuarter + i) % 4;
        const y = currentYear + Math.floor((startQuarter + i) / 4);
        const start = new Date(y, q * 3, 1);
        const end = new Date(y, (q + 1) * 3, 0, 23, 59, 59);
        columnRanges.push({ start, end });
      }
    } else {
      for (let i = 0; i < 7; i++) {
        const y = currentYear + i;
        const start = new Date(y, 0, 1);
        const end = new Date(y, 11, 31, 23, 59, 59);
        columnRanges.push({ start, end });
      }
    }
    return columnRanges;
  };

  const getProjectBarPosition = (proj: Project) => {
    const columnRanges = getTimelineDateRange();
    if (columnRanges.length < 7) return null;
    const timelineStart = columnRanges[0].start.getTime();
    const timelineEnd = columnRanges[6].end.getTime();
    const totalMs = timelineEnd - timelineStart;

    const projStartStr = proj.startDate || getFallbackDateFromWeek(proj.startWeek, 'start');
    const projEndStr = proj.endDate || getFallbackDateFromWeek(proj.endWeek, 'end');

    const projStart = new Date(projStartStr).getTime();
    const projEnd = new Date(projEndStr + 'T23:59:59').getTime();

    if (projEnd < timelineStart || projStart > timelineEnd) {
      return null;
    }

    const overlapStart = Math.max(projStart, timelineStart);
    const overlapEnd = Math.min(projEnd, timelineEnd);

    const leftPct = ((overlapStart - timelineStart) / totalMs) * 100;
    const widthPct = ((overlapEnd - overlapStart) / totalMs) * 100;

    return { leftPct, widthPct };
  };

  const getMilestonePosition = (m: Milestone) => {
    const columnRanges = getTimelineDateRange();
    if (columnRanges.length < 7) return null;
    const timelineStart = columnRanges[0].start.getTime();
    const timelineEnd = columnRanges[6].end.getTime();
    const totalMs = timelineEnd - timelineStart;

    if (/^\d{4}-\d{2}-\d{2}$/.test(m.date)) {
      const mTime = new Date(m.date).getTime();
      if (mTime >= timelineStart && mTime <= timelineEnd) {
        return ((mTime - timelineStart) / totalMs) * 100;
      }
      return null; // out of current timeline view
    } else {
      // Legacy support: use weekPosition (1 to 7)
      const pos = m.weekPosition || 3;
      return ((pos - 0.5) / 7) * 100;
    }
  };

  const getTaskBarPosition = (task: Task, projFallback: Project) => {
    const columnRanges = getTimelineDateRange();
    if (columnRanges.length < 7) return null;
    const timelineStart = columnRanges[0].start.getTime();
    const timelineEnd = columnRanges[6].end.getTime();
    const totalMs = timelineEnd - timelineStart;

    const taskStartStr = task.startDate || projFallback.startDate || getFallbackDateFromWeek(projFallback.startWeek, 'start');
    let taskEndStr = projFallback.endDate || getFallbackDateFromWeek(projFallback.endWeek, 'end');
    
    // Check if task dueDate matches YYYY-MM-DD
    if (task.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)) {
      taskEndStr = task.dueDate;
    }

    const taskStart = new Date(taskStartStr).getTime();
    const taskEnd = new Date(taskEndStr + 'T23:59:59').getTime();

    if (taskEnd < timelineStart || taskStart > timelineEnd) {
      return null;
    }

    const overlapStart = Math.max(taskStart, timelineStart);
    const overlapEnd = Math.min(taskEnd, timelineEnd);

    const leftPct = ((overlapStart - timelineStart) / totalMs) * 100;
    const widthPct = ((overlapEnd - overlapStart) / totalMs) * 100;

    return { leftPct, widthPct };
  };

  const calculateWeekFromDate = (dateStr: string, defaultWeek: number): number => {
    if (!dateStr) return defaultWeek;
    const targetDate = new Date(dateStr);
    const baseDate = new Date(2024, 4, 1);
    const diffTime = targetDate.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;
    return Math.min(Math.max(week, 1), 7);
  };

  const shiftDateString = (dateStr: string, days: number): string => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const formatShortThaiDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const year = parseInt(parts[0], 10) + 543;
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const shortMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const shortYear = year % 100;
    return `${day} ${shortMonths[month]} ${shortYear}`;
  };

  // Profile configuration (Settings)
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('tasktracker_profile');
    return saved ? JSON.parse(saved) : {
      name: 'อัครเดช สมบูรณ์',
      role: 'Project Manager',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1QeS9M115wR0lMwmKVQffNldjxv--Hn0hC2ludjU05845LNwOR1YFquRbHY_fEdloEQ6GpIyn0C0IQxoEIxWBuVurwWSBp4rsrWV7N4kuRWdmhCcZK8rGt1HZS_FFa6kVmqVdqVh9s95SZPVSRFelC6kJXMFD_gdmLePSw9UE7-Sc1dvO8pvKSNysBoxzhR8FzXv88I6wyPERiz0ZJWI9uLjfR_xiNj5MjlCYvNcS4qIrNMaFAHuQM5vs3K9C_gxczlUF2m3Iijo'
    };
  });

  // Log notifications state
  const [notifications, setNotifications] = useState<string[]>(() => {
    const saved = localStorage.getItem('tasktracker_notifications');
    return saved ? JSON.parse(saved) : [
      'เริ่มใช้งานระบบบอร์ดบริหารภาพรวมโครงการ TaskTracker',
      'ตรวจพบคอมโพเนนต์ใหม่ 4 ตัวจาก UI Design System v2',
      'ทีม B ทำการรีแวมป์ฟังก์ชันแก้ไขข้อมูลไทม์ไลน์โปรเจกต์',
      'สรุปรายงานประจำเดือน พฤษภาคม 2024 ถูกส่งไปยังทุกคนแล้ว'
    ];
  });

  // Modal control state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [expandedProjectIds, setExpandedProjectIds] = useState<string[]>([]);
  const [selectedTaskIdByProj, setSelectedTaskIdByProj] = useState<Record<string, string>>({});
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);

  const toggleProjectExpand = (projId: string) => {
    setExpandedProjectIds(prev => 
      prev.includes(projId) ? prev.filter(id => id !== projId) : [...prev, projId]
    );
  };

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleProfileImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('กรุณาอัปโหลดไฟล์รูปภาพที่ถูกต้อง (PNG, JPG, JPEG, GIF, WEBP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('ขนาดรูปภาพต้องไม่เกิน 2MB');
      return;
    }
    setUploadError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setProfile((prev: any) => ({ ...prev, avatar: e.target.result as string }));
        addNotification('อัปโหลดรูปภาพประจำตัวใหม่เรียบร้อยแล้ว');
      }
    };
    reader.readAsDataURL(file);
  };

  // Form states for project
  const [formProjName, setFormProjName] = useState('');
  const [formTaskName, setFormTaskName] = useState('');
  const [formTeamId, setFormTeamId] = useState<string>('team-b');
  const [formStatus, setFormStatus] = useState<ProjectStatus>('on-track');
  const [formProgress, setFormProgress] = useState(50);
  const [formStartWeek, setFormStartWeek] = useState(1);
  const [formEndWeek, setFormEndWeek] = useState(5);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDurationText, setFormDurationText] = useState('');

  // Form states for milestone
  const [formMileTitle, setFormMileTitle] = useState('');
  const [formMileDate, setFormMileDate] = useState('');
  const [formMileDesc, setFormMileDesc] = useState('');
  const [formMileWeek, setFormMileWeek] = useState(3);

  // Form states for task
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskTeam, setNewTaskTeam] = useState('team-b');
  const [newTaskStartDate, setNewTaskStartDate] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTeamGroupName, setNewTeamGroupName] = useState('');

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('tasktracker_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('tasktracker_milestones', JSON.stringify(milestones));
  }, [milestones]);

  useEffect(() => {
    localStorage.setItem('tasktracker_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('tasktracker_team_groups', JSON.stringify(teamGroups));
  }, [teamGroups]);

  useEffect(() => {
    localStorage.setItem('tasktracker_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('tasktracker_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('tasktracker_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Helper to add log notification
  const addNotification = (text: string) => {
    const timestamp = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    setNotifications(prev => [`[${timestamp}] ${text}`, ...prev.slice(0, 29)]);
  };

  // Calculations for KPI widgets
  const totalProjects = projects.length;
  const onTrackProjects = projects.filter(p => p.status === 'on-track').length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const teamPerformance = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  // Handle open project modal (new)
  const handleOpenNewProject = () => {
    setEditingProject(null);
    setFormProjName('');
    setFormTaskName('');
    setFormTeamId('team-b');
    setFormStatus('on-track');
    setFormProgress(60);
    setFormStartWeek(2);
    setFormEndWeek(5);
    setFormStartDate('2024-05-08');
    setFormEndDate('2024-06-04');
    setFormDesc('');
    setFormDurationText('');
    setIsProjectModalOpen(true);
  };

  // Handle open project modal (edit)
  const handleOpenEditProject = (proj: Project) => {
    setEditingProject(proj);
    setFormProjName(proj.name);
    setFormTaskName(proj.taskName);
    setFormTeamId(proj.teamId);
    setFormStatus(proj.status);
    setFormProgress(proj.progress);
    setFormStartWeek(proj.startWeek);
    setFormEndWeek(proj.endWeek);
    setFormStartDate(proj.startDate || getFallbackDateFromWeek(proj.startWeek, 'start'));
    setFormEndDate(proj.endDate || getFallbackDateFromWeek(proj.endWeek, 'end'));
    setFormDesc(proj.description || '');
    setFormDurationText(proj.durationText);
    setIsProjectModalOpen(true);
  };

  // Handle submit project form
  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProjName.trim()) return;

    const teamNamesMap: Record<string, string> = {
      'team-a': 'Team A: UI/UX Design',
      'team-b': 'Team B: Development',
      'team-c': 'Team C: Marketing'
    };
    const finalTeamName = teamNamesMap[formTeamId] || formTeamId;

    // Auto-generate status/duration suffix if durationText is left empty
    let duration = formDurationText;
    if (!duration.trim()) {
      const statusSuffix = formStatus === 'on-track' ? 'ตามแผน' : formStatus === 'at-risk' ? 'มีความเสี่ยง' : 'ล่าช้า';
      duration = `${formProgress}% ${statusSuffix}`;
    }

    if (editingProject) {
      // Edit mode
      const computedStartWeek = calculateWeekFromDate(formStartDate, formStartWeek);
      const computedEndWeek = calculateWeekFromDate(formEndDate, formEndWeek);
      setProjects(prev => prev.map(p => p.id === editingProject.id ? {
        ...p,
        name: formProjName,
        taskName: formTaskName || 'ไม่มีชื่องานย่อย',
        teamId: formTeamId,
        teamName: finalTeamName,
        status: formStatus,
        progress: Number(formProgress),
        startWeek: computedStartWeek,
        endWeek: computedEndWeek,
        startDate: formStartDate,
        endDate: formEndDate,
        durationText: duration,
        description: formDesc
      } : p));
      addNotification(`แก้ไขโปรเจกต์ "${formProjName}" เรียบร้อยแล้ว`);
    } else {
      // Add mode
      const computedStartWeek = calculateWeekFromDate(formStartDate, formStartWeek);
      const computedEndWeek = calculateWeekFromDate(formEndDate, formEndWeek);
      const newProj: Project = {
        id: `p-${Date.now()}`,
        name: formProjName,
        taskName: formTaskName || 'ไม่มีชื่องานย่อย',
        teamId: formTeamId,
        teamName: finalTeamName,
        status: formStatus,
        progress: Number(formProgress),
        durationText: duration,
        startWeek: computedStartWeek,
        endWeek: computedEndWeek,
        startDate: formStartDate,
        endDate: formEndDate,
        description: formDesc
      };
      setProjects(prev => [...prev, newProj]);
      addNotification(`เพิ่มโปรเจกต์ใหม่ "${formProjName}" เรียบร้อยแล้ว`);
    }

    setIsProjectModalOpen(false);
  };

  // Delete project
  const handleDeleteProject = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการลบโครงการ',
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบโปรเจกต์ "${name}"?`,
      onConfirm: () => {
        setProjects(prev => prev.filter(p => p.id !== id));
        addNotification(`ลบโปรเจกต์ "${name}" ออกจากระบบ`);
        setIsProjectModalOpen(false);
        setConfirmModal(null);
      }
    });
  };

  // Handle submit milestone form
  const handleSubmitMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMileTitle.trim() || !formMileDate.trim()) return;

    const newMile: Milestone = {
      id: `m-${Date.now()}`,
      title: formMileTitle,
      date: formMileDate,
      description: formMileDesc,
      weekPosition: Number(formMileWeek)
    };

    setMilestones(prev => [...prev, newMile]);
    addNotification(`เพิ่มไมล์สโตน "${formMileTitle}" วันที่ ${formatShortThaiDate(formMileDate)}`);
    
    // reset form
    setFormMileTitle('');
    setFormMileDate('');
    setFormMileDesc('');
    setFormMileWeek(3);
    setIsMilestoneModalOpen(false);
  };

  // Delete Milestone
  const handleDeleteMilestone = (id: string, title: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
    addNotification(`ลบไมล์สโตน "${title}" ออกแล้ว`);
  };

  // Handle custom shift timeline direct from layout
  const handleShiftProjectWeek = (projId: string, direction: 'left' | 'right') => {
    setProjects(prev => prev.map(p => {
      if (p.id === projId) {
        const currentStart = p.startDate || getFallbackDateFromWeek(p.startWeek, 'start');
        const currentEnd = p.endDate || getFallbackDateFromWeek(p.endWeek, 'end');
        if (direction === 'left' && p.startWeek > 1) {
          return { 
            ...p, 
            startWeek: p.startWeek - 1, 
            endWeek: p.endWeek - 1,
            startDate: shiftDateString(currentStart, -7),
            endDate: shiftDateString(currentEnd, -7)
          };
        }
        if (direction === 'right' && p.endWeek < 7) {
          return { 
            ...p, 
            startWeek: p.startWeek + 1, 
            endWeek: p.endWeek + 1,
            startDate: shiftDateString(currentStart, 7),
            endDate: shiftDateString(currentEnd, 7)
          };
        }
      }
      return p;
    }));
    addNotification(`เลื่อนขยับสัปดาห์ทำงานโครงการสำเร็จ`);
  };

  // Quick toggle task completion
  const handleToggleTask = (taskId: string, title: string, completed: boolean) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    addNotification(`${completed ? 'ยกเลิก' : 'ทำเครื่องหมาย'} งานสำเร็จ: "${title}"`);
  };

  // Update a specific task field directly (for inline dropdown editing)
  const updateTaskField = (taskId: string, field: keyof Task, value: any) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value === "" ? undefined : value } : t));
  };

  // Add or Edit personal task
  const handleAddPersonalTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    if (editingTask) {
      // Edit mode
      setTasks(prev => prev.map(t => t.id === editingTask.id ? {
        ...t,
        title: newTaskTitle,
        dueDate: newTaskDueDate || 'ไม่ระบุ',
        teamId: newTaskTeam,
        startDate: newTaskStartDate || undefined,
        projectId: newTaskProjectId || undefined
      } : t));
      addNotification(`แก้ไขงานย่อย "${newTaskTitle}" เรียบร้อยแล้ว`);
      setEditingTask(null);
    } else {
      // Add mode
      const newTask: Task = {
        id: `t-${Date.now()}`,
        title: newTaskTitle,
        dueDate: newTaskDueDate || 'ไม่ระบุ',
        completed: false,
        teamId: newTaskTeam,
        startDate: newTaskStartDate || undefined,
        projectId: newTaskProjectId || undefined
      };
      setTasks(prev => [...prev, newTask]);
      addNotification(`สร้างงานใหม่ "${newTaskTitle}" มอบหมายให้ทีม`);
    }

    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskStartDate('');
    setNewTaskProjectId('');
  };

  const handleStartEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    
    // Check if task.dueDate is YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)) {
      setNewTaskDueDate(task.dueDate);
    } else {
      // Parse Thai format like '10 พ.ค.'
      const match = task.dueDate.match(/^(\d+)\s+([ก-ฮ\.]+)/);
      if (match) {
        const d = match[1].padStart(2, '0');
        const mStr = match[2];
        const mIndex = THAI_MONTHS_SHORT.indexOf(mStr) !== -1 ? THAI_MONTHS_SHORT.indexOf(mStr) : 4; // default to May (index 4)
        const m = (mIndex + 1).toString().padStart(2, '0');
        setNewTaskDueDate(`2024-${m}-${d}`);
      } else {
        setNewTaskDueDate('');
      }
    }
    
    setNewTaskTeam(task.teamId);
    setNewTaskStartDate(task.startDate || '');
    setNewTaskProjectId(task.projectId || '');
  };

  const handleCancelEditTask = () => {
    setEditingTask(null);
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskStartDate('');
    setNewTaskProjectId('');
  };

  // Filter projects based on Search and Selected Team Tab
  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTeam = 
      selectedTeamTab === 'all' || 
      p.teamId === selectedTeamTab ||
      p.teamName === selectedTeamTab ||
      (selectedTeamTab === 'team-a' && p.teamName === 'Team A: UI/UX Design') ||
      (selectedTeamTab === 'team-b' && p.teamName === 'Team B: Development') ||
      (selectedTeamTab === 'team-c' && p.teamName === 'Team C: Marketing') ||
      (p.teamId === 'team-a' && selectedTeamTab === 'Team A: UI/UX Design') ||
      (p.teamId === 'team-b' && selectedTeamTab === 'Team B: Development') ||
      (p.teamId === 'team-c' && selectedTeamTab === 'Team C: Marketing');

    return matchesSearch && matchesTeam;
  });

  // Logged out passcode checker
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '1234' || passcode === '') {
      setIsLoggedOut(false);
      setPasscode('');
      setPasscodeError(false);
      addNotification('เข้าสู่ระบบสำเร็จในฐานะผู้จัดการโครงการ');
    } else {
      setPasscodeError(true);
    }
  };

  // Reset to default initial state
  const handleResetData = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
      localStorage.clear();
      setProjects(INITIAL_PROJECTS);
      setMilestones(INITIAL_MILESTONES);
      setMembers(INITIAL_MEMBERS);
      setTasks(INITIAL_TASKS);
      setProfile({
        name: 'อัครเดช สมบูรณ์',
        role: 'Project Manager',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1QeS9M115wR0lMwmKVQffNldjxv--Hn0hC2ludjU05845LNwOR1YFquRbHY_fEdloEQ6GpIyn0C0IQxoEIxWBuVurwWSBp4rsrWV7N4kuRWdmhCcZK8rGt1HZS_FFa6kVmqVdqVh9s95SZPVSRFelC6kJXMFD_gdmLePSw9UE7-Sc1dvO8pvKSNysBoxzhR8FzXv88I6wyPERiz0ZJWI9uLjfR_xiNj5MjlCYvNcS4qIrNMaFAHuQM5vs3K9C_gxczlUF2m3Iijo'
      });
      setNotifications([
        'เริ่มใช้งานระบบบอร์ดบริหารภาพรวมโครงการ TaskTracker',
        'ตรวจพบคอมโพเนนต์ใหม่ 4 ตัวจาก UI Design System v2',
        'ทีม B ทำการรีแวมป์ฟังก์ชันแก้ไขข้อมูลไทม์ไลน์โปรเจกต์'
      ]);
      addNotification('รีเซ็ตข้อมูลสำเร็จ');
    }
  };

  if (isLoggedOut) {
    return (
      <div className="min-h-screen bg-[#0d1c2f] text-white flex flex-col items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#131b2e] border border-outline-variant/30 rounded-2xl p-8 shadow-2xl text-center"
        >
          <div className="w-16 h-16 bg-[#10b981] rounded-2xl mx-auto flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-1">TaskTracker Secure Panel</h2>
          <p className="text-gray-400 text-sm mb-6">ระบบล็อกการจัดการบอร์ดโปรเจกต์ภายนอก</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-left text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                ป้อนรหัสผ่าน (เว้นว่างไว้เพื่อเข้าสู่ระบบทันที หรือใส่ 1234)
              </label>
              <input
                type="password"
                placeholder="••••••"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPasscodeError(false);
                }}
                className="w-full bg-[#0b1c30] border border-gray-700 rounded-xl px-4 py-3 text-center text-lg tracking-widest focus:ring-2 focus:ring-[#10b981] focus:outline-none transition-all"
              />
              {passcodeError && (
                <p className="text-red-400 text-xs mt-2 text-left flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#10b981] hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>เข้าสู่ระบบจัดการงาน</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800 text-xs text-gray-500">
            TaskTracker Pro • ปลอดภัย แข็งแกร่ง มีระบบสำรองข้อมูล
          </div>
        </motion.div>
      </div>
    );
  }

  const getTabTitle = () => {
    switch (selectedTab) {
      case 'overview':
        return 'ภาพรวมไทม์ไลน์โปรเจกต์';
      case 'members':
        return 'สมาชิกทีม';
      case 'tasks':
        return 'งานของฉัน';
      case 'notifications':
        return 'ศูนย์แจ้งเตือน';
      case 'settings':
        return 'ตั้งค่า';
      default:
        return 'ภาพรวมไทม์ไลน์โปรเจกต์';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] font-sans selection:bg-[#cbd5e1] flex">
      
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-[#c6c6cd]/50 flex flex-col p-4 z-40 hidden md:flex">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8 px-2 py-1">
          <div className="w-10 h-10 bg-[#131b2e] rounded-xl flex items-center justify-center text-white shadow-sm">
            <LayoutDashboard className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#000000]">TaskTracker</h2>
            <p className="text-[10px] text-gray-400 font-medium">การจัดการที่มีประสิทธิภาพ</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1.5">
          <button 
            id="nav-overview"
            onClick={() => setSelectedTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              selectedTab === 'overview' 
                ? 'bg-[#d5e3fd] text-[#0d1c2f]' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>ภาพรวมทีม</span>
          </button>

          <button 
            id="nav-members"
            onClick={() => setSelectedTab('members')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              selectedTab === 'members' 
                ? 'bg-[#d5e3fd] text-[#0d1c2f]' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="flex-1 text-left">สมาชิกทีม</span>
            <span className="bg-[#e5eeff] text-[#0b1c30] text-[10px] px-2 py-0.5 rounded-full font-bold">
              {members.length}
            </span>
          </button>

          <button 
            id="nav-tasks"
            onClick={() => setSelectedTab('tasks')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              selectedTab === 'tasks' 
                ? 'bg-[#d5e3fd] text-[#0d1c2f]' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span className="flex-1 text-left">งานของฉัน</span>
            <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {tasks.filter(t => !t.completed).length}
            </span>
          </button>

          <button 
            id="nav-notifications"
            onClick={() => setSelectedTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              selectedTab === 'notifications' 
                ? 'bg-[#d5e3fd] text-[#0d1c2f]' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="flex-1 text-left">ศูนย์แจ้งเตือน</span>
            <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
              ใหม่
            </span>
          </button>
        </nav>

        {/* Footer Sidebar Options */}
        <div className="mt-auto space-y-2 pt-4 border-t border-gray-100">
          <button 
            onClick={handleOpenNewProject}
            className="w-full bg-[#000000] hover:bg-gray-800 text-white font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างงานใหม่</span>
          </button>

          <button 
            id="nav-settings"
            onClick={() => setSelectedTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              selectedTab === 'settings' 
                ? 'bg-[#d5e3fd] text-[#0d1c2f]' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>ตั้งค่า</span>
          </button>

          <button 
            onClick={() => setIsLoggedOut(true)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER BUTTONS */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 z-40 flex justify-around items-center">
        <button 
          onClick={() => setSelectedTab('overview')}
          className={`flex flex-col items-center gap-1 p-2 ${selectedTab === 'overview' ? 'text-[#0d1c2f]' : 'text-gray-400'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">ภาพรวม</span>
        </button>
        <button 
          onClick={() => setSelectedTab('members')}
          className={`flex flex-col items-center gap-1 p-2 ${selectedTab === 'members' ? 'text-[#0d1c2f]' : 'text-gray-400'}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">สมาชิก</span>
        </button>
        <button 
          onClick={() => setSelectedTab('tasks')}
          className={`flex flex-col items-center gap-1 p-2 ${selectedTab === 'tasks' ? 'text-[#0d1c2f]' : 'text-gray-400'}`}
        >
          <ListTodo className="w-5 h-5" />
          <span className="text-[10px]">งานของฉัน</span>
        </button>
        <button 
          onClick={() => setSelectedTab('notifications')}
          className={`flex flex-col items-center gap-1 p-2 ${selectedTab === 'notifications' ? 'text-[#0d1c2f]' : 'text-gray-400'}`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px]">แจ้งเตือน</span>
        </button>
        <button 
          onClick={handleOpenNewProject}
          className="flex flex-col items-center gap-1 p-2 text-emerald-600 font-bold"
        >
          <Plus className="w-5 h-5 bg-emerald-100 rounded-full p-1" />
          <span className="text-[10px]">เพิ่มโปรเจกต์</span>
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 md:ml-64 min-h-screen pb-24 md:pb-12">
        
        {/* HEADER */}
        <header className="sticky top-0 bg-[#ffffff]/90 backdrop-blur-md z-30 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#000000] flex items-center gap-2">
              <span>{getTabTitle()}</span>
              <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50/70 border border-indigo-100/40 px-2.5 py-1 rounded-lg hidden lg:inline-block">
                {THAI_MONTHS[currentMonthIndex]} {currentYear}
              </span>
            </h1>
          </div>

          {/* Search bar & Profile */}
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="ค้นหาโปรเจกต์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 lg:w-64 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-600 hover:bg-[#e5eeff]/50 rounded-full transition-all relative cursor-pointer flex items-center justify-center border border-transparent hover:border-gray-200"
              title={theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-[#4f46e5]" />
              )}
            </button>

            {/* Notification alert count indicator */}
            <div className="relative">
              <button 
                onClick={() => setSelectedTab('notifications')}
                className="p-2 text-gray-600 hover:bg-[#e5eeff] rounded-full transition-colors relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>
            </div>

            {/* Profile badge */}
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200 cursor-pointer hover:opacity-85 transition-opacity" onClick={() => setSelectedTab('settings')}>
              <div className="text-right hidden lg:block">
                <p className="text-sm font-semibold text-[#0b1c30]">{profile.name}</p>
                <p className="text-[10px] text-gray-500 font-medium">{profile.role}</p>
              </div>
              <img 
                src={profile.avatar} 
                alt={profile.name} 
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400 shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* CONTAINER WORKSPACE */}
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          
          {/* SEARCH INPUT ON MOBILE */}
          <div className="sm:hidden relative w-full mb-4">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="ค้นหาโปรเจกต์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none"
            />
          </div>

          <AnimatePresence mode="wait">
            
            {/* OVERVIEW TAB */}
            {selectedTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* TIMELINE CONTROLS & FILTERS */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#c6c6cd]/50 shadow-xs">
                  {/* Left Controls: Weeks & Views Mode */}
                  <div className="flex flex-wrap items-center gap-4">
                    {/* View granularity selector */}
                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                      <button 
                        onClick={() => setTimeView('weekly')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          timeView === 'weekly' ? 'bg-white text-black shadow-xs border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        รายสัปดาห์
                      </button>
                      <button 
                        onClick={() => setTimeView('monthly')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          timeView === 'monthly' ? 'bg-white text-black shadow-xs border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        รายเดือน
                      </button>
                      <button 
                        onClick={() => setTimeView('quarterly')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          timeView === 'quarterly' ? 'bg-white text-black shadow-xs border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        รายไตรมาส
                      </button>
                      <button 
                        onClick={() => setTimeView('yearly')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          timeView === 'yearly' ? 'bg-white text-black shadow-xs border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        รายปี
                      </button>
                    </div>

                    <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

                    {/* Display Type: Project flat or Grouped by team */}
                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                      <button 
                        onClick={() => setDisplayMode('project')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          displayMode === 'project' ? 'bg-white text-black shadow-xs border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        <Grid className="w-3.5 h-3.5 text-gray-500" />
                        <span>มุมมองโปรเจกต์</span>
                      </button>
                      <button 
                        onClick={() => setDisplayMode('team')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          displayMode === 'team' ? 'bg-white text-black shadow-xs border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 text-gray-500" />
                        <span>มุมมองรายทีม</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Action buttons */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleOpenNewProject}
                      className="flex items-center gap-1.5 px-4 py-2 bg-black text-white hover:bg-gray-800 text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>เพิ่มโปรเจกต์</span>
                    </button>
                  </div>
                </div>

                {/* TIMELINE GRID & SIDEBAR CONTENT */}
                <div className="grid grid-cols-12 gap-6">
                  
                  {/* TIMELINE VIEW (Col-span 12 on mobile, 9 on desktop) */}
                  <div className="col-span-12 lg:col-span-9 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                    
                    {/* Month selector & Team tabs */}
                    <div className="p-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
                      
                      {/* Month & Year Selectors with task counts */}
                      <div className="flex flex-wrap items-center gap-3 bg-gray-100/50 p-2 rounded-2xl border border-gray-200">
                        <div className="flex items-center gap-1.5 px-1">
                          <Calendar className="w-4 h-4 text-black" />
                          <span className="text-xs font-bold text-gray-700">ช่วงเวลา:</span>
                        </div>

                        {/* Interactive Calendar Dropdown Trigger */}
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => {
                              setIsTimelineCalendarOpen(!isTimelineCalendarOpen);
                              setSelectedCalendarDay(null);
                            }}
                            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-800 text-xs font-extrabold rounded-xl px-2.5 py-1.5 border border-gray-200 shadow-2xs hover:border-gray-300 transition-all cursor-pointer"
                          >
                            <span className="text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded-md border border-indigo-100/40 font-black">
                              {THAI_MONTHS[currentMonthIndex]} ค.ศ. {currentYear}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-300 ${isTimelineCalendarOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Beautiful Floating Dropdown Popover */}
                          <AnimatePresence>
                            {isTimelineCalendarOpen && (
                              <>
                                {/* Backdrop to dismiss popover */}
                                <div 
                                  className="fixed inset-0 z-40" 
                                  onClick={() => setIsTimelineCalendarOpen(false)}
                                />
                                
                                <motion.div
                                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute left-0 mt-2 w-[310px] sm:w-[350px] bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col text-left"
                                >
                                  {/* Smart Selector Header inside the popover */}
                                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 p-2 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (currentMonthIndex === 0) {
                                          setCurrentMonthIndex(11);
                                          setCurrentYear(prev => prev - 1);
                                        } else {
                                          setCurrentMonthIndex(prev => prev - 1);
                                        }
                                        setSelectedCalendarDay(null);
                                      }}
                                      className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 cursor-pointer transition-colors"
                                      title="เดือนก่อนหน้า"
                                    >
                                      <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Month Selector */}
                                    <select
                                      value={currentMonthIndex}
                                      onChange={(e) => {
                                        setCurrentMonthIndex(parseInt(e.target.value, 10));
                                        setSelectedCalendarDay(null);
                                        addNotification(`เปลี่ยนแผนเป็นเดือน ${THAI_MONTHS[parseInt(e.target.value, 10)]}`);
                                      }}
                                      className="bg-white border border-gray-200 text-[11px] font-black rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-gray-700 flex-1 shadow-2xs"
                                    >
                                      {THAI_MONTHS.map((mName, idx) => (
                                        <option key={idx} value={idx}>
                                          {mName}
                                        </option>
                                      ))}
                                    </select>

                                    {/* Year Selector */}
                                    <select
                                      value={currentYear}
                                      onChange={(e) => {
                                        const y = parseInt(e.target.value, 10);
                                        setCurrentYear(y);
                                        setSelectedCalendarDay(null);
                                        addNotification(`เปลี่ยนแผนเป็นปี ค.ศ. ${y}`);
                                      }}
                                      className="bg-white border border-gray-200 text-[11px] font-black rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-gray-700 w-24 shadow-2xs"
                                    >
                                      {getTimelineSelectOptions().years.map((y) => (
                                        <option key={y} value={y}>
                                          ค.ศ. {y}
                                        </option>
                                      ))}
                                    </select>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (currentMonthIndex === 11) {
                                          setCurrentMonthIndex(0);
                                          setCurrentYear(prev => prev + 1);
                                        } else {
                                          setCurrentMonthIndex(prev => prev + 1);
                                        }
                                        setSelectedCalendarDay(null);
                                      }}
                                      className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 cursor-pointer transition-colors"
                                      title="เดือนถัดไป"
                                    >
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="p-3">
                                    <div className="space-y-2.5">
                                      {/* Days Header */}
                                      <div className="grid grid-cols-7 gap-1 text-center border-b border-gray-100 pb-1">
                                        {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((dName, idx) => (
                                          <span 
                                            key={idx} 
                                            className={`text-[9px] font-bold ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-indigo-500' : 'text-gray-400'}`}
                                          >
                                            {dName}
                                          </span>
                                        ))}
                                      </div>

                                      {/* Days Cells */}
                                      <div className="grid grid-cols-7 gap-1">
                                        {getDaysInMonth(currentYear, currentMonthIndex).map((day, idx) => {
                                          if (day === null) {
                                            return <div key={`empty-${idx}`} />;
                                          }
                                          
                                          const acts = getDayActivities(currentYear, currentMonthIndex, day);
                                          const isSelected = selectedCalendarDay === day;
                                          
                                          const todayObj = new Date();
                                          const isToday = todayObj.getDate() === day && 
                                                          todayObj.getMonth() === currentMonthIndex && 
                                                          todayObj.getFullYear() === currentYear;

                                          return (
                                            <button
                                              type="button"
                                              key={`day-${day}`}
                                              onClick={() => setSelectedCalendarDay(day)}
                                              className={`h-7 w-7 flex flex-col items-center justify-center rounded-lg text-[10px] font-extrabold relative transition-all cursor-pointer
                                                ${isSelected 
                                                  ? 'bg-indigo-600 text-white shadow-sm' 
                                                  : isToday 
                                                    ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                                                    : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                              <span>{day}</span>
                                              {acts.totalCount > 0 && !isSelected && (
                                                <div className="absolute bottom-0.5 flex justify-center gap-0.5">
                                                  {acts.tasks.length > 0 && <span className="w-0.5 h-0.5 rounded-full bg-emerald-500" />}
                                                  {acts.projects.length > 0 && <span className="w-0.5 h-0.5 rounded-full bg-blue-500" />}
                                                  {acts.milestones.length > 0 && <span className="w-0.5 h-0.5 rounded-full bg-amber-500" />}
                                                </div>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>

                                      {/* Calendar Day Detail summary inside the popover */}
                                      {selectedCalendarDay !== null && (
                                        <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 text-[10px]">
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-gray-500">
                                              งานวันที่ {selectedCalendarDay} {THAI_MONTHS_SHORT[currentMonthIndex]} ค.ศ. {currentYear}:
                                            </span>
                                            <button 
                                              onClick={() => setSelectedCalendarDay(null)} 
                                              className="font-bold text-indigo-600 hover:underline cursor-pointer"
                                            >
                                              ย่อ
                                            </button>
                                          </div>
                                          {(() => {
                                            const acts = getDayActivities(currentYear, currentMonthIndex, selectedCalendarDay);
                                            if (acts.totalCount === 0) {
                                              return <p className="text-[9px] text-gray-400 font-medium italic">ไม่มีกิจกรรมหรือความคืบหน้าในวันนี้</p>;
                                            }
                                            return (
                                              <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1 text-left">
                                                {acts.projects.map(p => (
                                                  <div key={p.id} className="flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                                                    <span className="text-gray-400 font-bold">[โครงการ]</span>
                                                    <span className="text-gray-700 font-medium truncate">{p.name}</span>
                                                  </div>
                                                ))}
                                                {acts.tasks.map(t => (
                                                  <div key={t.id} className="flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                                    <span className="text-gray-400 font-bold">[ภารกิจ]</span>
                                                    <span className="text-gray-700 font-medium truncate">{t.title}</span>
                                                  </div>
                                                ))}
                                                {acts.milestones.map(m => (
                                                  <div key={m.id} className="flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                                                    <span className="text-gray-400 font-bold">[หมุด]</span>
                                                    <span className="text-gray-700 font-medium truncate">{m.title}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Popover bottom bar with extremely handy quick action shortcuts */}
                                  <div className="border-t border-gray-100 p-2 bg-gray-50 flex flex-wrap items-center justify-between gap-1.5">
                                    <div className="flex gap-1">
                                      {/* Quick shortcut to go to actual Today */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const today = new Date();
                                          setCurrentMonthIndex(today.getMonth());
                                          setCurrentYear(today.getFullYear());
                                          setSelectedCalendarDay(today.getDate());
                                          addNotification(`ย้ายหน้าต่างเลือกไปยัง เดือนนี้ (${THAI_MONTHS[today.getMonth()]} ${today.getFullYear()})`);
                                        }}
                                        className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-[9px] font-bold rounded-lg cursor-pointer transition-colors shadow-3xs"
                                      >
                                        ย้ายไป "เดือนนี้"
                                      </button>
                                      
                                      {/* Quick shortcut to auto-fit to jobs */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const earliestDate = projects.reduce((earliest: Date | null, p) => {
                                            const startStr = p.startDate || getFallbackDateFromWeek(p.startWeek, 'start');
                                            const d = new Date(startStr);
                                            if (isNaN(d.getTime())) return earliest;
                                            return earliest === null || d < earliest ? d : earliest;
                                          }, null);

                                          if (earliestDate) {
                                            const y = (earliestDate as Date).getFullYear();
                                            const m = (earliestDate as Date).getMonth();
                                            setCurrentYear(y);
                                            setCurrentMonthIndex(m);
                                            setSelectedCalendarDay(null);
                                            addNotification(`จัดช่วงเวลาอัตโนมัติไปยังจุดที่มีงาน (${THAI_MONTHS[m]} ค.ศ. ${y})`);
                                          } else {
                                            addNotification(`ไม่พบงานเพื่อจัดช่วงเวลาอัตโนมัติ`);
                                          }
                                        }}
                                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 text-[9px] font-bold rounded-lg cursor-pointer transition-colors"
                                      >
                                        จัดเวลากลุ่มงาน
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => setIsTimelineCalendarOpen(false)}
                                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold rounded-lg cursor-pointer transition-colors ml-auto"
                                    >
                                      ปิด
                                    </button>
                                  </div>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Traditional Chevrons for Quick Switching */}
                        <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
                          <button 
                            onClick={() => {
                              if (timeView === 'yearly') {
                                setCurrentYear(prev => prev - 1);
                                addNotification(`เปลี่ยนแผนเป็นปีที่แล้ว`);
                              } else {
                                if (currentMonthIndex === 0) {
                                  setCurrentMonthIndex(11);
                                  setCurrentYear(prev => prev - 1);
                                } else {
                                  setCurrentMonthIndex(prev => prev - 1);
                                }
                                addNotification(`เปลี่ยนแผนเป็นเดือนที่แล้ว`);
                              }
                            }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-600 transition-colors cursor-pointer"
                            title="ย้อนกลับ"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (timeView === 'yearly') {
                                setCurrentYear(prev => prev + 1);
                                addNotification(`เปลี่ยนแผนเป็นปีถัดไป`);
                              } else {
                                if (currentMonthIndex === 11) {
                                  setCurrentMonthIndex(0);
                                  setCurrentYear(prev => prev + 1);
                                } else {
                                  setCurrentMonthIndex(prev => prev + 1);
                                }
                                addNotification(`เปลี่ยนแผนเป็นเดือนถัดไป`);
                              }
                            }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-600 transition-colors cursor-pointer"
                            title="ถัดไป"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Auto-fit Button */}
                        <button
                          onClick={() => {
                            let earliestDate: Date | null = null;
                            
                            projects.forEach(p => {
                              const dStr = p.startDate || getFallbackDateFromWeek(p.startWeek, 'start');
                              const d = new Date(dStr);
                              if (!isNaN(d.getTime())) {
                                if (!earliestDate || d < earliestDate) earliestDate = d;
                              }
                            });

                            tasks.forEach(t => {
                              if (t.startDate) {
                                const d = new Date(t.startDate);
                                if (!isNaN(d.getTime())) {
                                  if (!earliestDate || d < earliestDate) earliestDate = d;
                                }
                              }
                              if (t.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)) {
                                const d = new Date(t.dueDate);
                                if (!isNaN(d.getTime())) {
                                  if (!earliestDate || d < earliestDate) earliestDate = d;
                                }
                              }
                            });

                            if (earliestDate) {
                              const y = (earliestDate as Date).getFullYear();
                              const m = (earliestDate as Date).getMonth();
                              setCurrentYear(y);
                              setCurrentMonthIndex(m);
                              addNotification(`ปรับช่วงเวลาอัตโนมัติไปยังจุดเริ่มต้นที่มีงาน (${THAI_MONTHS[m]} ค.ศ. ${y})`);
                            } else {
                              addNotification(`ไม่พบข้อมูลวันที่เพื่อจัดช่วงเวลาอัตโนมัติ`);
                            }
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#4f46e5] text-xs font-bold rounded-xl cursor-pointer border border-indigo-100 transition-colors"
                          title="ปรับไทม์ไลน์ไปยังช่วงเริ่มต้นงานแรกสุดโดยอัตโนมัติ"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>ปรับตามงานอัตโนมัติ</span>
                        </button>
                      </div>

                      {/* Team Quick filter tabs */}
                      <div className="flex flex-wrap items-center gap-1 bg-white border border-gray-200 rounded-xl p-0.5 shadow-2xs">
                        <button 
                          onClick={() => setSelectedTeamTab('all')}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            selectedTeamTab === 'all' ? 'bg-[#000000] text-white' : 'text-gray-500 hover:text-black'
                          }`}
                        >
                          ทั้งหมด
                        </button>
                        {teamGroups.map((g) => {
                          const isSelected = selectedTeamTab === g || 
                            (g === 'Team A: UI/UX Design' && selectedTeamTab === 'team-a') ||
                            (g === 'Team B: Development' && selectedTeamTab === 'team-b') ||
                            (g === 'Team C: Marketing' && selectedTeamTab === 'team-c');
                          
                          let displayName = g;
                          if (g === 'Team A: UI/UX Design') displayName = 'ทีม A (Design)';
                          else if (g === 'Team B: Development') displayName = 'ทีม B (Dev)';
                          else if (g === 'Team C: Marketing') displayName = 'ทีม C (Marketing)';

                          return (
                            <button 
                              key={g}
                              onClick={() => {
                                let val = g;
                                if (g === 'Team A: UI/UX Design') val = 'team-a';
                                else if (g === 'Team B: Development') val = 'team-b';
                                else if (g === 'Team C: Marketing') val = 'team-c';
                                setSelectedTeamTab(val as any);
                              }}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                isSelected ? 'bg-[#000000] text-white' : 'text-gray-500 hover:text-black'
                              }`}
                            >
                              {displayName}
                            </button>
                          );
                        })}
                      </div>

                    </div>

                    {/* Timeline Scroll Area */}
                    <div className="overflow-x-auto custom-scrollbar">
                      <div className="min-w-[950px] relative">
                        
                        {/* Dynamic calendar column headers */}
                        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/70">
                          {getTimelineHeaders().map((header, idx) => (
                            <div 
                              key={idx} 
                              className={`p-3 text-center transition-all ${idx < 6 ? 'border-r border-gray-200' : ''} ${
                                header.isCurrent 
                                  ? 'bg-[#4f46e5]/10 dark:bg-indigo-500/10' 
                                  : ''
                              }`}
                            >
                              <span className={`block text-xs ${
                                header.isCurrent 
                                  ? 'font-bold text-[#4f46e5] dark:text-indigo-400' 
                                  : 'font-semibold text-gray-700 dark:text-gray-300'
                              }`}>
                                {header.label}
                              </span>
                              <span className="block text-[10px] text-gray-400 mt-0.5">
                                {header.subLabel}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Timeline Rows Area with Grid Lines */}
                        <div className="relative py-6 min-h-[480px] bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px)] bg-[size:calc(100%/7)_100%]">
                          
                          {/* Dynamic Current vertical line indicator across any active view! */}
                          {(() => {
                            const headers = getTimelineHeaders();
                            const currentIdx = headers.findIndex(h => h.isCurrent);
                            if (currentIdx === -1) return null;
                            const leftPct = `${((currentIdx + 0.5) / 7) * 100}%`;
                            return (
                              <div 
                                className="absolute top-0 bottom-0 w-0.5 bg-[#4f46e5]/30 dark:bg-indigo-500/30 z-10 flex flex-col items-center pointer-events-none"
                                style={{ left: leftPct }}
                              >
                                <div className="w-3 h-3 bg-[#4f46e5] dark:bg-indigo-500 rounded-full -mt-1.5 shadow-md"></div>
                                <span className="bg-[#4f46e5] dark:bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold mt-2 shadow-xs whitespace-nowrap">
                                  ปัจจุบัน
                                </span>
                              </div>
                            );
                          })()}

                          {/* Dynamic Flags for Milestones (Rendered on top of timeline grid) */}
                          <div className="absolute top-1 left-0 right-0 h-0 z-20 pointer-events-none">
                            {milestones.map((m) => {
                              const posPercent = getMilestonePosition(m);
                              if (posPercent === null) return null;
                              const leftPct = `${posPercent}%`;
                              return (
                                <div 
                                  key={m.id} 
                                  className="absolute flex flex-col items-center pointer-events-auto"
                                  style={{ left: leftPct }}
                                >
                                  <div className="group relative">
                                    <div className="p-1.5 bg-white border-2 border-amber-500 rounded-full text-amber-500 shadow-sm cursor-help hover:scale-110 transition-transform">
                                      <Flag className="w-3.5 h-3.5 fill-amber-500" />
                                    </div>
                                    
                                    {/* Tooltip */}
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-8 hidden group-hover:block bg-[#131b2e] text-white text-xs px-3 py-2 rounded-lg shadow-lg w-48 z-40">
                                      <p className="font-bold">{m.title}</p>
                                      <p className="text-[10px] text-gray-400 mt-0.5">{m.description}</p>
                                      <p className="text-[10px] text-emerald-400 mt-1 font-semibold">เป้าหมาย: {formatShortThaiDate(m.date)}</p>
                                    </div>
                                  </div>
                                  <div className="h-6 w-px bg-amber-500 border-dashed border"></div>
                                </div>
                              );
                            })}
                          </div>

                          {filteredProjects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                              <Info className="w-10 h-10 mb-2 stroke-1" />
                              <p className="text-sm">ไม่พบโปรเจกต์ที่สอดคล้องกับการค้นหา</p>
                              <button 
                                onClick={() => { setSearchQuery(''); setSelectedTeamTab('all'); }} 
                                className="text-xs text-blue-500 font-semibold mt-2 hover:underline cursor-pointer"
                              >
                                ล้างตัวกรองทั้งหมด
                              </button>
                            </div>
                          ) : (
                            <>
                              {displayMode === 'team' ? (
                                // GROUP BY TEAM VIEW
                                <div className="space-y-8">
                                  {teamGroups.map(groupName => {
                                    const teamProjs = filteredProjects.filter(p => {
                                      return p.teamName === groupName ||
                                        p.teamId === groupName ||
                                        (groupName === 'Team A: UI/UX Design' && p.teamId === 'team-a') ||
                                        (groupName === 'Team B: Development' && p.teamId === 'team-b') ||
                                        (groupName === 'Team C: Marketing' && p.teamId === 'team-c');
                                    });
                                    if (teamProjs.length === 0) return null;

                                    const teamInfo = getTeamColor(groupName);

                                    return (
                                      <div key={groupName} className="px-5">
                                        {/* Team Row Header Badge */}
                                        <div className="flex items-center gap-2 mb-3 bg-gray-100/80 py-1 px-3 rounded-lg w-fit">
                                          <span className={`w-2 h-2 rounded-full ${teamInfo.color}`}></span>
                                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">
                                            {groupName}
                                          </span>
                                        </div>

                                        {/* Project rows for this team */}
                                        <div className="space-y-5">
                                          {teamProjs.map((p) => (
                                            <div key={p.id} className="pl-4 border-l-2 border-gray-200 relative group">
                                              
                                              {/* Project Metadata Header Row */}
                                              <div className="flex items-center justify-between mb-1.5 pr-2">
                                                <div className="flex items-center gap-2">
                                                  <button 
                                                    onClick={() => toggleProjectExpand(p.id)}
                                                    className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors cursor-pointer"
                                                    title={expandedProjectIds.includes(p.id) ? "ยุบดูข้อมูลงานย่อย" : "ขยายดูงานย่อย"}
                                                  >
                                                    {expandedProjectIds.includes(p.id) ? (
                                                      <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                                                    ) : (
                                                      <ChevronDown className="w-3.5 h-3.5" />
                                                    )}
                                                  </button>
                                                  <span className="text-sm font-bold text-gray-800 hover:text-black cursor-pointer" onClick={() => handleOpenEditProject(p)}>
                                                    {p.name}
                                                  </span>
                                                  <span className="text-[10px] text-gray-400 font-medium">({p.taskName})</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                  <span className="text-[11px] text-gray-400 font-medium">
                                                    {formatShortThaiDate(p.startDate || getFallbackDateFromWeek(p.startWeek, 'start'))} - {formatShortThaiDate(p.endDate || getFallbackDateFromWeek(p.endWeek, 'end'))}
                                                  </span>
                                                  <span className={`text-xs font-bold ${
                                                    p.status === 'on-track' ? 'text-emerald-600' : p.status === 'at-risk' ? 'text-amber-600' : 'text-red-600'
                                                  }`}>
                                                    {p.durationText}
                                                  </span>

                                                  {/* Inline Quick edit controls */}
                                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
                                                    <button 
                                                      title="ขยับซ้าย"
                                                      onClick={() => handleShiftProjectWeek(p.id, 'left')}
                                                      disabled={p.startWeek <= 1}
                                                      className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30 cursor-pointer"
                                                    >
                                                      <ChevronLeft className="w-3 h-3" />
                                                    </button>
                                                    <button 
                                                      title="ขยับขวา"
                                                      onClick={() => handleShiftProjectWeek(p.id, 'right')}
                                                      disabled={p.endWeek >= 7}
                                                      className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30 cursor-pointer"
                                                    >
                                                      <ChevronRight className="w-3 h-3" />
                                                    </button>
                                                    <button 
                                                      title="แก้ไขข้อมูลหลัก"
                                                      onClick={() => handleOpenEditProject(p)}
                                                      className="p-1 hover:bg-gray-100 rounded text-blue-500 cursor-pointer"
                                                    >
                                                      <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                  </div>
                                                </div>

                                              </div>

                                              {/* Bar */}
                                              <div className="relative h-11 w-full bg-gray-50 rounded-xl overflow-hidden border border-gray-100/50">
                                                {(() => {
                                                  const barPos = getProjectBarPosition(p);
                                                  if (!barPos) {
                                                    return (
                                                      <div 
                                                        className="absolute inset-0 flex items-center justify-center bg-gray-100/50 cursor-pointer text-gray-400 text-[10px] font-semibold"
                                                        onClick={() => toggleProjectExpand(p.id)}
                                                      >
                                                        <span>อยู่นอกช่วงปฏิทิน ({p.startDate || getFallbackDateFromWeek(p.startWeek, 'start')} ถึง {p.endDate || getFallbackDateFromWeek(p.endWeek, 'end')})</span>
                                                      </div>
                                                    );
                                                  }
                                                  return (
                                                    <>
                                                      <div 
                                                        className="absolute top-0 bottom-0 z-20 flex items-center px-4 rounded-xl cursor-pointer"
                                                        style={{
                                                          left: `${barPos.leftPct}%`,
                                                          width: `${barPos.widthPct}%`,
                                                          backgroundColor: p.status === 'on-track' ? '#10b981' : p.status === 'at-risk' ? '#f59e0b' : '#ba1a1a'
                                                        }}
                                                        onClick={() => toggleProjectExpand(p.id)}
                                                      >
                                                        <GripVertical className="w-4 h-4 text-white/50 mr-2 shrink-0 cursor-grab" />
                                                        <div className="overflow-hidden">
                                                          <p className="text-[10px] text-white font-extrabold uppercase tracking-wide truncate">
                                                            {p.taskName}
                                                          </p>
                                                          <p className="text-[9px] text-white/85 truncate font-medium">
                                                            ความสำเร็จ: {p.progress}%
                                                          </p>
                                                        </div>
                                                      </div>

                                                      {/* Transparent shade bar representing expected complete width limit */}
                                                      <div 
                                                        className="absolute top-0 bottom-0 z-10 rounded-xl opacity-20"
                                                        style={{
                                                          left: `${barPos.leftPct}%`,
                                                          width: `${100 - barPos.leftPct}%`,
                                                          backgroundColor: p.status === 'on-track' ? '#10b981' : p.status === 'at-risk' ? '#f59e0b' : '#ba1a1a'
                                                        }}
                                                      ></div>
                                                    </>
                                                  );
                                                })()}
                                              </div>

                                              {/* Expanded Subtasks & Interactive Charts */}
                                              {expandedProjectIds.includes(p.id) && (
                                                <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200/60 space-y-4 shadow-2xs">
                                                  {/* Section Header */}
                                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/50 pb-2.5">
                                                    <div className="flex items-center gap-1.5">
                                                      <Sliders className="w-4 h-4 text-indigo-600 animate-pulse" />
                                                      <span className="text-xs font-bold text-gray-800">เครื่องมือวิเคราะห์และปรับแต่งภารกิจย่อยในโครงการ</span>
                                                    </div>
                                                    <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full font-bold">
                                                      เชื่อมโยงกับ ตารางตรวจเช็กภารกิจ (Task Checklist)
                                                    </span>
                                                  </div>

                                                  {(() => {
                                                    // Get all tasks of this project from checklist
                                                    const projectTasks = tasks.filter(t => t.projectId === p.id || (!t.projectId && t.teamId === p.teamId));
                                                    
                                                    if (projectTasks.length === 0) {
                                                      return (
                                                        <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                                                          <ListTodo className="w-8 h-8 mb-1.5 stroke-1" />
                                                          <p className="text-xs">ไม่มีงานย่อยในโครงการนี้ที่เชื่อมโยงกับตารางตรวจเช็กภารกิจ</p>
                                                          <button 
                                                            onClick={() => {
                                                              const newT: Task = {
                                                                id: `task-${Date.now()}`,
                                                                title: `งานย่อยสืบเนื่องของ ${p.name}`,
                                                                dueDate: p.endDate || getFallbackDateFromWeek(p.endWeek, 'end'),
                                                                completed: false,
                                                                teamId: p.teamId,
                                                                startDate: p.startDate || getFallbackDateFromWeek(p.startWeek, 'start'),
                                                                projectId: p.id
                                                              };
                                                              setTasks(prev => [...prev, newT]);
                                                              addNotification(`สร้างงานใหม่เชื่อมโยงกับโครงการ "${p.name}" สำเร็จ`);
                                                            }}
                                                            className="text-xs text-indigo-600 font-bold mt-2 hover:underline cursor-pointer"
                                                          >
                                                            + สร้างภารกิจย่อยแรกสำหรับโครงการนี้
                                                          </button>
                                                        </div>
                                                      );
                                                    }

                                                    // Auto-select first task if none selected or if selected taskId is not in this project's tasks
                                                    const currentSelectedId = selectedTaskIdByProj[p.id] || (projectTasks[0] ? projectTasks[0].id : '');
                                                    const currentSelectedTask = projectTasks.find(t => t.id === currentSelectedId) || projectTasks[0];

                                                    return (
                                                      <div className="space-y-4">
                                                        {/* Form Control with Dropdown Select & Task Panel */}
                                                        <div className="bg-white p-4 rounded-xl border border-gray-150 space-y-4 shadow-3xs">
                                                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                                            <div className="md:col-span-5">
                                                              <label className="text-[10px] font-bold text-gray-400 block mb-1.5 uppercase tracking-wider">
                                                                เลือกภารกิจเพื่อดูและปรับแต่ง (Dropdown):
                                                              </label>
                                                              <select
                                                                value={currentSelectedTask?.id || ''}
                                                                onChange={(e) => {
                                                                  setSelectedTaskIdByProj(prev => ({
                                                                    ...prev,
                                                                    [p.id]: e.target.value
                                                                  }));
                                                                }}
                                                                className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold rounded-lg px-2.5 py-2.5 text-black cursor-pointer shadow-3xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                              >
                                                                {projectTasks.map((t) => (
                                                                  <option key={t.id} value={t.id}>
                                                                    {t.title} {t.completed ? ' (เสร็จสิ้น)' : ' (กำลังทำ)'}
                                                                  </option>
                                                                ))}
                                                              </select>
                                                            </div>

                                                            {currentSelectedTask && (
                                                              <div className="md:col-span-7 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 p-2.5 px-4 rounded-xl border border-gray-100">
                                                                <div className="flex items-center gap-2">
                                                                  <span className="text-xs text-gray-400 font-medium">สถานะ:</span>
                                                                  <button
                                                                    onClick={() => handleToggleTask(currentSelectedTask.id, currentSelectedTask.title, currentSelectedTask.completed)}
                                                                    className={`font-bold px-3 py-1 rounded-full text-[10px] transition-colors cursor-pointer ${
                                                                      currentSelectedTask.completed ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                                    }`}
                                                                  >
                                                                    {currentSelectedTask.completed ? 'เสร็จสมบูรณ์' : 'กำลังดำเนินการ'}
                                                                  </button>
                                                                </div>

                                                                <div className="flex items-center gap-1.5">
                                                                  <span className="text-[10px] text-gray-400 font-bold uppercase">ความก้าวหน้า:</span>
                                                                  <div className="w-16 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                                    <div className={`h-full ${currentSelectedTask.completed ? 'bg-emerald-500' : 'bg-indigo-500'} transition-all`} style={{ width: currentSelectedTask.completed ? '100%' : '30%' }}></div>
                                                                  </div>
                                                                  <span className={`text-[10px] font-bold ${currentSelectedTask.completed ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                                                    {currentSelectedTask.completed ? '100%' : '30%'}
                                                                  </span>
                                                                </div>
                                                              </div>
                                                            )}
                                                          </div>

                                                          {currentSelectedTask && (
                                                            <div className="bg-gray-50/50 p-3.5 rounded-xl border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                                              <div className="flex justify-between sm:flex-col sm:gap-1">
                                                                <span className="text-gray-400 font-medium">วันเริ่มงาน:</span>
                                                                <span className="font-semibold text-gray-700">{currentSelectedTask.startDate ? formatShortThaiDate(currentSelectedTask.startDate) : 'ไม่ระบุ'}</span>
                                                              </div>
                                                              <div className="flex justify-between sm:flex-col sm:gap-1">
                                                                <span className="text-gray-400 font-medium">กำหนดส่ง:</span>
                                                                <span className="font-semibold text-gray-700">
                                                                  {/^\d{4}-\d{2}-\d{2}$/.test(currentSelectedTask.dueDate) ? formatShortThaiDate(currentSelectedTask.dueDate) : currentSelectedTask.dueDate}
                                                                </span>
                                                              </div>
                                                              <div className="flex justify-between sm:flex-col sm:gap-1">
                                                                <span className="text-gray-400 font-medium">ผู้รับผิดชอบหลัก:</span>
                                                                <span className="font-semibold text-gray-700">
                                                                  {currentSelectedTask.teamId === 'team-a' ? 'Team A: UI/UX Design' : 
                                                                   currentSelectedTask.teamId === 'team-b' ? 'Team B: Development' : 
                                                                   currentSelectedTask.teamId === 'team-c' ? 'Team C: Marketing' : 
                                                                   currentSelectedTask.teamId}
                                                                </span>
                                                              </div>
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    );
                                                  })()}

                                                  {/* Compact subtask timeline bar view */}
                                                  <div className="pt-3 border-t border-gray-150 space-y-2">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                                      <span>แถบระยะเวลากำหนดการจริงของงานย่อยตามแผนงานไทม์ไลน์</span>
                                                    </div>
                                                    <div className="space-y-2 pl-2">
                                                      {(() => {
                                                        const projectTasks = tasks.filter(t => t.projectId === p.id || (!t.projectId && t.teamId === p.teamId));
                                                        return projectTasks.map((t) => {
                                                          const taskBarPos = getTaskBarPosition(t, p);
                                                          return (
                                                            <div key={t.id} className="grid grid-cols-12 items-center gap-3">
                                                              <span className="col-span-3 text-[10px] font-bold text-gray-600 truncate">{t.title}</span>
                                                              <div className="col-span-9 relative h-6 bg-gray-100 rounded-lg overflow-hidden border border-gray-200/50">
                                                                {taskBarPos ? (
                                                                  <div 
                                                                    className={`absolute top-0 bottom-0 z-20 flex items-center px-2 rounded-lg text-[8px] font-extrabold text-white transition-all ${
                                                                      t.completed ? 'bg-emerald-500/80' : 'bg-indigo-500/80'
                                                                    }`}
                                                                    style={{
                                                                      left: `${taskBarPos.leftPct}%`,
                                                                      width: `${taskBarPos.widthPct}%`,
                                                                    }}
                                                                  >
                                                                    <span className="truncate">{t.completed ? '✓ เสร็จสิ้นในตาราง' : '⏳ กำลังดำเนินการ'}</span>
                                                                  </div>
                                                                ) : (
                                                                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-[8px] italic">
                                                                    อยู่นอกช่วงปฏิทิน ({t.startDate ? formatShortThaiDate(t.startDate) : 'ไม่ระบุ'} ถึง {t.dueDate ? (/^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) ? formatShortThaiDate(t.dueDate) : t.dueDate) : 'ไม่ระบุ'})
                                                                  </div>
                                                                )}
                                                              </div>
                                                            </div>
                                                          );
                                                        });
                                                      })()}
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                // FLAT LIST / PROJECT SORTED VIEW
                                <div className="space-y-6 px-5">
                                  {filteredProjects.map((p) => (
                                    <div key={p.id} className="pl-4 border-l-2 border-emerald-500 relative group">
                                      
                                      <div className="flex items-center justify-between mb-1.5 pr-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold text-gray-800 hover:text-black cursor-pointer" onClick={() => handleOpenEditProject(p)}>
                                            {p.name}
                                          </span>
                                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-bold">
                                            {p.teamName}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-emerald-600">{p.durationText}</span>
                                          <button 
                                            onClick={() => handleOpenEditProject(p)}
                                            className="p-1 hover:bg-gray-100 rounded text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Bar */}
                                      <div className="relative h-11 w-full bg-gray-50 rounded-xl overflow-hidden border border-gray-100/50">
                                        {(() => {
                                          const barPos = getProjectBarPosition(p);
                                          if (!barPos) {
                                            return (
                                              <div 
                                                className="absolute inset-0 flex items-center justify-center bg-gray-100/50 cursor-pointer text-gray-400 text-[10px] font-semibold"
                                                onClick={() => toggleProjectExpand(p.id)}
                                              >
                                                <span>อยู่นอกช่วงปฏิทิน ({p.startDate || getFallbackDateFromWeek(p.startWeek, 'start')} ถึง {p.endDate || getFallbackDateFromWeek(p.endWeek, 'end')})</span>
                                              </div>
                                            );
                                          }
                                          return (
                                            <>
                                              <div 
                                                className="absolute top-0 bottom-0 z-20 flex items-center px-4 rounded-xl cursor-pointer"
                                                style={{
                                                  left: `${barPos.leftPct}%`,
                                                  width: `${barPos.widthPct}%`,
                                                  backgroundColor: p.status === 'on-track' ? '#10b981' : p.status === 'at-risk' ? '#f59e0b' : '#ba1a1a'
                                                }}
                                                onClick={() => toggleProjectExpand(p.id)}
                                              >
                                                <span className="text-[10px] text-white font-extrabold truncate uppercase">{p.taskName} ({p.progress}%)</span>
                                              </div>
                                              <div 
                                                className="absolute top-0 bottom-0 z-10 rounded-xl opacity-20"
                                                style={{
                                                  left: `${barPos.leftPct}%`,
                                                  width: `${100 - barPos.leftPct}%`,
                                                  backgroundColor: p.status === 'on-track' ? '#10b981' : p.status === 'at-risk' ? '#f59e0b' : '#ba1a1a'
                                                }}
                                              ></div>
                                            </>
                                          );
                                        })()}
                                      </div>

                                      {/* Expanded Subtasks & Interactive Charts */}
                                      {expandedProjectIds.includes(p.id) && (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200/60 space-y-4 shadow-2xs">
                                          {/* Section Header */}
                                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/50 pb-2.5">
                                            <div className="flex items-center gap-1.5">
                                              <Sliders className="w-4 h-4 text-indigo-600 animate-pulse" />
                                              <span className="text-xs font-bold text-gray-800">เครื่องมือวิเคราะห์และปรับแต่งภารกิจย่อยในโครงการ</span>
                                            </div>
                                            <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full font-bold">
                                              เชื่อมโยงกับ ตารางตรวจเช็กภารกิจ (Task Checklist)
                                            </span>
                                          </div>

                                          {(() => {
                                            // Get all tasks of this project from checklist
                                            const projectTasks = tasks.filter(t => t.projectId === p.id || (!t.projectId && t.teamId === p.teamId));
                                            
                                            if (projectTasks.length === 0) {
                                              return (
                                                <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                                                  <ListTodo className="w-8 h-8 mb-1.5 stroke-1" />
                                                  <p className="text-xs">ไม่มีงานย่อยในโครงการนี้ที่เชื่อมโยงกับตารางตรวจเช็กภารกิจ</p>
                                                  <button 
                                                    onClick={() => {
                                                      const newT: Task = {
                                                        id: `task-${Date.now()}`,
                                                        title: `งานย่อยสืบเนื่องของ ${p.name}`,
                                                        dueDate: p.endDate || getFallbackDateFromWeek(p.endWeek, 'end'),
                                                        completed: false,
                                                        teamId: p.teamId,
                                                        startDate: p.startDate || getFallbackDateFromWeek(p.startWeek, 'start'),
                                                        projectId: p.id
                                                      };
                                                      setTasks(prev => [...prev, newT]);
                                                      addNotification(`สร้างงานใหม่เชื่อมโยงกับโครงการ "${p.name}" สำเร็จ`);
                                                    }}
                                                    className="text-xs text-indigo-600 font-bold mt-2 hover:underline cursor-pointer"
                                                  >
                                                    + สร้างภารกิจย่อยแรกสำหรับโครงการนี้
                                                  </button>
                                                </div>
                                              );
                                            }

                                            // Auto-select first task if none selected or if selected taskId is not in this project's tasks
                                            const currentSelectedId = selectedTaskIdByProj[p.id] || (projectTasks[0] ? projectTasks[0].id : '');
                                            const currentSelectedTask = projectTasks.find(t => t.id === currentSelectedId) || projectTasks[0];

                                            return (
                                              <div className="space-y-4">
                                                {/* Form Control with Dropdown Select & Task Panel */}
                                                <div className="bg-white p-4 rounded-xl border border-gray-150 space-y-4 shadow-3xs">
                                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                                    <div className="md:col-span-5">
                                                      <label className="text-[10px] font-bold text-gray-400 block mb-1.5 uppercase tracking-wider">
                                                        เลือกภารกิจเพื่อดูและปรับแต่ง (Dropdown):
                                                      </label>
                                                      <select
                                                        value={currentSelectedTask?.id || ''}
                                                        onChange={(e) => {
                                                          setSelectedTaskIdByProj(prev => ({
                                                            ...prev,
                                                            [p.id]: e.target.value
                                                          }));
                                                        }}
                                                        className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold rounded-lg px-2.5 py-2.5 text-black cursor-pointer shadow-3xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                      >
                                                        {projectTasks.map((t) => (
                                                          <option key={t.id} value={t.id}>
                                                            {t.title} {t.completed ? ' (เสร็จสิ้น)' : ' (กำลังทำ)'}
                                                          </option>
                                                        ))}
                                                      </select>
                                                    </div>

                                                    {currentSelectedTask && (
                                                      <div className="md:col-span-7 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 p-2.5 px-4 rounded-xl border border-gray-100">
                                                        <div className="flex items-center gap-2">
                                                          <span className="text-xs text-gray-400 font-medium">สถานะ:</span>
                                                          <button
                                                            onClick={() => handleToggleTask(currentSelectedTask.id, currentSelectedTask.title, currentSelectedTask.completed)}
                                                            className={`font-bold px-3 py-1 rounded-full text-[10px] transition-colors cursor-pointer ${
                                                              currentSelectedTask.completed ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                            }`}
                                                          >
                                                            {currentSelectedTask.completed ? 'เสร็จสมบูรณ์' : 'กำลังดำเนินการ'}
                                                          </button>
                                                        </div>

                                                        <div className="flex items-center gap-1.5">
                                                          <span className="text-[10px] text-gray-400 font-bold uppercase">ความก้าวหน้า:</span>
                                                          <div className="w-16 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                            <div className={`h-full ${currentSelectedTask.completed ? 'bg-emerald-500' : 'bg-indigo-500'} transition-all`} style={{ width: currentSelectedTask.completed ? '100%' : '30%' }}></div>
                                                          </div>
                                                          <span className={`text-[10px] font-bold ${currentSelectedTask.completed ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                                            {currentSelectedTask.completed ? '100%' : '30%'}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>

                                                  {currentSelectedTask && (
                                                    <div className="bg-gray-50/50 p-3.5 rounded-xl border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                                      <div className="flex justify-between sm:flex-col sm:gap-1">
                                                        <span className="text-gray-400 font-medium">วันเริ่มงาน:</span>
                                                        <span className="font-semibold text-gray-700">{currentSelectedTask.startDate ? formatShortThaiDate(currentSelectedTask.startDate) : 'ไม่ระบุ'}</span>
                                                      </div>
                                                      <div className="flex justify-between sm:flex-col sm:gap-1">
                                                        <span className="text-gray-400 font-medium">กำหนดส่ง:</span>
                                                        <span className="font-semibold text-gray-700">
                                                          {/^\d{4}-\d{2}-\d{2}$/.test(currentSelectedTask.dueDate) ? formatShortThaiDate(currentSelectedTask.dueDate) : currentSelectedTask.dueDate}
                                                        </span>
                                                      </div>
                                                      <div className="flex justify-between sm:flex-col sm:gap-1">
                                                        <span className="text-gray-400 font-medium">ผู้รับผิดชอบหลัก:</span>
                                                        <span className="font-semibold text-gray-700">
                                                          {currentSelectedTask.teamId === 'team-a' ? 'UI/UX (ทีม Design)' : currentSelectedTask.teamId === 'team-b' ? 'Dev (ทีม Development)' : 'Marketing (ทีมการตลาด)'}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })()}

                                          {/* Compact subtask timeline bar view */}
                                          <div className="pt-3 border-t border-gray-150 space-y-2">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                              <span>แถบระยะเวลากำหนดการจริงของงานย่อยตามแผนงานไทม์ไลน์</span>
                                            </div>
                                            <div className="space-y-2 pl-2">
                                              {(() => {
                                                const projectTasks = tasks.filter(t => t.projectId === p.id || (!t.projectId && t.teamId === p.teamId));
                                                return projectTasks.map((t) => {
                                                  const taskBarPos = getTaskBarPosition(t, p);
                                                  return (
                                                    <div key={t.id} className="grid grid-cols-12 items-center gap-3">
                                                      <span className="col-span-3 text-[10px] font-bold text-gray-600 truncate">{t.title}</span>
                                                      <div className="col-span-9 relative h-6 bg-gray-100 rounded-lg overflow-hidden border border-gray-200/50">
                                                        {taskBarPos ? (
                                                          <div 
                                                            className={`absolute top-0 bottom-0 z-20 flex items-center px-2 rounded-lg text-[8px] font-extrabold text-white transition-all ${
                                                              t.completed ? 'bg-emerald-500/80' : 'bg-indigo-500/80'
                                                            }`}
                                                            style={{
                                                              left: `${taskBarPos.leftPct}%`,
                                                              width: `${taskBarPos.widthPct}%`,
                                                            }}
                                                          >
                                                            <span className="truncate">{t.completed ? '✓ เสร็จสิ้นในตาราง' : '⏳ กำลังดำเนินการ'}</span>
                                                          </div>
                                                        ) : (
                                                          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-[8px] italic">
                                                            อยู่นอกช่วงปฏิทิน ({t.startDate ? formatShortThaiDate(t.startDate) : 'ไม่ระบุ'} ถึง {t.dueDate ? (/^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) ? formatShortThaiDate(t.dueDate) : t.dueDate) : 'ไม่ระบุ'})
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  );
                                                });
                                              })()}
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}

                        </div>

                      </div>
                    </div>

                  </div>

                  {/* LEGEND & STATUS SIDEBARS (Col-span 12 on mobile, 3 on desktop) */}
                  <div className="col-span-12 lg:col-span-3 space-y-6">
                    
                    {/* Legend card */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>คำอธิบายสถานะ</span>
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <span className="w-3 h-3 rounded-full bg-[#10b981] mt-1"></span>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-gray-800">ตามแผน (On Track)</p>
                            <p className="text-[10px] text-gray-400 font-medium">การดำเนินงานราบรื่นและเป็นไปตามแผนงาน</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="w-3 h-3 rounded-full bg-[#f59e0b] mt-1"></span>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-gray-800">มีความเสี่ยง (At Risk)</p>
                            <p className="text-[10px] text-gray-400 font-medium">อาจส่งงานล่าช้ากว่ากำหนด 3-5 วัน</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="w-3 h-3 rounded-full bg-[#ba1a1a] mt-1"></span>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-gray-800">ล่าช้า (Delayed)</p>
                            <p className="text-[10px] text-gray-400 font-medium">ต้องการกำลังคนแก้ไขด่วนในสัปดาห์นี้</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Milestone Sidebar */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                          <Flag className="w-3.5 h-3.5" />
                          <span>ไมล์สโตนสำคัญ</span>
                        </h4>
                        <button 
                          onClick={() => {
                            if (!formMileDate) {
                              setFormMileDate('2024-05-15');
                            }
                            setIsMilestoneModalOpen(true);
                          }}
                          className="text-[10px] text-blue-500 font-bold hover:underline cursor-pointer"
                        >
                          + เพิ่มเป้าหมาย
                        </button>
                      </div>

                      <div className="space-y-4 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                        {milestones.map((m) => {
                          const dateParts = getMileDateParts(m.date);
                          return (
                            <div key={m.id} className="flex gap-3 group relative items-start">
                              <div className="bg-[#eff4ff] p-2 rounded-xl h-fit border border-[#d5e3fd] text-center shrink-0 min-w-[50px]">
                                <p className="text-[10px] font-bold text-blue-800 leading-tight">
                                  {dateParts.day}<br/>
                                  <span className="text-[8px] font-medium text-gray-500">{dateParts.month}</span>
                                </p>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-gray-800 leading-snug">{m.title}</p>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">{m.description}</p>
                              </div>

                              <button 
                                onClick={() => handleDeleteMilestone(m.id, m.title)}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 absolute right-0 top-0 p-1 cursor-pointer"
                                title="ลบไมล์สโตน"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <button 
                        onClick={() => {
                          setSelectedTab('notifications');
                          addNotification('เปิดดูประวัติไมล์สโตนโครงการ');
                        }}
                        className="w-full mt-4 text-[#000000] bg-gray-50 hover:bg-gray-100 text-xs font-semibold py-2 rounded-xl transition-colors cursor-pointer border border-gray-200"
                      >
                        ดูประวัติไมล์สโตนทั้งหมด
                      </button>
                    </div>

                    {/* Team Performance Widget */}
                    <div className="bg-white text-black rounded-2xl p-5 shadow-xs border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold text-gray-500">ประสิทธิภาพทีมรวม</p>
                        <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                          <TrendingUp className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="text-3xl font-extrabold mb-1.5 flex items-baseline gap-1 text-gray-900">
                        <span>{teamPerformance}%</span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">งานเสร็จแล้ว {completedTasks}/{totalTasks} ภารกิจ</span>
                      </div>
                      
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${teamPerformance}%` }}
                        ></div>
                      </div>
                      
                      <div className="mt-4 flex gap-2 text-[10px] text-gray-500 font-medium leading-relaxed">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1 shrink-0"></div>
                        <p>คำนวณแบบเรียลไทม์จากจำนวนภารกิจที่ทำเครื่องหมายเสร็จสิ้นในตารางตรวจเช็กภารกิจ (Task Checklist)</p>
                      </div>
                    </div>

                    {/* Developer helper panel */}
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200/50 flex flex-col justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-amber-800 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" />
                          <span>ตัวช่วยพัฒนาโปรเจกต์</span>
                        </h5>
                        <p className="text-[10px] text-amber-700/80 mt-1 leading-normal">
                          คุณสามารถทดลองเพิ่มโครงการ, ติ๊กงาน, ปรับแต่งหรือลบข้อมูลโครงการเพื่อรีเฟรชสถิติของแผงควบคุมระบบได้ทันที
                        </p>
                      </div>
                      <button 
                        onClick={handleResetData}
                        className="mt-3 w-full py-1.5 bg-amber-600/10 text-amber-700 hover:bg-amber-600/20 text-[10px] font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-all"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>รีเซ็ตข้อมูลระบบเริ่มต้น</span>
                      </button>
                    </div>

                  </div>

                </div>
              </motion.div>
            )}

            {/* MEMBERS TAB */}
            {selectedTab === 'members' && (() => {
              const allGroups = Array.from(new Set([...teamGroups, ...members.map(m => m.team)]));
              return (
                <motion.div 
                  key="members"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-black flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span>โครงสร้างและรายชื่อสมาชิกในแต่ละทีม</span>
                      </h3>
                      <p className="text-xs text-gray-500">จัดการ เพิ่ม และจัดกลุ่มบุคลากรในแต่ละกลุ่มทีม/แผนก</p>
                    </div>
                    <button 
                      onClick={() => setIsMemberModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 bg-black text-white px-4 py-2.5 text-xs font-semibold rounded-xl hover:bg-gray-800 transition-all cursor-pointer shadow-xs w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>เพิ่มสมาชิกใหม่</span>
                    </button>
                  </div>

                  {/* Manage Team Groups Section */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        <span>จัดการกลุ่มทีม / แผนก</span>
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">เพิ่มกลุ่มทีมใหม่เพื่อให้สามารถจัดกลุ่มและกำหนดภาระงานของสมาชิกทีมได้แม่นยำขึ้น</p>
                    </div>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const trimmedName = newTeamGroupName.trim();
                        if (!trimmedName) return;
                        if (teamGroups.includes(trimmedName)) {
                          alert('มีกลุ่มทีมนี้อยู่แล้วในระบบ');
                          return;
                        }
                        setTeamGroups(prev => [...prev, trimmedName]);
                        addNotification(`เพิ่มกลุ่มทีมใหม่: "${trimmedName}"`);
                        setNewTeamGroupName('');
                      }}
                      className="flex items-center gap-2 w-full md:w-auto"
                    >
                      <input 
                        type="text" 
                        placeholder="เช่น Team D: QA & Support..." 
                        value={newTeamGroupName}
                        onChange={(e) => setNewTeamGroupName(e.target.value)}
                        required
                        className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-black focus:outline-none focus:border-blue-500 w-full md:w-64 focus:ring-1 focus:ring-blue-500"
                      />
                      <button 
                        type="submit"
                        className="flex items-center gap-1 bg-black text-white hover:bg-gray-800 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>เพิ่มกลุ่มทีม</span>
                      </button>
                    </form>
                  </div>

                  {/* Collapsible Groups / Dropdown Grid */}
                  <div className="space-y-4 pt-2">
                    {allGroups.map((group) => {
                      const groupMembers = members.filter(m => m.team === group);
                      const isExpanded = expandedGroups[group] !== false; // expanded by default
                      
                      return (
                        <div key={group} className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-xs">
                          {/* Accordion Trigger (The Dropdown bar!) */}
                          <div 
                            onClick={() => setExpandedGroups(prev => ({ ...prev, [group]: !isExpanded }))}
                            className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-all cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500 transition-transform" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500 transition-transform" />
                              )}
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-gray-800">{group}</span>
                                <span className="bg-blue-50 text-blue-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-blue-100">
                                  {groupMembers.length} คน
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              {group !== 'ไม่มีสังกัด' && (
                                <>
                                  {/* Rename Group Button */}
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingGroup(group);
                                      setEditingGroupNameVal(group);
                                    }}
                                    className="text-gray-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 transition-all cursor-pointer flex items-center justify-center"
                                    title="แก้ไขชื่อกลุ่มทีม"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Group Button */}
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const memberCount = groupMembers.length;
                                      const confirmMsg = memberCount > 0 
                                        ? `ต้องการลบกลุ่มทีม "${group}"? สมาชิกทั้งหมดในกลุ่มนี้ (${memberCount} คน) และงานที่รับผิดชอบจะถูกเปลี่ยนสังกัดเป็น "ไม่มีสังกัด"`
                                        : `ต้องการลบกลุ่มทีม "${group}"?`;
                                      
                                      setConfirmModal({
                                        isOpen: true,
                                        title: 'ยืนยันการลบกลุ่มทีม',
                                        message: confirmMsg,
                                        onConfirm: () => {
                                          // Remove from teamGroups
                                          setTeamGroups(prev => prev.filter(g => g !== group));
                                          
                                          // Update members
                                          setMembers(prev => prev.map(m => m.team === group ? { ...m, team: 'ไม่มีสังกัด' } : m));
                                          
                                          // Update projects
                                          setProjects(prev => prev.map(p => {
                                            let updated = { ...p };
                                            let isMatch = false;
                                            if (p.teamName === group) isMatch = true;
                                            if (p.teamId === group) isMatch = true;
                                            if (group === 'Team A: UI/UX Design' && p.teamId === 'team-a') isMatch = true;
                                            if (group === 'Team B: Development' && p.teamId === 'team-b') isMatch = true;
                                            if (group === 'Team C: Marketing' && p.teamId === 'team-c') isMatch = true;
                                            
                                            if (isMatch) {
                                              updated.teamName = 'ไม่มีสังกัด';
                                              updated.teamId = 'ไม่มีสังกัด';
                                            }
                                            return updated;
                                          }));
                                          
                                          // Update tasks
                                          setTasks(prev => prev.map(t => {
                                            let updated = { ...t };
                                            let isMatch = false;
                                            if (t.teamId === group) isMatch = true;
                                            if (group === 'Team A: UI/UX Design' && t.teamId === 'team-a') isMatch = true;
                                            if (group === 'Team B: Development' && t.teamId === 'team-b') isMatch = true;
                                            if (group === 'Team C: Marketing' && t.teamId === 'team-c') isMatch = true;
                                            
                                            if (isMatch) {
                                              updated.teamId = 'ไม่มีสังกัด';
                                            }
                                            return updated;
                                          }));
                                          
                                          addNotification(`ลบกลุ่มทีม "${group}" เรียบร้อยแล้ว`);
                                          setConfirmModal(null);
                                        }
                                      });
                                    }}
                                    className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center"
                                    title="ลบกลุ่มทีม"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              <span className="text-[11px] text-gray-400 font-medium ml-1">
                                {isExpanded ? 'ย่อกลุ่ม' : 'ขยายดูรายชื่อ'}
                              </span>
                            </div>
                          </div>

                          {/* Accordion Content */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15, ease: "easeInOut" }}
                              >
                                <div className="p-4 border-t border-gray-100 bg-white">
                                  {groupMembers.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-gray-400 font-medium">
                                      ยังไม่มีสมาชิกในทีมกลุ่มนี้ คลิกปุ่ม "เพิ่มสมาชิกใหม่" ด้านบน และเลือกสังกัดกลุ่มทีมนี้
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {groupMembers.map((m) => (
                                        <div 
                                          key={m.id} 
                                          className="p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-all flex items-center gap-4 bg-gray-50/20 group relative overflow-hidden"
                                        >
                                          <img 
                                            src={m.avatar} 
                                            alt={m.name} 
                                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs shrink-0" 
                                            referrerPolicy="no-referrer"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-800 truncate">{m.name}</p>
                                            <p className="text-xs text-blue-600 font-semibold truncate mt-0.5">{m.role}</p>
                                            <p className="text-[10px] text-gray-400 font-medium mt-1.5 bg-white border border-gray-100 px-2 py-0.5 rounded-full w-fit">
                                              {m.team}
                                            </p>
                                          </div>

                                          {/* Options controls shown on hover, always visible on mobile */}
                                          <div className="absolute right-3 top-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-white border border-gray-150 p-1 rounded-lg shadow-2xs">
                                            <button 
                                              onClick={() => setEditingMember(m)}
                                              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all cursor-pointer flex items-center justify-center"
                                              title="แก้ไขข้อมูลส่วนตัว"
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                              onClick={() => {
                                                setConfirmModal({
                                                  isOpen: true,
                                                  title: 'ยืนยันการลบสมาชิกทีม',
                                                  message: `ต้องการลบคุณ ${m.name} ออกจากฐานข้อมูลทีม?`,
                                                  onConfirm: () => {
                                                    setMembers(prev => prev.filter(mem => mem.id !== m.id));
                                                    addNotification(`ลบสมาชิก "${m.name}" ออกจากทีม`);
                                                    setConfirmModal(null);
                                                  }
                                                });
                                              }}
                                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all cursor-pointer"
                                              title="ลบสมาชิก"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })()}

            {/* TASKS CHECKLIST TAB */}
            {selectedTab === 'tasks' && (
              <motion.div 
                key="tasks"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                
                {/* Personal task form & stats (Col 4) */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-black">เครื่องมือจัดการงานย่อย</h3>
                    <p className="text-xs text-gray-400">สร้างงานหรือภารกิจส่วนตัวและแจกจ่ายงานให้แผนก{editingTask ? ' (กำลังแก้ไขข้อมูลงาน)' : ''}</p>
                  </div>

                  <form onSubmit={handleAddPersonalTask} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">หัวข้องานย่อย</label>
                      <input 
                        type="text" 
                        placeholder="เช่น จัดพิมพ์ร่างสัญญาความปลอดภัย..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        required
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">วันที่เริ่มงาน</label>
                        <input 
                          type="date" 
                          value={newTaskStartDate}
                          onChange={(e) => setNewTaskStartDate(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">โปรเจกต์ที่ทำ</label>
                        <select 
                          value={newTaskProjectId}
                          onChange={(e) => setNewTaskProjectId(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                        >
                          <option value="">-- ไม่ระบุโปรเจกต์ --</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.taskName})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">วันที่กำหนดส่ง</label>
                        <input 
                          type="date" 
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                          required
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-black cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">ผู้รับผิดชอบ</label>
                        <select 
                          value={newTaskTeam}
                          onChange={(e) => setNewTaskTeam(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none text-black cursor-pointer"
                        >
                          {teamGroups.map((g) => {
                            let val = g;
                            if (g === 'Team A: UI/UX Design') val = 'team-a';
                            else if (g === 'Team B: Development') val = 'team-b';
                            else if (g === 'Team C: Marketing') val = 'team-c';

                            let displayName = g;
                            if (g === 'Team A: UI/UX Design') displayName = 'ทีม Design';
                            else if (g === 'Team B: Development') displayName = 'ทีม Dev';
                            else if (g === 'Team C: Marketing') displayName = 'ทีม Marketing';

                            return (
                              <option key={g} value={val}>{displayName}</option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {editingTask && (
                        <button 
                          type="button"
                          onClick={handleCancelEditTask}
                          className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer transition-all border border-gray-200"
                        >
                          ยกเลิก
                        </button>
                      )}
                      <button 
                        type="submit"
                        className="flex-1 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
                      >
                        {editingTask ? 'บันทึกการแก้ไข' : 'สร้างงานและมอบหมาย'}
                      </button>
                    </div>
                  </form>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400">สำเร็จแล้ว</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {Math.round((tasks.filter(t => t.completed).length / (tasks.length || 1)) * 100)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-400">คงเหลือ</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {tasks.filter(t => !t.completed).length} / {tasks.length} งาน
                      </p>
                    </div>
                  </div>
                </div>

                {/* Task table list (Col 8) */}
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-black">ตารางตรวจเช็กภารกิจ (Task Checklist)</h3>
                      <p className="text-xs text-gray-500">คลิกที่ช่องกล่องเช็กบล็อกเพื่อทำเครื่องหมายบันทึกผลงาน</p>
                    </div>
                    <span className="text-xs text-blue-600 font-bold bg-[#eff4ff] px-2.5 py-1 rounded-full">
                      งานในเดือนนี้
                    </span>
                  </div>

                  <div className="space-y-3">
                    {tasks.map((t) => {
                      const isExpanded = expandedTaskIds.includes(t.id);
                      const matchedProj = t.projectId ? projects.find(p => p.id === t.projectId) : null;
                      return (
                        <div 
                          key={t.id} 
                          className={`rounded-xl border transition-all ${
                            t.completed ? 'bg-gray-50 border-gray-200/60 opacity-90' : 'bg-white border-gray-100 hover:border-gray-200 shadow-2xs'
                          } overflow-hidden`}
                        >
                          {/* Main Row */}
                          <div 
                            onClick={() => toggleTaskExpand(t.id)}
                            className="p-4 flex items-center justify-between cursor-pointer select-none gap-4"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => handleToggleTask(t.id, t.title, t.completed)}
                                className={`w-5.5 h-5.5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                  t.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-500'
                                }`}
                              >
                                {t.completed && <Check className="w-3.5 h-3.5" />}
                              </button>
                              
                              <div className="cursor-pointer flex-1 min-w-0" onClick={() => toggleTaskExpand(t.id)}>
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm font-semibold truncate ${t.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                    {t.title}
                                  </p>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 hover:text-gray-600" />
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-400 block truncate">
                                  ทีมรับผิดชอบ: {t.teamId === 'team-a' ? 'UI/UX Design' : t.teamId === 'team-b' ? 'Development' : t.teamId === 'team-c' ? 'Marketing' : t.teamId}
                                  {matchedProj ? ` • โปรเจกต์: ${matchedProj.name}` : ''}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {t.startDate && (
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md hidden sm:inline-block">
                                  เริ่ม: {formatShortThaiDate(t.startDate)}
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-md hidden sm:inline-block">
                                กำหนดส่ง: {/^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) ? formatShortThaiDate(t.dueDate) : t.dueDate}
                              </span>
                              
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!expandedTaskIds.includes(t.id)) {
                                    toggleTaskExpand(t.id);
                                  }
                                  setTimeout(() => {
                                    const inputEl = document.getElementById(`edit-task-title-${t.id}`) as HTMLInputElement | null;
                                    if (inputEl) {
                                      inputEl.focus();
                                      inputEl.select();
                                    }
                                  }, 150);
                                }}
                                className="text-gray-400 hover:text-blue-600 p-1 cursor-pointer transition-colors"
                                title="แก้ไขภารกิจนี้"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button 
                                onClick={() => {
                                  setTasks(prev => prev.filter(task => task.id !== t.id));
                                  addNotification(`ลบงานย่อย "${t.title}"`);
                                }}
                                className="text-gray-300 hover:text-red-500 p-1 cursor-pointer transition-colors"
                                title="ลบภารกิจนี้"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Dropdown Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-gray-100 bg-gray-50/50 px-4 py-3.5 text-xs text-gray-600 space-y-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="space-y-1">
                                  <label className="text-gray-400 font-medium block">หัวข้องานย่อย:</label>
                                  <input
                                    id={`edit-task-title-${t.id}`}
                                    type="text"
                                    value={t.title}
                                    onChange={(e) => updateTaskField(t.id, 'title', e.target.value)}
                                    placeholder="พิมพ์หัวข้องานย่อย..."
                                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-black shadow-2xs"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-gray-400 font-medium block">วันที่เริ่มงาน:</label>
                                    <input
                                      type="date"
                                      value={t.startDate || ''}
                                      onChange={(e) => updateTaskField(t.id, 'startDate', e.target.value)}
                                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-black cursor-pointer shadow-2xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-gray-400 font-medium block">วันที่กำหนดส่ง:</label>
                                    <input
                                      type="date"
                                      value={/^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) ? t.dueDate : ''}
                                      onChange={(e) => updateTaskField(t.id, 'dueDate', e.target.value)}
                                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-black cursor-pointer shadow-2xs"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-gray-400 font-medium block">โปรเจกต์ที่ทำ:</label>
                                    <select
                                      value={t.projectId || ''}
                                      onChange={(e) => updateTaskField(t.id, 'projectId', e.target.value)}
                                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-black cursor-pointer shadow-2xs"
                                    >
                                      <option value="">-- ไม่ระบุโปรเจกต์ --</option>
                                      {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-gray-400 font-medium block">ทีมรับผิดชอบหลัก:</label>
                                    <select
                                      value={t.teamId}
                                      onChange={(e) => updateTaskField(t.id, 'teamId', e.target.value)}
                                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none text-black cursor-pointer shadow-2xs"
                                    >
                                      {teamGroups.map((g) => {
                                        let val = g;
                                        if (g === 'Team A: UI/UX Design') val = 'team-a';
                                        else if (g === 'Team B: Development') val = 'team-b';
                                        else if (g === 'Team C: Marketing') val = 'team-c';

                                        return (
                                          <option key={g} value={val}>{g}</option>
                                        );
                                      })}
                                    </select>
                                  </div>
                                </div>

                                <div className="pt-2.5 border-t border-gray-100/50 flex justify-between items-center text-[11px]">
                                  <span className="text-gray-400 font-medium">สถานะความคืบหน้า:</span>
                                  <button
                                    onClick={() => handleToggleTask(t.id, t.title, t.completed)}
                                    className={`font-bold px-3 py-1 rounded-full text-[10px] transition-colors cursor-pointer ${
                                      t.completed ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                    }`}
                                  >
                                    {t.completed ? 'เสร็จสิ้นแล้ว (คลิกเพื่อแก้ไขเป็นทำต่อ)' : 'กำลังดำเนินการ (คลิกเพื่อให้เสร็จ)'}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </motion.div>
            )}

            {/* NOTIFICATIONS HISTORY TAB */}
            {selectedTab === 'notifications' && (() => {
              // Categorization helper inside the render context
              const getNotificationCategory = (n: string) => {
                const lower = n.toLowerCase();

                // 1. Exact project name matches
                for (const p of projects) {
                  if (lower.includes(p.name.toLowerCase())) {
                    return p.status; // 'on-track' | 'at-risk' | 'delayed'
                  }
                }

                // 2. Keyword check for 'ล่าช้า' or 'วิกฤต' or 'ลบ' or 'delay'
                if (lower.includes('ล่าช้า') || lower.includes('วิกฤต') || lower.includes('delay') || lower.includes('delayed')) {
                  return 'delayed';
                }

                // 3. Keyword check for 'เสี่ยง' or 'at-risk' or ' risk' or 'คำเตือน' or 'ตรวจพบ'
                if (lower.includes('เสี่ยง') || lower.includes('at-risk') || lower.includes('risk') || lower.includes('เตือน') || lower.includes('ตรวจพบ')) {
                  return 'at-risk';
                }

                // 4. Keyword check for 'ตามแผน' or 'สำเร็จ' or 'เสร็จสิ้น' or 'เรียบร้อย' or 'สร้างงานใหม่' or 'เพิ่มโปรเจกต์' or 'on-track'
                if (
                  lower.includes('ตามแผน') || 
                  lower.includes('สำเร็จ') || 
                  lower.includes('เสร็จสิ้น') || 
                  lower.includes('เรียบร้อย') || 
                  lower.includes('สร้างงาน') || 
                  lower.includes('เพิ่ม') || 
                  lower.includes('on-track') ||
                  lower.includes('เข้าสู่ระบบ')
                ) {
                  return 'on-track';
                }

                return 'general';
              };

              // Categorize the notifications
              const categorized = {
                'on-track': [] as { text: string; originalIndex: number }[],
                'at-risk': [] as { text: string; originalIndex: number }[],
                'delayed': [] as { text: string; originalIndex: number }[],
                'general': [] as { text: string; originalIndex: number }[],
              };

              notifications.forEach((n, idx) => {
                const cat = getNotificationCategory(n);
                if (cat in categorized) {
                  categorized[cat as keyof typeof categorized].push({ text: n, originalIndex: idx });
                } else {
                  categorized['general'].push({ text: n, originalIndex: idx });
                }
              });

              const filteredNotifications = notificationFilter === 'all'
                ? notifications.map((n, idx) => ({ text: n, category: getNotificationCategory(n), originalIndex: idx }))
                : (categorized[notificationFilter] || []).map(item => ({ text: item.text, category: notificationFilter, originalIndex: item.originalIndex }));

              // Categorization stats & configurations
              const categoriesMeta = [
                { id: 'all', title: 'ทั้งหมด', count: notifications.length, colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-100 ring-indigo-500/20' },
                { id: 'on-track', title: 'ตามแผน (On Track)', count: categorized['on-track'].length, colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-100 ring-emerald-500/20', dot: 'bg-emerald-500', desc: 'การดำเนินงานราบรื่นและเป็นไปตามแผนงาน' },
                { id: 'at-risk', title: 'มีความเสี่ยง (At Risk)', count: categorized['at-risk'].length, colorClass: 'bg-amber-50 text-amber-700 border-amber-100 ring-amber-500/20', dot: 'bg-amber-500', desc: 'อาจส่งงานล่าช้ากว่ากำหนด 3-5 วัน' },
                { id: 'delayed', title: 'ล่าช้า (Delayed)', count: categorized['delayed'].length, colorClass: 'bg-red-50 text-red-700 border-red-100 ring-red-500/20', dot: 'bg-red-500', desc: 'ต้องการกำลังคนแก้ไขด่วนในสัปดาห์นี้' },
                { id: 'general', title: 'ข้อมูลทั่วไป', count: categorized['general'].length, colorClass: 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/20', dot: 'bg-slate-400', desc: 'ข้อมูลทั่วไปและการทำงานของระบบบริหารไทม์ไลน์กลาง' }
              ];

              const activeMeta = categoriesMeta.find(c => c.id === notificationFilter);

              return (
                <motion.div 
                  key="notifications"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-black">ประวัติบันทึกระบบและแจ้งเตือน</h3>
                      <p className="text-xs text-gray-500">กิจกรรมที่บันทึกโดยเจ้าหน้าที่และระบบบริหารไทม์ไลน์กลาง จัดหมวดหมู่ตามสถานะการดำเนินงานของงานและโครงการ</p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setNotifications([]);
                        addNotification('ล้างประวัติบันทึกระบบทั้งหมดแล้ว');
                      }}
                      className="text-xs text-red-500 font-bold hover:underline cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      ล้างบันทึกทั้งหมด
                    </button>
                  </div>

                  {/* Categories Tabs Filter */}
                  <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
                    {categoriesMeta.map((cat) => {
                      const isActive = notificationFilter === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setNotificationFilter(cat.id as any)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                            isActive
                              ? `${cat.colorClass} border-transparent ring-2`
                              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-800'
                          }`}
                        >
                          {cat.dot && <span className={`w-2 h-2 rounded-full ${cat.dot}`} />}
                          <span>{cat.title}</span>
                          <span className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-md ${isActive ? 'bg-white/80' : 'bg-gray-100 text-gray-600'}`}>
                            {cat.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Category Status Description Banner */}
                  {activeMeta && activeMeta.desc && (
                    <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${activeMeta.colorClass}`}>
                      <Info className="w-4 h-4 shrink-0" />
                      <div>
                        <span className="font-bold">{activeMeta.title}: </span>
                        <span>{activeMeta.desc}</span>
                      </div>
                    </div>
                  )}

                  {/* Notifications List */}
                  <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                      <div className="py-12 text-center flex flex-col items-center justify-center text-gray-400 space-y-2">
                        <Bell className="w-10 h-10 stroke-[1.5]" />
                        <p className="text-sm font-semibold">ไม่มีการแจ้งเตือนงานในหมวดหมู่นี้</p>
                        <p className="text-xs">ประวัติและข้อมูลมีความปลอดภัยอย่างสมบูรณ์</p>
                      </div>
                    ) : (
                      filteredNotifications.map((n, idx) => {
                        let icon = <Clock className="w-4 h-4" />;
                        let iconBg = 'bg-slate-50 text-slate-500 border border-slate-100';
                        let badgeText = 'ข้อมูลทั่วไป';
                        let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';

                        if (n.category === 'on-track') {
                          icon = <CheckCircle className="w-4 h-4" />;
                          iconBg = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                          badgeText = 'ตามแผน (On Track)';
                          badgeColor = 'bg-emerald-50/80 text-emerald-700 border-emerald-100';
                        } else if (n.category === 'at-risk') {
                          icon = <AlertTriangle className="w-4 h-4" />;
                          iconBg = 'bg-amber-50 text-amber-600 border border-amber-100';
                          badgeText = 'มีความเสี่ยง (At Risk)';
                          badgeColor = 'bg-amber-50/80 text-amber-700 border-amber-100';
                        } else if (n.category === 'delayed') {
                          icon = <AlertTriangle className="w-4 h-4" />;
                          iconBg = 'bg-red-50 text-red-600 border border-red-100';
                          badgeText = 'ล่าช้า (Delayed)';
                          badgeColor = 'bg-red-50/80 text-red-700 border-red-100';
                        }

                        return (
                          <motion.div 
                            key={`${n.originalIndex}-${idx}`} 
                            layoutId={`noti-${n.originalIndex}`}
                            className="p-4 bg-gray-50/60 hover:bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-4 transition-colors"
                          >
                            <div className={`p-2 rounded-xl shrink-0 ${iconBg}`}>
                              {icon}
                            </div>
                            <div className="flex-1 space-y-1.5 text-left">
                              <p className="text-sm font-semibold text-gray-800 leading-normal">{n.text}</p>
                              
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${badgeColor}`}>
                                  {badgeText}
                                </span>
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                  ระบบ TaskTracker Core Service • ตรวจสอบแล้ว
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              );
            })()}

            {/* SETTINGS TAB */}
            {selectedTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs max-w-2xl mx-auto space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-black">ตั้งค่าบัญชีและระบบแผงควบคุม</h3>
                  <p className="text-xs text-gray-500">ปรับแต่งชื่อผู้จัดการ อวาตาร์ และข้อมูลเริ่มต้นขององค์กร</p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="relative group shrink-0">
                      <img 
                        src={profile.avatar} 
                        alt={profile.name} 
                        className="w-20 h-20 rounded-full object-cover border-2 border-emerald-400 shadow-md group-hover:opacity-90 transition-all duration-300" 
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 pointer-events-none">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-center sm:text-left flex-1 w-full">
                      <p className="text-sm font-bold text-gray-800">รูปภาพประจำตัว (Profile Picture)</p>
                      
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleProfileImageUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => document.getElementById('avatar-upload-input')?.click()}
                        className={`border-2 border-dashed rounded-xl p-4 transition-all duration-300 text-center cursor-pointer flex flex-col items-center justify-center gap-2 ${
                          isDragging 
                            ? 'border-indigo-500 bg-indigo-500/10' 
                            : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-100/5'
                        }`}
                      >
                        <input
                          type="file"
                          id="avatar-upload-input"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleProfileImageUpload(e.target.files[0]);
                            }
                          }}
                        />
                        <Upload className="w-5 h-5 text-gray-400" />
                        <div className="text-xs">
                          <span className="text-indigo-400 font-bold hover:underline">คลิกเพื่อเลือกไฟล์</span> หรือลากไฟล์มาวางที่นี่
                        </div>
                        <p className="text-[10px] text-gray-400">รองรับ PNG, JPG, WEBP ขนาดไม่เกิน 2MB</p>
                      </div>

                      {uploadError && (
                        <p className="text-[11px] text-red-500 font-bold">{uploadError}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">ชื่อผู้ใช้งาน</label>
                      <input 
                        type="text" 
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">ตำแหน่งหน้าที่</label>
                      <input 
                        type="text" 
                        value={profile.role}
                        onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">ที่อยู่อีเมลอวาตาร์ URL</label>
                    <input 
                      type="text" 
                      value={profile.avatar}
                      onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-150">
                    <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                      {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                      <span>การตั้งค่าธีมสีระบบ (System Color Theme)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          theme === 'light'
                            ? 'bg-[#d5e3fd] text-[#0d1c2f] shadow-xs'
                            : 'bg-transparent border-gray-200 text-gray-400 hover:bg-gray-100/5 hover:text-gray-200'
                        }`}
                      >
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span>โหมดสว่าง (Light Mode)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-[#d5e3fd] text-[#0d1c2f] shadow-xs'
                            : 'bg-transparent border-gray-200 text-gray-400 hover:bg-gray-100/5 hover:text-gray-200'
                        }`}
                      >
                        <Moon className="w-4 h-4 text-indigo-400" />
                        <span>โหมดมืด (Dark Mode)</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end">
                    <button 
                      onClick={() => {
                        setSelectedTab('overview');
                        addNotification('บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว');
                      }}
                      className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer"
                    >
                      บันทึกข้อมูล
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* BOTTOM MONTHLY PROGRESS NOTIFICATION BANNER */}
          <AnimatePresence>
            {showNotificationBanner && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="bg-white border-l-4 border-[#10b981] p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-[#10b981] shrink-0">
                    <CheckCircle className="w-5 h-5 fill-emerald-100" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">สรุปผลโปรเจกต์รายเดือน</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      โปรเจกต์ TaskTracker เสร็จสิ้นเร็วยิ่งกว่ากำหนดที่คาดไว้ 2 วัน ขอขอบคุณทีมพัฒนาทุกคนที่ร่วมแรงร่วมใจ!
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => {
                      setShowNotificationBanner(false);
                      addNotification('รับทราบการสรุปผลสรุปโปรเจกต์รายเดือน พฤษภาคม 2024');
                    }}
                    className="px-4 py-2 bg-[#eff4ff] hover:bg-gray-100 text-black text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    รับทราบ
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Banner restoration trigger */}
          {!showNotificationBanner && (
            <div className="flex justify-center">
              <button 
                onClick={() => setShowNotificationBanner(true)}
                className="text-[10px] text-gray-400 hover:text-gray-600 bg-gray-100/50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-all cursor-pointer"
              >
                แสดงกล่องแจ้งเตือนความคืบหน้าโปรเจกต์อีกครั้ง
              </button>
            </div>
          )}

        </div>
      </div>

      {/* PROJECT DIALOG MODAL (ADD & EDIT) */}
      <AnimatePresence>
        {isProjectModalOpen && (
          <div className="fixed inset-0 bg-[#0d1c2f]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-gray-200 shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="text-sm font-bold text-black flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-emerald-500" />
                  <span>{editingProject ? 'แก้ไขข้อมูลโครงการ' : 'เพิ่มโครงการย่อยใหม่'}</span>
                </h3>
                <button onClick={() => setIsProjectModalOpen(false)} className="text-gray-400 hover:text-black p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitProject} className="p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar max-h-[80vh]">
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ชื่อโครงการ (Project Name)</label>
                  <input 
                    type="text" 
                    placeholder="เช่น TaskTracker Revamp, API Patch"
                    value={formProjName}
                    onChange={(e) => setFormProjName(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">ชื่องานย่อย (Task/Phase Name)</label>
                    <input 
                      type="text" 
                      placeholder="เช่น Development Phase, Security Audit"
                      value={formTaskName}
                      onChange={(e) => setFormTaskName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">ทีมรับผิดชอบหลัก</label>
                    <select 
                      value={formTeamId}
                      onChange={(e) => setFormTeamId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none text-black cursor-pointer"
                    >
                      {teamGroups.map((g) => {
                        let val = g;
                        if (g === 'Team A: UI/UX Design') val = 'team-a';
                        else if (g === 'Team B: Development') val = 'team-b';
                        else if (g === 'Team C: Marketing') val = 'team-c';

                        return (
                          <option key={g} value={val}>{g}</option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">สถานะโครงการ</label>
                    <select 
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none"
                    >
                      <option value="on-track">ตามแผน (On Track)</option>
                      <option value="at-risk">มีความเสี่ยง (At Risk)</option>
                      <option value="delayed">ล่าช้า (Delayed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">ความคืบหน้า (%)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100"
                      value={formProgress}
                      onChange={(e) => setFormProgress(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">วันที่เริ่มต้นโครงการ (Start Date)</label>
                    <input 
                      type="date" 
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">วันที่สิ้นสุดโครงการ (End Date)</label>
                    <input 
                      type="date" 
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    ข้อความกำกับระยะเวลา (เว้นว่างไว้เพื่อให้ระบบวิเคราะห์สถานะและคำนวณอัตโนมัติ)
                  </label>
                  <input 
                    type="text" 
                    placeholder="ตัวอย่างเช่น 85% สำเร็จ, 42% ล่าช้าเล็กน้อย"
                    value={formDurationText}
                    onChange={(e) => setFormDurationText(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">รายละเอียดโครงการเพิ่มเติม</label>
                  <textarea 
                    rows={3}
                    placeholder="อธิบายสรุปรายละเอียดความก้าวหน้าโครงการย่อย..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                  {editingProject ? (
                    <button 
                      type="button"
                      onClick={() => handleDeleteProject(editingProject.id, editingProject.name)}
                      className="px-4 py-2 text-red-500 hover:bg-red-50 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบโปรเจกต์</span>
                    </button>
                  ) : <div />}

                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setIsProjectModalOpen(false)}
                      className="px-4 py-2 text-gray-500 hover:bg-gray-100 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      {editingProject ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มโครงการ'}
                    </button>
                  </div>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MILESTONE CREATION DIALOG */}
      <AnimatePresence>
        {isMilestoneModalOpen && (
          <div className="fixed inset-0 bg-[#0d1c2f]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-gray-200 shadow-2xl"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="text-sm font-bold text-black flex items-center gap-1.5">
                  <Flag className="w-4 h-4 text-amber-500" />
                  <span>เพิ่มเป้าหมายไมล์สโตนสำคัญ</span>
                </h3>
                <button onClick={() => setIsMilestoneModalOpen(false)} className="text-gray-400 hover:text-black">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitMilestone} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">หัวข้อเป้าหมาย</label>
                  <input 
                    type="text" 
                    placeholder="เช่น Beta Launch, Code Handover"
                    value={formMileTitle}
                    onChange={(e) => setFormMileTitle(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">เลือกวันที่เป้าหมาย</label>
                    <input 
                      type="date" 
                      value={formMileDate}
                      onChange={(e) => setFormMileDate(e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-pointer text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">คำอธิบายและแนวทางสั้นๆ</label>
                  <textarea 
                    rows={2}
                    placeholder="เขียนระบุแนวทางงานสำคัญในเป้าหมายนี้..."
                    value={formMileDesc}
                    onChange={(e) => setFormMileDesc(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsMilestoneModalOpen(false)}
                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    เพิ่มไมล์สโตน
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MEMBER CREATION DIALOG */}
      <AnimatePresence>
        {isMemberModalOpen && (
          <div className="fixed inset-0 bg-[#0d1c2f]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-gray-200 shadow-2xl"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="text-sm font-bold text-black flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>เพิ่มบุคลากรลงในฐานข้อมูลทีม</span>
                </h3>
                <button 
                  onClick={() => {
                    setIsMemberModalOpen(false);
                    setNewMemberAvatar('');
                  }} 
                  className="text-gray-400 hover:text-black cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  const name = target.elements.name.value;
                  const role = target.elements.role.value;
                  const team = target.elements.team.value;
                  const avatar = newMemberAvatar || target.elements.avatar.value || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';

                  if (!name.trim()) return;

                  const newMem: TeamMember = {
                    id: `mem-${Date.now()}`,
                    name,
                    role,
                    avatar,
                    team
                  };

                  setMembers(prev => [...prev, newMem]);
                  addNotification(`เพิ่มคุณ ${name} เป็น ${role} เรียบร้อยแล้ว`);
                  setIsMemberModalOpen(false);
                  setNewMemberAvatar('');
                }} 
                className="p-5 space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ชื่อ-นามสกุลจริง</label>
                  <input 
                    name="name"
                    type="text" 
                    placeholder="เช่น สมชาย มีความเพียร"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-black focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ตำแหน่งความเชี่ยวชาญ (Role)</label>
                  <input 
                    name="role"
                    type="text" 
                    placeholder="เช่น Senior Web Developer"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-black focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ระบุสังกัดทีม (Team Group)</label>
                  <select 
                    name="team"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none text-black focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ไม่มีสังกัด">ไม่มีสังกัด (Unassigned)</option>
                    {teamGroups.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-500">รูปภาพโปรไฟล์ (อวาตาร์)</label>
                  <div className="flex items-center gap-4">
                    <img 
                      src={newMemberAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'} 
                      alt="Avatar Preview" 
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs bg-gray-100 shrink-0" 
                    />
                    <div className="flex-1 space-y-1">
                      <label className="flex items-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border border-blue-100 w-fit">
                        <Upload className="w-3.5 h-3.5" />
                        <span>อัปโหลดรูปภาพ</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                alert('ขนาดรูปภาพต้องไม่เกิน 2MB');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewMemberAvatar(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <p className="text-[9px] text-gray-400">รองรับ PNG, JPG, WEBP (ไม่เกิน 2MB)</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">หรือป้อนลิงก์รูปภาพ (Image URL)</label>
                    <input 
                      name="avatar"
                      type="text" 
                      placeholder="https://example.com/image.jpg"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none text-black focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsMemberModalOpen(false);
                      setNewMemberAvatar('');
                    }}
                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    ตกลงยืนยัน
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MEMBER EDIT DIALOG */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 bg-[#0d1c2f]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-gray-200 shadow-2xl"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="text-sm font-bold text-black flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4 text-blue-500" />
                  <span>แก้ไขข้อมูลส่วนตัวสมาชิก</span>
                </h3>
                <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-black cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editingMember.name.trim()) return;

                  setMembers(prev => prev.map(m => m.id === editingMember.id ? editingMember : m));
                  addNotification(`แก้ไขข้อมูลของคุณ ${editingMember.name} เรียบร้อยแล้ว`);
                  setEditingMember(null);
                }} 
                className="p-5 space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ชื่อ-นามสกุลจริง</label>
                  <input 
                    type="text" 
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-black focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ตำแหน่งความเชี่ยวชาญ (Role)</label>
                  <input 
                    type="text" 
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-black focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ระบุสังกัดทีม (Team Group)</label>
                  <select 
                    value={editingMember.team}
                    onChange={(e) => setEditingMember({ ...editingMember, team: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none text-black focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ไม่มีสังกัด">ไม่มีสังกัด (Unassigned)</option>
                    {teamGroups.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-500">รูปภาพโปรไฟล์ (อวาตาร์)</label>
                  <div className="flex items-center gap-4">
                    <img 
                      src={editingMember.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'} 
                      alt="Avatar Preview" 
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs bg-gray-100 shrink-0" 
                    />
                    <div className="flex-1 space-y-1">
                      <label className="flex items-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border border-blue-100 w-fit">
                        <Upload className="w-3.5 h-3.5" />
                        <span>อัปโหลดรูปภาพ</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                alert('ขนาดรูปภาพต้องไม่เกิน 2MB');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditingMember({ ...editingMember, avatar: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <p className="text-[9px] text-gray-400">รองรับ PNG, JPG, WEBP (ไม่เกิน 2MB)</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">หรือป้อนลิงก์รูปภาพ (Image URL)</label>
                    <input 
                      type="text" 
                      value={editingMember.avatar}
                      onChange={(e) => setEditingMember({ ...editingMember, avatar: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none text-black focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setEditingMember(null)}
                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    บันทึกข้อมูล
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TEAM GROUP EDIT DIALOG */}
      <AnimatePresence>
        {editingGroup && (
          <div className="fixed inset-0 bg-[#0d1c2f]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-gray-200 shadow-2xl"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="text-sm font-bold text-black flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4 text-blue-500" />
                  <span>แก้ไขชื่อกลุ่มทีม</span>
                </h3>
                <button onClick={() => setEditingGroup(null)} className="text-gray-400 hover:text-black cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const oldName = editingGroup;
                  const newName = editingGroupNameVal.trim();
                  if (!newName) return;
                  if (newName === oldName) {
                    setEditingGroup(null);
                    return;
                  }
                  if (teamGroups.includes(newName)) {
                    alert('มีกลุ่มทีมชื่อนี้อยู่แล้วในระบบ');
                    return;
                  }

                  // Update teamGroups list
                  setTeamGroups(prev => prev.map(g => g === oldName ? newName : g));

                  // Update members
                  setMembers(prev => prev.map(m => m.team === oldName ? { ...m, team: newName } : m));

                  // Update projects
                  setProjects(prev => prev.map(p => {
                    let updated = { ...p };
                    let isMatch = false;
                    if (p.teamName === oldName) isMatch = true;
                    if (p.teamId === oldName) isMatch = true;
                    if (oldName === 'Team A: UI/UX Design' && p.teamId === 'team-a') isMatch = true;
                    if (oldName === 'Team B: Development' && p.teamId === 'team-b') isMatch = true;
                    if (oldName === 'Team C: Marketing' && p.teamId === 'team-c') isMatch = true;
                    
                    if (isMatch) {
                      updated.teamName = newName;
                      updated.teamId = newName;
                    }
                    return updated;
                  }));

                  // Update tasks
                  setTasks(prev => prev.map(t => {
                    let updated = { ...t };
                    let isMatch = false;
                    if (t.teamId === oldName) isMatch = true;
                    if (oldName === 'Team A: UI/UX Design' && t.teamId === 'team-a') isMatch = true;
                    if (oldName === 'Team B: Development' && t.teamId === 'team-b') isMatch = true;
                    if (oldName === 'Team C: Marketing' && t.teamId === 'team-c') isMatch = true;
                    
                    if (isMatch) {
                      updated.teamId = newName;
                    }
                    return updated;
                  }));

                  addNotification(`เปลี่ยนชื่อกลุ่มทีมจาก "${oldName}" เป็น "${newName}"`);
                  setEditingGroup(null);
                }} 
                className="p-5 space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ชื่อกลุ่มทีมเดิม</label>
                  <p className="text-sm text-gray-700 bg-gray-100 px-4 py-2.5 rounded-xl font-medium">{editingGroup}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ชื่อกลุ่มทีมใหม่</label>
                  <input 
                    type="text" 
                    value={editingGroupNameVal}
                    onChange={(e) => setEditingGroupNameVal(e.target.value)}
                    required
                    placeholder="ป้อนชื่อกลุ่มทีมใหม่..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-black focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setEditingGroup(null)}
                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    บันทึกการเปลี่ยนชื่อ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {confirmModal && confirmModal.isOpen && (
          <div className="fixed inset-0 bg-[#0d1c2f]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-gray-200 shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="text-sm font-bold text-black flex items-center gap-1.5">
                  <span className="text-amber-500 font-extrabold text-lg">⚠️</span>
                  <span>{confirmModal.title}</span>
                </h3>
                <button onClick={() => setConfirmModal(null)} className="text-gray-400 hover:text-black p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                  {confirmModal.message}
                </p>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setConfirmModal(null)}
                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      confirmModal.onConfirm();
                    }}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    ยืนยัน
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
