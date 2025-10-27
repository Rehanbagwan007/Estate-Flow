
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Task, Profile, TaskType } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfYear } from 'date-fns';

interface EnrichedTask extends Task {
    assigned_to_profile?: Profile | null;
}

interface TaskFiltersProps {
  allTasks: EnrichedTask[];
  teamMembers: Profile[];
  onFilterChange: (filteredTasks: EnrichedTask[]) => void;
  showTeamFilter: boolean;
}

export function TaskFilters({ allTasks, teamMembers, onFilterChange, showTeamFilter }: TaskFiltersProps) {
  const [assignedTo, setAssignedTo] = useState<string>('all');
  const [taskType, setTaskType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  const taskTypes: TaskType[] = useMemo(() => [
      'Follow-up', 'Call', 'Site Visit', 'Meeting'
  ], []);

  useEffect(() => {
    let filtered = allTasks;

    // Filter by assigned team member
    if (showTeamFilter && assignedTo !== 'all') {
      filtered = filtered.filter(task => task.assigned_to === assignedTo);
    }

    // Filter by task type
    if (taskType !== 'all') {
      filtered = filtered.filter(task => task.task_type === taskType);
    }

    // Filter by date range (due date)
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch(dateRange) {
        case 'today':
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case 'this_week':
          startDate = startOfWeek(now);
          endDate = endOfWeek(now);
          break;
        case 'this_month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'this_year':
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
        default:
          startDate = new Date(0); // far past
          endDate = new Date(); // now
          break;
      }

      filtered = filtered.filter(task => {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        return taskDate >= startDate && taskDate <= endDate;
      });
    }

    onFilterChange(filtered);
  }, [assignedTo, taskType, dateRange, allTasks, onFilterChange, showTeamFilter]);

  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      {showTeamFilter && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Team Member:</label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                {teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
      )}

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Task Type:</label>
        <Select value={taskType} onValueChange={setTaskType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {taskTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Due Date:</label>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="this_week">This Week</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="this_year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
