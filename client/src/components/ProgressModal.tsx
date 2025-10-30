import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { CheckCircle2, XCircle, AlertCircle, Loader2, X } from 'lucide-react';

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
  startedAt: string;
  completedAt?: string;
  data?: any;
}

interface ProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string | null;
  title: string;
  onComplete?: (success: boolean, data?: any) => void;
  showCancel?: boolean;
}

export function ProgressModal({ 
  open, 
  onOpenChange, 
  jobId, 
  title, 
  onComplete,
  showCancel = false 
}: ProgressModalProps) {
  const [job, setJob] = useState<JobProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [deletingBadAccounts, setDeletingBadAccounts] = useState(false);
  const [refreshingTokens, setRefreshingTokens] = useState(false);

  // Reset job state when jobId changes (new operation started)
  useEffect(() => {
    if (jobId) {
      setJob(null);
      setError(null);
      setDeletingBadAccounts(false);
      setRefreshingTokens(false);
    }
  }, [jobId]);

  // Poll for job updates - EXACT COPY FROM MAIN APP
  useEffect(() => {
    if (!jobId || !open || job?.done) {
      setPolling(false);
      return;
    }

    if (!polling) {
      setPolling(true);
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/jobs/${jobId}`);
        const data = await response.json();

        if (data.success && data.job) {
          setJob(data.job);
          setError(null);
          
          // Stop polling when job is done
          if (data.job.done) {
            setPolling(false);
            clearInterval(pollInterval);
            
            // Call completion callback
            if (onComplete) {
              onComplete(data.job.success, data.job.data);
            }
            return; // Exit early to prevent further polling
          }
        } else {
          setError(data.error || 'Failed to fetch job status');
          setPolling(false);
          clearInterval(pollInterval);
        }
      } catch (err) {
        setError('Failed to fetch job status');
        setPolling(false);
        clearInterval(pollInterval);
      }
    }, 1500); // Poll every 1.5 seconds

    return () => {
      clearInterval(pollInterval);
      setPolling(false);
    };
  }, [jobId, open, onComplete, job?.done]);

  const handleCancel = async () => {
    if (!jobId) return;
    
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/cancel`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        // Job will be updated through polling
      } else {
        setError(data.error || 'Failed to cancel job');
      }
    } catch (err) {
      setError('Failed to cancel job');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleDeleteBadAccounts = async () => {
    if (!job?.data?.failedAccounts || job.data.failedAccounts.length === 0) return;
    
    const confirmDelete = confirm(
      `Delete ${job.data.failedAccounts.length} failed account(s) to keep database clean?\n\n` +
      `This will permanently remove these accounts:\n` +
      job.data.failedAccounts.map((f: any) => `@${f.username}`).slice(0, 5).join(', ') +
      (job.data.failedAccounts.length > 5 ? ` and ${job.data.failedAccounts.length - 5} more...` : '')
    );
    
    if (!confirmDelete) return;
    
    setDeletingBadAccounts(true);
    try {
      const usernames = job.data.failedAccounts.map((f: any) => f.username);
      const response = await fetch('/api/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`✅ Successfully deleted ${data.deleted} failed account(s).\n${data.failed > 0 ? `Failed to delete ${data.failed} account(s).` : ''}`);
        handleClose();
        // Reload the page to refresh user list
        window.location.reload();
      } else {
        alert(`❌ Failed to delete accounts: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error deleting accounts. Please try again.');
    } finally {
      setDeletingBadAccounts(false);
    }
  };

  const handleRefreshInvalidTokens = async () => {
    if (!job?.data?.refreshableAccounts || job.data.refreshableAccounts.length === 0) return;
    
    const confirmRefresh = confirm(
      `Try to refresh ${job.data.refreshableAccounts.length} account(s) with expired tokens?\n\n` +
      `These accounts have refresh tokens and may be fixable:\n` +
      job.data.refreshableAccounts.map((f: any) => `@${f.username}`).slice(0, 5).join(', ') +
      (job.data.refreshableAccounts.length > 5 ? ` and ${job.data.refreshableAccounts.length - 5} more...` : '')
    );
    
    if (!confirmRefresh) return;
    
    setRefreshingTokens(true);
    try {
      const usernames = job.data.refreshableAccounts.map((f: any) => f.username);
      let success = 0;
      let failed = 0;
      
      for (const username of usernames) {
        try {
          const response = await fetch(`/api/users/${username}/refresh`, {
            method: 'POST',
          });
          const data = await response.json();
          if (data.success) {
            success++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }
      
      alert(`✅ Token refresh completed:\n${success} refreshed successfully\n${failed} failed to refresh`);
      handleClose();
      window.location.reload();
    } catch (error) {
      alert('❌ Error refreshing tokens. Please try again.');
    } finally {
      setRefreshingTokens(false);
    }
  };

  const handleDeleteUnfixableAccounts = async () => {
    if (!job?.data?.accountsToDelete || job.data.accountsToDelete.length === 0) return;
    
    const confirmDelete = confirm(
      `Delete ${job.data.accountsToDelete.length} unfixable account(s)?\n\n` +
      `These accounts have no refresh tokens or unfixable errors:\n` +
      job.data.accountsToDelete.map((f: any) => `@${f.username}`).slice(0, 5).join(', ') +
      (job.data.accountsToDelete.length > 5 ? ` and ${job.data.accountsToDelete.length - 5} more...` : '')
    );
    
    if (!confirmDelete) return;
    
    setDeletingBadAccounts(true);
    try {
      const usernames = job.data.accountsToDelete.map((f: any) => f.username);
      const response = await fetch('/api/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`✅ Successfully deleted ${data.deleted} account(s).\n${data.failed > 0 ? `Failed to delete ${data.failed} account(s).` : ''}`);
        handleClose();
        window.location.reload();
      } else {
        alert(`❌ Failed to delete accounts: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error deleting accounts. Please try again.');
    } finally {
      setDeletingBadAccounts(false);
    }
  };

  const getProgressPercentage = () => {
    if (!job || job.total === 0) return 0;
    return Math.round((job.processed / job.total) * 100);
  };

  // Debug logging for validate_tokens
  useEffect(() => {
    if (job?.type === 'validate_tokens' && job.done && job.data) {
      console.log('🔍 Validate Tokens Job Data:', {
        refreshableAccounts: job.data.refreshableAccounts,
        accountsToDelete: job.data.accountsToDelete,
        refreshableCount: job.data.refreshableAccounts?.length,
        deleteCount: job.data.accountsToDelete?.length
      });
    }
  }, [job]);

  const getStatusIcon = () => {
    if (!job) return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    
    if (job.done) {
      if (job.success) {
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      } else {
        return <XCircle className="h-5 w-5 text-red-500" />;
      }
    } else {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
  };

  const getStatusText = () => {
    if (!job) return 'Initializing...';
    
    if (job.done) {
      return job.success ? 'Completed Successfully' : 'Completed with Errors';
    } else {
      return 'In Progress';
    }
  };

  const formatDuration = () => {
    if (!job) return '';
    
    const start = new Date(job.startedAt).getTime();
    const end = job.completedAt ? new Date(job.completedAt).getTime() : Date.now();
    const duration = Math.round((end - start) / 1000);
    
    return `${duration}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            {getStatusIcon()}
            {title}
          </DialogTitle>
          {job?.done && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{getStatusText()}</span>
                  <span className="text-gray-300">
                    {job ? `${job.processed}/${job.total}` : '0/0'} ({getProgressPercentage()}%)
                  </span>
                </div>
                <Progress 
                  value={getProgressPercentage()} 
                  className="h-2 bg-gray-800"
                />
              </div>

              {/* Current Stage & Message */}
              {job && (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-400">Stage: </span>
                    <span className="text-purple-400 font-medium capitalize">
                      {job.stage.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Status: </span>
                    <span className="text-gray-200">{job.message}</span>
                  </div>
                  {job.done && (
                    <div className="text-xs text-gray-500">
                      Duration: {formatDuration()}
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Results for Bulk Posting */}
              {job?.type === 'bulk_post' && job.done && job.data && (
                <div className="space-y-3 border-t border-gray-700 pt-3">
                  <div className="text-sm font-medium text-white">Posted Tweets:</div>
                  
                  {/* Success Summary */}
                  {job.data.successfulAccounts && job.data.successfulAccounts.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-green-400 font-medium">
                        ✅ Successfully Posted ({job.data.successfulAccounts.length}):
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2 bg-green-900/10 border border-green-800 rounded p-2">
                        {job.data.successfulAccounts.map((account: any, index: number) => (
                          <div key={index} className="text-xs bg-green-900/20 border border-green-800/50 rounded p-2">
                            <div className="font-semibold text-green-300 mb-1">@{account.username || account}</div>
                            {account.tweet && (
                              <div className="text-green-200/80 italic whitespace-pre-wrap break-words">
                                "{account.tweet}"
                              </div>
                            )}
                            {account.tweetId && (
                              <div className="text-green-400/60 text-[10px] mt-1">
                                ID: {account.tweetId}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failed Summary */}
                  {job.data.failedAccounts && job.data.failedAccounts.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-red-400 font-medium">
                        ❌ Failed ({job.data.failedAccounts.length}):
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2 bg-red-900/10 border border-red-800 rounded p-2">
                        {job.data.failedAccounts.map((failed: any, index: number) => (
                          <div key={index} className="text-xs bg-red-900/20 border border-red-800/50 rounded p-2">
                            <div className="font-semibold text-red-300 mb-1">@{failed.username}</div>
                            {failed.tweet && (
                              <div className="text-red-200/80 italic whitespace-pre-wrap break-words mb-1">
                                "{failed.tweet}"
                              </div>
                            )}
                            <div className="text-red-400">{failed.error}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Results for Bulk Refresh */}
              {job?.type === 'bulk_refresh' && job.done && job.data && (
                <div className="space-y-3 border-t border-gray-700 pt-3">
                  <div className="text-sm font-medium text-white">Results Summary:</div>
                  
                  {/* Success Summary */}
                  {job.data.successfulAccounts && job.data.successfulAccounts.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-green-400 font-medium">
                        ✅ Successfully Refreshed ({job.data.successfulAccounts.length}):
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1 bg-green-900/10 border border-green-800 rounded p-2">
                        {job.data.successfulAccounts.map((username: string, index: number) => (
                          <div key={index} className="text-xs text-green-300">
                            @{username}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failed Summary */}
                  {job.data.failedAccounts && job.data.failedAccounts.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-red-400 font-medium">
                        ❌ Failed ({job.data.failedAccounts.length}):
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1 bg-red-900/10 border border-red-800 rounded p-2">
                        {job.data.failedAccounts.map((failed: any, index: number) => (
                          <div key={index} className="text-xs text-red-300">
                            @{failed.username}: {failed.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Results for Token Validation */}
              {job?.type === 'validate_tokens' && job.done && job.data && (
                <div className="space-y-3 border-t border-gray-700 pt-3">
                  <div className="text-sm font-medium text-white">Token Validation Results:</div>
                  
                  {/* Valid Tokens */}
                  {job.data.validAccounts && job.data.validAccounts.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-green-400 font-medium">
                        ✅ Valid Tokens ({job.data.validAccounts.length}):
                      </div>
                      <div className="max-h-24 overflow-y-auto space-y-1 bg-green-900/10 border border-green-800 rounded p-2">
                        {job.data.validAccounts.map((username: string, index: number) => (
                          <div key={index} className="text-xs text-green-300">
                            @{username}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Refreshable Tokens */}
                  {job.data.refreshableAccounts && job.data.refreshableAccounts.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-yellow-400 font-medium">
                        🔄 Refreshable ({job.data.refreshableAccounts.length}):
                      </div>
                      <div className="max-h-24 overflow-y-auto space-y-1 bg-yellow-900/10 border border-yellow-800 rounded p-2">
                        {job.data.refreshableAccounts.map((account: any, index: number) => (
                          <div key={index} className="text-xs text-yellow-300">
                            @{account.username}: {account.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accounts to Delete */}
                  {job.data.accountsToDelete && job.data.accountsToDelete.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-red-400 font-medium">
                        ❌ Unfixable ({job.data.accountsToDelete.length}):
                      </div>
                      <div className="max-h-24 overflow-y-auto space-y-1 bg-red-900/10 border border-red-800 rounded p-2">
                        {job.data.accountsToDelete.map((account: any, index: number) => (
                          <div key={index} className="text-xs text-red-300">
                            @{account.username}: {account.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Errors */}
              {job?.errors && job.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-red-400 font-medium">Errors:</div>
                  <div className="max-h-20 overflow-y-auto space-y-1">
                    {job.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-300 p-2 bg-red-900/20 border border-red-800 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-2">
                <div className="text-xs text-gray-500">
                  {polling ? 'Updating...' : 'Last updated: now'}
                </div>
                <div className="flex gap-2">
                  {showCancel && job && !job.done && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      Cancel
                    </Button>
                  )}
                  {/* Cleanup option for bulk_post with failures */}
                  {job?.done && job?.type === 'bulk_post' && job?.data?.failedAccounts && job.data.failedAccounts.length > 0 && (
                    <Button
                      onClick={handleDeleteBadAccounts}
                      disabled={deletingBadAccounts}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      {deletingBadAccounts ? 'Deleting...' : `🗑️ Delete ${job.data.failedAccounts.length} Failed Account(s)`}
                    </Button>
                  )}
                  
                  {/* Token validation options */}
                  {job?.done && job?.type === 'validate_tokens' && job?.data && (
                    <>
                      {job.data.refreshableAccounts && job.data.refreshableAccounts.length > 0 && (
                        <Button
                          onClick={handleRefreshInvalidTokens}
                          disabled={refreshingTokens}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          size="sm"
                        >
                          {refreshingTokens ? 'Refreshing...' : `🔄 Refresh ${job.data.refreshableAccounts.length} Token(s)`}
                        </Button>
                      )}
                      {job.data.accountsToDelete && job.data.accountsToDelete.length > 0 && (
                        <Button
                          onClick={handleDeleteUnfixableAccounts}
                          disabled={deletingBadAccounts}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          size="sm"
                        >
                          {deletingBadAccounts ? 'Deleting...' : `🗑️ Delete ${job.data.accountsToDelete.length} Unfixable`}
                        </Button>
                      )}
                    </>
                  )}
                  
                  {job?.done && (
                    <Button
                      onClick={handleClose}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      size="sm"
                    >
                      Close
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
