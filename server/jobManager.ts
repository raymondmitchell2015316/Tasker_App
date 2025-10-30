interface JobProgress {
  id: string;
  type: 'bulk_refresh' | 'bulk_post' | 'duplicate_fixer' | 'validate_tokens';
  processed: number;
  total: number;
  stage: string;
  message: string;
  errors: string[];
  done: boolean;
  success: boolean;
  startedAt: Date;
  completedAt?: Date;
  data?: any;
}

interface CompletionNotification {
  id: string;
  jobId: string;
  type: JobProgress['type'];
  title: string;
  message: string;
  success: boolean;
  timestamp: Date;
  dismissed: boolean;
  data?: any;
}

interface JobRunner {
  id: string;
  cancel: () => void;
}

class JobManager {
  private jobs: Map<string, JobProgress> = new Map();
  private runners: Map<string, JobRunner> = new Map();
  private notifications: Map<string, CompletionNotification> = new Map();

  createJob(type: JobProgress['type'], total: number, initialMessage: string = 'Starting...'): string {
    const id = this.generateJobId();
    const job: JobProgress = {
      id,
      type,
      processed: 0,
      total,
      stage: 'initializing',
      message: initialMessage,
      errors: [],
      done: false,
      success: false,
      startedAt: new Date(),
    };

    this.jobs.set(id, job);
    
    // Clean up jobs older than 1 hour
    this.cleanupOldJobs();
    
    return id;
  }

  updateJob(id: string, updates: Partial<Omit<JobProgress, 'id' | 'startedAt'>>): void {
    const job = this.jobs.get(id);
    if (!job) return;

    const wasNotDone = !job.done;
    
    if (updates.done && !job.completedAt) {
      updates.completedAt = new Date();
    }

    Object.assign(job, updates);
    this.jobs.set(id, job);
    
    // Create completion notification when job becomes done
    if (wasNotDone && updates.done) {
      this.createCompletionNotification(id);
    }
  }

  incrementProgress(id: string, amount: number = 1, message?: string): void {
    const job = this.jobs.get(id);
    if (!job) return;

    const updates: Partial<JobProgress> = {
      processed: job.processed + amount,
    };

    if (message) {
      updates.message = message;
    }

    // Check if job is complete
    const newProcessed = updates.processed ?? job.processed;
    if (newProcessed >= job.total) {
      updates.done = true;
      updates.success = job.errors.length === 0;
      updates.stage = updates.success ? 'completed' : 'completed_with_errors';
      updates.message = updates.success ? 'Operation completed successfully' : `Completed with ${job.errors.length} errors`;
    }

    this.updateJob(id, updates);
  }

  addError(id: string, error: string): void {
    const job = this.jobs.get(id);
    if (!job) return;

    job.errors.push(error);
    this.jobs.set(id, job);
  }

  getJob(id: string): JobProgress | null {
    return this.jobs.get(id) || null;
  }

  getAllJobs(): JobProgress[] {
    return Array.from(this.jobs.values());
  }

  setJobRunner(id: string, runner: JobRunner): void {
    this.runners.set(id, runner);
  }

  cancelJob(id: string): boolean {
    const runner = this.runners.get(id);
    if (runner) {
      runner.cancel();
      this.updateJob(id, {
        done: true,
        success: false,
        stage: 'cancelled',
        message: 'Job cancelled by user'
      });
      this.runners.delete(id);
      return true;
    }
    return false;
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanupOldJobs(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    Array.from(this.jobs.entries()).forEach(([id, job]) => {
      if (job.startedAt < oneHourAgo && job.done) {
        this.jobs.delete(id);
        this.runners.delete(id);
      }
    });
  }

  // Get job summary for logging
  getJobSummary(id: string): string {
    const job = this.jobs.get(id);
    if (!job) return 'Job not found';
    
    return `${job.type} (${job.processed}/${job.total}) - ${job.stage}: ${job.message}`;
  }

  // Notification management methods
  createCompletionNotification(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job || !job.done) return;

    const notification: CompletionNotification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      jobId: job.id,
      type: job.type,
      title: this.getNotificationTitle(job),
      message: this.getNotificationMessage(job),
      success: job.success,
      timestamp: job.completedAt || new Date(),
      dismissed: false,
      data: job.data
    };

    this.notifications.set(notification.id, notification);
    
    // Clean up old notifications (keep last 50)
    this.cleanupOldNotifications();
    
    console.log(`📢 Created completion notification: ${notification.title} - ${notification.message}`);
  }

  private getNotificationTitle(job: JobProgress): string {
    switch (job.type) {
      case 'bulk_post':
        return 'Bulk Posting Complete';
      case 'bulk_refresh':
        return 'Token Refresh Complete';
      case 'duplicate_fixer':
        return 'Duplicate Fix Complete';
      default:
        return 'Job Complete';
    }
  }

  private getNotificationMessage(job: JobProgress): string {
    if (job.success) {
      switch (job.type) {
        case 'bulk_post':
          return `Successfully posted to ${job.data?.successful || job.processed} accounts${job.errors.length > 0 ? ` (${job.errors.length} failed)` : ''}`;
        case 'bulk_refresh':
          return `Refreshed ${job.processed} tokens successfully${job.errors.length > 0 ? ` (${job.errors.length} failed)` : ''}`;
        case 'duplicate_fixer':
          return `Fixed ${job.processed} duplicate tokens${job.errors.length > 0 ? ` (${job.errors.length} errors)` : ''}`;
        default:
          return job.message;
      }
    } else {
      return `Failed: ${job.message}${job.errors.length > 0 ? ` (${job.errors.length} errors)` : ''}`;
    }
  }

  getNotifications(includeRead: boolean = false): CompletionNotification[] {
    const notifications = Array.from(this.notifications.values());
    return includeRead 
      ? notifications 
      : notifications.filter(n => !n.dismissed);
  }

  dismissNotification(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.dismissed = true;
      this.notifications.set(notificationId, notification);
      return true;
    }
    return false;
  }

  dismissAllNotifications(): void {
    this.notifications.forEach((notification, id) => {
      notification.dismissed = true;
      this.notifications.set(id, notification);
    });
  }

  private cleanupOldNotifications(): void {
    const notifications = Array.from(this.notifications.entries())
      .sort(([, a], [, b]) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Keep only the 50 most recent notifications
    if (notifications.length > 50) {
      const toDelete = notifications.slice(50);
      toDelete.forEach(([id]) => {
        this.notifications.delete(id);
      });
    }
  }
}

// Singleton instance
const jobManager = new JobManager();

export { jobManager, JobProgress, JobRunner, CompletionNotification };