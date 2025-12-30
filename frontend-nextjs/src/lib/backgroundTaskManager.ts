/**
 * Background Task Manager
 * 
 * This module manages long-running tasks that should continue even when
 * the user navigates away from the page. It uses:
 * - localStorage for task persistence
 * - BroadcastChannel for cross-tab communication
 * - Direct API calls that bypass Redux's auto-abort behavior
 */

interface BackgroundTask {
  id: string
  type: 'ocr-upload'
  status: 'pending' | 'running' | 'completed' | 'failed'
  timestamp: number
  result?: any
  error?: string
  metadata?: {
    fileName?: string
    fileSize?: number
  }
}

class BackgroundTaskManager {
  private channel: BroadcastChannel | null = null
  private listeners: Map<string, Set<(task: BackgroundTask) => void>> = new Map()

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('background-tasks')
      this.channel.onmessage = (event) => {
        const task = event.data as BackgroundTask
        this.notifyListeners(task.id, task)
      }
    }
  }

  /**
   * Start a new background task
   */
  async startTask(
    type: BackgroundTask['type'],
    executor: () => Promise<any>,
    metadata?: BackgroundTask['metadata']
  ): Promise<string> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Create and save task
    const task: BackgroundTask = {
      id: taskId,
      type,
      status: 'running',
      timestamp: Date.now(),
      metadata,
    }
    this.saveTask(task)
    this.broadcastTask(task)

    try {
      // Execute the task
      const result = await executor()
      
      // Update task with result
      task.status = 'completed'
      task.result = result
      this.saveTask(task)
      this.broadcastTask(task)
      
      return taskId
    } catch (error: any) {
      // Update task with error
      task.status = 'failed'
      task.error = error.message || 'Task failed'
      this.saveTask(task)
      this.broadcastTask(task)
      throw error
    }
  }

  /**
   * Cancel a task (only works if it's still running)
   */
  cancelTask(taskId: string): void {
    const task = this.getTask(taskId)
    if (task && task.status === 'running') {
      task.status = 'failed'
      task.error = 'User canceled'
      this.saveTask(task)
      this.broadcastTask(task)
    }
  }

  /**
   * Get a task by ID
   */
  getTask(taskId: string): BackgroundTask | null {
    if (typeof window === 'undefined') return null
    
    try {
      const data = localStorage.getItem(`task-${taskId}`)
      if (!data) return null
      return JSON.parse(data)
    } catch (error) {
      console.error('Failed to load task:', error)
      return null
    }
  }

  /**
   * Get all active tasks (not older than 30 minutes)
   */
  getActiveTasks(): BackgroundTask[] {
    if (typeof window === 'undefined') return []
    
    const tasks: BackgroundTask[] = []
    const cutoffTime = Date.now() - 30 * 60 * 1000 // 30 minutes

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('task-')) {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const task = JSON.parse(data) as BackgroundTask
            if (task.timestamp > cutoffTime) {
              tasks.push(task)
            } else {
              // Clean up old tasks
              localStorage.removeItem(key)
            }
          }
        } catch (error) {
          console.error('Failed to parse task:', error)
        }
      }
    }

    return tasks.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Clear a task from storage
   */
  clearTask(taskId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`task-${taskId}`)
    }
  }

  /**
   * Clear all old tasks (older than 30 minutes)
   */
  clearOldTasks(): void {
    const cutoffTime = Date.now() - 30 * 60 * 1000 // 30 minutes
    
    if (typeof window === 'undefined') return

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('task-')) {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const task = JSON.parse(data) as BackgroundTask
            if (task.timestamp < cutoffTime) {
              localStorage.removeItem(key)
            }
          }
        } catch (error) {
          console.error('Failed to clear old task:', error)
        }
      }
    }
  }

  /**
   * Subscribe to task updates for a specific task ID
   */
  subscribe(taskId: string, listener: (task: BackgroundTask) => void): () => void {
    if (!this.listeners.has(taskId)) {
      this.listeners.set(taskId, new Set())
    }
    this.listeners.get(taskId)!.add(listener)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(taskId)
      if (listeners) {
        listeners.delete(listener)
        if (listeners.size === 0) {
          this.listeners.delete(taskId)
        }
      }
    }
  }

  /**
   * Subscribe to all task updates (for polling)
   */
  subscribeToAllTasks(listener: (tasks: BackgroundTask[]) => void): () => void {
    const intervalId = setInterval(() => {
      listener(this.getActiveTasks())
    }, 1000) // Check every second

    // Return unsubscribe function
    return () => {
      clearInterval(intervalId)
    }
  }

  /**
   * Poll for task updates (for use in result page)
   * Returns a cleanup function to stop polling
   */
  pollForCompletion(taskId: string, onResult: (result: any) => void, onError?: (error: string) => void): () => void {
    const pollInterval = setInterval(async () => {
      const task = this.getTask(taskId)
      if (!task) {
        clearInterval(pollInterval)
        onError?.('Task not found')
        return
      }

      if (task.status === 'completed' && task.result) {
        clearInterval(pollInterval)
        onResult(task.result)
        this.clearTask(taskId)
      } else if (task.status === 'failed') {
        clearInterval(pollInterval)
        onError?.(task.error || 'Task failed')
        this.clearTask(taskId)
      }
    }, 1000) // Poll every second

    // Return a function to stop polling
    return () => clearInterval(pollInterval)
  }

  private saveTask(task: BackgroundTask): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`task-${task.id}`, JSON.stringify(task))
      } catch (error) {
        console.error('Failed to save task:', error)
      }
    }
  }

  private broadcastTask(task: BackgroundTask): void {
    if (this.channel) {
      this.channel.postMessage(task)
    }
    this.notifyListeners(task.id, task)
  }

  private notifyListeners(taskId: string, task: BackgroundTask): void {
    const listeners = this.listeners.get(taskId)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(task)
        } catch (error) {
          console.error('Error in task listener:', error)
        }
      })
    }
  }
}

// Export singleton instance
export const backgroundTaskManager = new BackgroundTaskManager()

// Export types
export type { BackgroundTask }
