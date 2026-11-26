import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  CheckSquare,
  Plus,
  Shield,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  UserPlus,
  AlertCircle,
  Filter,
  X,
} from 'lucide-react';
import { CommunityMember, CommunityTask, CommunityRole } from '../../types';

interface CommunityTeamTasksViewProps {
  isCreateTaskOpen?: boolean;
  onCloseCreateTask?: () => void;
}

export const CommunityTeamTasksView: React.FC<CommunityTeamTasksViewProps> = ({
  isCreateTaskOpen = false,
  onCloseCreateTask,
}) => {
  const {
    communityMembers,
    addCommunityMember,
    updateCommunityMember,
    deleteCommunityMember,
    communityTasks,
    addCommunityTask,
    updateCommunityTask,
    deleteCommunityTask,
    toggleCommunityTask,
    communityProgrammes,
    language,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'team'>('tasks');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Task Modal State
  const [showTaskModal, setShowTaskModal] = useState(isCreateTaskOpen);
  const [selectedTask, setSelectedTask] = useState<CommunityTask | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskProgId, setTaskProgId] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskPriority, setTaskPriority] = useState<CommunityTask['priority']>('medium');
  const [taskDesc, setTaskDesc] = useState('');

  // Member Modal State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRoleTitle, setMemberRoleTitle] = useState('');
  const [memberContact, setMemberContact] = useState('');
  const [memberPermission, setMemberPermission] = useState<CommunityRole>('coordinator');

  const filteredTasks = communityTasks.filter(t => {
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesPriority && matchesStatus;
  });

  const openNewTaskModal = () => {
    setSelectedTask(null);
    setTaskTitle('');
    setTaskProgId(communityProgrammes[0]?.id || '');
    setTaskAssigneeId(communityMembers[0]?.id || 'unassigned');
    setTaskDueDate(new Date().toISOString().split('T')[0]);
    setTaskPriority('medium');
    setTaskDesc('');
    setShowTaskModal(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    if (selectedTask) {
      updateCommunityTask(selectedTask.id, {
        title: taskTitle,
        programmeId: taskProgId || undefined,
        assignedMemberId: taskAssigneeId,
        dueDate: taskDueDate,
        priority: taskPriority,
        description: taskDesc,
      });
    } else {
      addCommunityTask({
        title: taskTitle,
        programmeId: taskProgId || undefined,
        assignedMemberId: taskAssigneeId,
        dueDate: taskDueDate,
        priority: taskPriority,
        status: 'pending',
        description: taskDesc,
      });
    }

    setShowTaskModal(false);
    setSelectedTask(null);
    if (onCloseCreateTask) onCloseCreateTask();
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;

    addCommunityMember({
      name: memberName,
      roleTitle: memberRoleTitle || 'Team Volunteer',
      contact: memberContact,
      permission: memberPermission,
    });

    setShowMemberModal(false);
    setMemberName('');
    setMemberRoleTitle('');
    setMemberContact('');
    setMemberPermission('coordinator');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>{language === 'ml' ? 'ടീം & പ്രവർത്തനങ്ങൾ' : 'Team Coordination'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {language === 'ml' ? 'ടീമും ചുമതലകളും' : 'Tasks & Team Coordination'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {language === 'ml'
              ? 'പ്രവർത്തനങ്ങൾ ഏകോപിപ്പിക്കുകയും ടീം അംഗങ്ങൾക്ക് കൃത്യമായ ചുമതലകൾ നിശ്ചയിക്കുകയും ചെയ്യുക.'
              : 'Assign action items, set priority deadlines, and manage member roles across prevention drives.'}
          </p>
        </div>

        {/* Subtab Toggle & Add Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveSubTab('tasks')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeSubTab === 'tasks' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tasks ({communityTasks.length})
            </button>
            <button
              onClick={() => setActiveSubTab('team')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeSubTab === 'team' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Team Roster ({communityMembers.length})
            </button>
          </div>

          {activeSubTab === 'tasks' ? (
            <button
              onClick={openNewTaskModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ml' ? 'പുതിയ ചുമതല' : 'Add Task'}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowMemberModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === 'ml' ? 'അംഗത്തെ ചേർക്കുക' : 'Add Member'}</span>
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'tasks' ? (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-teal-700" />
              <span>Filter:</span>
            </div>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-teal-700"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-teal-700"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <span className="text-xs text-slate-400 font-mono ml-auto">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {/* Tasks List */}
          {filteredTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map(task => {
                const assignee = communityMembers.find(m => m.id === task.assignedMemberId);
                const prog = communityProgrammes.find(p => p.id === task.programmeId);
                const isDone = task.status === 'completed';

                return (
                  <div
                    key={task.id}
                    className={`bg-white border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between ${
                      isDone ? 'border-slate-200 bg-slate-50/50 opacity-80' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => toggleCommunityTask(task.id)}
                            className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border transition-colors ${
                              isDone
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-white hover:border-teal-600'
                            }`}
                            title={isDone ? 'Mark In Progress' : 'Mark Completed'}
                          >
                            {isDone && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <div>
                            <h3
                              className={`text-sm font-bold text-slate-900 ${
                                isDone ? 'line-through text-slate-500' : ''
                              }`}
                            >
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                            )}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            task.priority === 'high'
                              ? 'bg-rose-100 text-rose-800'
                              : task.priority === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {/* Details row */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Due: {task.dueDate}
                        </span>
                        {assignee && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-teal-600" />
                            {assignee.name}
                          </span>
                        )}
                        {prog && (
                          <span className="truncate max-w-[150px] text-teal-800 font-medium">
                            • {prog.title}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Status: <strong className="text-slate-700">{task.status}</strong>
                      </span>
                      <button
                        onClick={() => deleteCommunityTask(task.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200">
              <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No tasks in this list</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Break down upcoming workshops into logistical tasks such as printing guides, booking halls, and coordinating guest speakers.
              </p>
              <button
                onClick={openNewTaskModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Team Members Tab */
        <div className="space-y-6">
          {communityMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {communityMembers.map(member => (
                <div
                  key={member.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-sm">
                        {member.name.charAt(0)}
                      </div>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          member.permission === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : member.permission === 'coordinator'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {member.permission}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{member.name}</h3>
                      <p className="text-xs text-teal-800 font-medium">{member.roleTitle}</p>
                    </div>

                    {member.contact && (
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{member.contact}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Joined: {member.joinedAt ? member.joinedAt.split('T')[0] : 'Recent'}</span>
                    <button
                      onClick={() => deleteCommunityMember(member.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No team members registered yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Add volunteer coordinators, school counsellors, and peer ambassador leads to organize task assignments.
              </p>
              <button
                onClick={() => setShowMemberModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add First Member</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {selectedTask ? 'Edit Action Item' : 'New Operational Task'}
              </h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="e.g. Print refusal skills booklets for 10th grade"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assignee
                  </label>
                  <select
                    value={taskAssigneeId}
                    onChange={e => setTaskAssigneeId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 bg-white"
                  >
                    <option value="unassigned">Unassigned / Open</option>
                    {communityMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.roleTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 bg-white"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Programme Link
                  </label>
                  <select
                    value={taskProgId}
                    onChange={e => setTaskProgId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 bg-white"
                  >
                    <option value="">None / General</option>
                    {communityProgrammes.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  placeholder="Additional context or links to materials"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white shadow-xs transition-colors"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Add Team Member</h2>
              <button
                onClick={() => setShowMemberModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Member Name *
                </label>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={e => setMemberName(e.target.value)}
                  placeholder="e.g. Sister Ancy Thomas"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Designation / Role *
                </label>
                <input
                  type="text"
                  required
                  value={memberRoleTitle}
                  onChange={e => setMemberRoleTitle(e.target.value)}
                  placeholder="e.g. Student Wellness Counsellor"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Phone / Email
                </label>
                <input
                  type="text"
                  value={memberContact}
                  onChange={e => setMemberContact(e.target.value)}
                  placeholder="+91 94470 00000"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Workspace Permission
                </label>
                <select
                  value={memberPermission}
                  onChange={e => setMemberPermission(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 bg-white"
                >
                  <option value="coordinator">Coordinator (Manage events & tasks)</option>
                  <option value="admin">Admin (Full workspace control)</option>
                  <option value="member">Member (View & complete tasks)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white shadow-xs transition-colors"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
