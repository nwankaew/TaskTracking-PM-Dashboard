import { Project, Milestone, TeamMember, Task } from './types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p-1',
    name: 'TaskTracker Revamp',
    teamId: 'team-b',
    teamName: 'Team B: Development',
    status: 'on-track',
    progress: 85,
    durationText: '85% สำเร็จ',
    startWeek: 1,
    endWeek: 6,
    taskName: 'Development Phase',
    description: 'ปรับปรุงอินเตอร์เฟสและฟังก์ชันหลักของโปรเจกต์ TaskTracker ให้มีประสิทธิภาพสูงขึ้นด้วย React และ Tailwind CSS'
  },
  {
    id: 'p-2',
    name: 'API Security Patch',
    teamId: 'team-b',
    teamName: 'Team B: Development',
    status: 'delayed',
    progress: 15,
    durationText: '15% วิกฤต',
    startWeek: 4,
    endWeek: 5,
    taskName: 'Security Audit',
    description: 'ตรวจสอบความปลอดภัย ตรวจจับช่องโหว่ของ API และเขียนแพตช์อัปเกรดระบบยืนยันตัวตน'
  },
  {
    id: 'p-3',
    name: 'UI Design System v2',
    teamId: 'team-a',
    teamName: 'Team A: UI/UX Design',
    status: 'at-risk',
    progress: 42,
    durationText: '42% ล่าช้าเล็กน้อย',
    startWeek: 2,
    endWeek: 5,
    taskName: 'Component Audit',
    description: 'รวบรวมคอมโพเนนต์การออกแบบ จัดทำเอกสารดีไซน์ซิสเต็มเวอร์ชันที่ 2 เพื่อส่งต่อทีม Dev'
  },
  {
    id: 'p-4',
    name: 'Marketing Automation',
    teamId: 'team-c',
    teamName: 'Team C: Marketing',
    status: 'on-track',
    progress: 60,
    durationText: '60% ตามแผน',
    startWeek: 1,
    endWeek: 5,
    taskName: 'Email Campaign Setups',
    description: 'จัดทำระบบอีเมลแคมเปญและการเข้าถึงเป้าหมายแบบอัตโนมัติประจำเดือน พฤษภาคม'
  }
];

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'm-1',
    date: '2024-05-15',
    title: 'Beta Release',
    description: 'ปล่อยเวอร์ชันทดสอบแรกสำหรับกลุ่มลูกค้าภายในและพาร์ตเนอร์',
    weekPosition: 3
  },
  {
    id: 'm-2',
    date: '2024-05-22',
    title: 'UI Handover',
    description: 'ส่งมอบชิ้นงานการออกแบบทั้งหมดจากทีมดีไซน์ไปยังทีมนักพัฒนา',
    weekPosition: 4
  }
];

export const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: 'mem-1',
    name: 'อัครเดช สมบูรณ์',
    role: 'Project Manager',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    team: 'Management'
  },
  {
    id: 'mem-2',
    name: 'กิตติพงษ์ แก้วดี',
    role: 'Senior Backend Developer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    team: 'Team B: Development'
  },
  {
    id: 'mem-3',
    name: 'ณิชารีย์ มีชัย',
    role: 'UI/UX Designer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    team: 'Team A: UI/UX Design'
  },
  {
    id: 'mem-4',
    name: 'ธนพล สินทรัพย์',
    role: 'Frontend Developer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    team: 'Team B: Development'
  },
  {
    id: 'mem-5',
    name: 'วรรณิศา คุ้มวงศ์',
    role: 'Marketing Executive',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    team: 'Team C: Marketing'
  }
];

export const INITIAL_TASKS: Task[] = [
  { id: 't-1', title: 'อัปเดตระบบสิทธิ์การเข้าใช้งานฐานข้อมูล', dueDate: '10 พ.ค.', completed: true, teamId: 'team-b' },
  { id: 't-2', title: 'ออกแบบหน้าจอสร้างโปรเจกต์ใหม่', dueDate: '12 พ.ค.', completed: true, teamId: 'team-a' },
  { id: 't-3', title: 'ตรวจสอบโค้ด API ป้องกัน SQL Injection', dueDate: '18 พ.ค.', completed: false, teamId: 'team-b' },
  { id: 't-4', title: 'เตรียมสไลด์นำเสนอแผนแคมเปญการตลาด', dueDate: '20 พ.ค.', completed: false, teamId: 'team-c' },
  { id: 't-5', title: 'ทดสอบระบบจำลองบนเวอร์ชันเบต้า', dueDate: '25 พ.ค.', completed: false, teamId: 'team-b' }
];

export const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม'
];
