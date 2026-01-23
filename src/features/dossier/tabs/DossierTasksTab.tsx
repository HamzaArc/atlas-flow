import { useState } from 'react';
import { 
  CheckSquare, AlertCircle, Clock, Plus, 
  Search, Filter, Trash2, Edit2, Check, AlertTriangle
} from "lucide-react";
import { useDossierStore } from "@/store/useDossierStore";
import { DossierTask, TaskCategory, TaskPriority } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES: TaskCategory[] = ['General', 'Booking', 'Documents', 'Customs', 'Transport', 'Finance'];

export const DossierTasksTab = () => {
  const { dossier, addTask, toggleTask, updateDossier } = useDossierStore();
  const [filter, setFilter] = useState<'all' | 'critical' | 'completed'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<DossierTask>>({});

  // Stats
  const tasks = dossier.tasks || [];
  const completedCount = tasks.filter(t => t.completed).length;
  const criticalCount = tasks.filter(t => t.isBlocker && !t.completed).length;
  const overdueCount = tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;

  const filteredTasks = tasks.filter(t => {
    if (filter === 'critical') return t.isBlocker && !t.completed;
    if (filter === 'completed') return t.completed;
    return !t.completed;
  });

  const handleOpenAdd = () => {
    setEditingTask({
      title: '',
      description: '',
      category: 'General',
      priority: 'Medium',
      assignee: 'ME',
      dueDate: new Date().toISOString().split('T')[0],
      isBlocker: false
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingTask.title) return;
    
    if (editingTask.id) {
       // Edit existing logic would go here if we implemented full updateTask in store
       // For now, simple add for new, or manual update via map
       const updated = tasks.map(t => t.id === editingTask.id ? { ...t, ...editingTask } as DossierTask : t);
       updateDossier('tasks', updated);
    } else {
       // Create new
       const newTask: DossierTask = {
          ...editingTask as DossierTask,
          id: Math.random().toString(36),
          completed: false
       };
       addTask(newTask);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
     updateDossier('tasks', tasks.filter(t => t.id !== id));
  };

  const getPriorityColor = (p: TaskPriority) => {
     switch(p) {
        case 'High': return 'bg-red-100 text-red-700 border-red-200';
        case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'Low': return 'bg-slate-100 text-slate-600 border-slate-200';
     }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 pb-24 space-y-8">
      
      {/* 1. Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Completion</div>
             <div className="text-3xl font-bold text-slate-900">{completedCount} <span className="text-sm text-slate-400">/ {tasks.length}</span></div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-2"><AlertCircle className="h-4 w-4"/> Blockers</div>
             <div className="text-3xl font-bold text-red-700">{criticalCount}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-2"><Clock className="h-4 w-4"/> Overdue</div>
             <div className="text-3xl font-bold text-orange-700">{overdueCount}</div>
          </div>
          <Button onClick={handleOpenAdd} className="h-auto flex flex-col items-center justify-center bg-slate-900 hover:bg-slate-800 text-white shadow-md">
             <Plus className="h-6 w-6 mb-1" />
             <span className="text-xs font-bold uppercase tracking-wide">New Task</span>
          </Button>
      </div>

      {/* 2. Task List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
         <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div className="flex bg-white rounded-lg p-1 border border-slate-200">
               {['all', 'critical', 'completed'].map(f => (
                  <button 
                    key={f} 
                    onClick={() => setFilter(f as any)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${filter === f ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                     {f}
                  </button>
               ))}
            </div>
            <div className="relative w-64">
               <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
               <Input placeholder="Search tasks..." className="pl-9 bg-white" />
            </div>
         </div>

         <div className="divide-y divide-slate-100 overflow-y-auto flex-1 custom-scrollbar">
            {filteredTasks.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <CheckSquare className="h-12 w-12 mb-3 opacity-20" />
                  <p>No tasks found.</p>
               </div>
            ) : (
               filteredTasks.map(task => (
                  <div key={task.id} className="group p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                     <Checkbox 
                        checked={task.completed} 
                        onCheckedChange={() => toggleTask(task.id)}
                        className="mt-1"
                     />
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                 {task.title}
                              </span>
                              {task.isBlocker && !task.completed && (
                                 <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">BLOCKER</Badge>
                              )}
                           </div>
                           <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`border-0 ${getPriorityColor(task.priority)}`}>
                                 {task.priority}
                              </Badge>
                              <div className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                                 {task.assignee}
                              </div>
                           </div>
                        </div>
                        {task.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-400">
                           <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                           <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">{task.category}</span>
                        </div>
                     </div>
                     <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button 
                           variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600"
                           onClick={() => { setEditingTask(task); setIsDialogOpen(true); }}
                        >
                           <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                           variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600"
                           onClick={() => handleDelete(task.id)}
                        >
                           <Trash2 className="h-4 w-4" />
                        </Button>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent>
            <DialogHeader><DialogTitle>{editingTask.id ? 'Edit Task' : 'New Task'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
               <div>
                  <Label>Task Title</Label>
                  <Input 
                     value={editingTask.title} 
                     onChange={e => setEditingTask({...editingTask, title: e.target.value})} 
                     placeholder="e.g. Verify Customs Docs"
                  />
               </div>
               <div>
                  <Label>Description</Label>
                  <Textarea 
                     value={editingTask.description} 
                     onChange={e => setEditingTask({...editingTask, description: e.target.value})} 
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <Label>Category</Label>
                     <Select 
                        value={editingTask.category} 
                        onValueChange={v => setEditingTask({...editingTask, category: v as TaskCategory})}
                     >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                     </Select>
                  </div>
                  <div>
                     <Label>Priority</Label>
                     <Select 
                        value={editingTask.priority} 
                        onValueChange={v => setEditingTask({...editingTask, priority: v as TaskPriority})}
                     >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="High">High</SelectItem>
                           <SelectItem value="Medium">Medium</SelectItem>
                           <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div>
                     <Label>Due Date</Label>
                     <Input type="date" value={editingTask.dueDate} onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})} />
                  </div>
                  <div>
                     <Label>Assignee</Label>
                     <Input value={editingTask.assignee} onChange={e => setEditingTask({...editingTask, assignee: e.target.value})} />
                  </div>
               </div>
               <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                     id="blocker"
                     checked={editingTask.isBlocker}
                     onCheckedChange={c => setEditingTask({...editingTask, isBlocker: c as boolean})}
                  />
                  <Label htmlFor="blocker" className="font-bold text-red-600 flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> Mark as Critical Blocker</Label>
               </div>
            </div>
            <DialogFooter>
               <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
               <Button onClick={handleSave}>Save Task</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
};