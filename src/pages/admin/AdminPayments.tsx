import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminPaymentsQuery, Transaction } from '@/hooks/useAdminPaymentsQuery';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/errorMapping';
import ErrorState from '@/components/ErrorState';
import { 
  CreditCard, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Trophy,
  ArrowUpRight,
  DollarSign
} from 'lucide-react';

type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
type TransactionType = 'prize' | 'withdrawal' | 'bonus';

const AdminPayments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'pending';

  const { data: transactions = [], isLoading, isError, refetch } = useAdminPaymentsQuery(statusFilter);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const openProcessModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setPaymentReference('');
    setIsProcessModalOpen(true);
  };

  const processPayment = async (action: 'complete' | 'cancel') => {
    if (!selectedTransaction || !user) return;

    setIsProcessing(true);

    const { error } = await supabase
      .from('wallet_transactions')
      .update({
        status: action === 'complete' ? 'completed' : 'cancelled',
        payment_reference: paymentReference || null,
        processed_by: user.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', selectedTransaction.id);

    if (error) {
      toast({
        title: 'Failed to process payment',
        description: getUserFriendlyError(error),
        variant: 'destructive',
      });
    } else {
      // Create notification for the user
      const actionLabel = selectedTransaction.type === 'prize' ? 'Prize payout' : 'Withdrawal';
      const notificationTitle = action === 'complete' 
        ? `${actionLabel} completed!` 
        : `${actionLabel} cancelled`;
      const notificationMessage = action === 'complete'
        ? `Your ${actionLabel.toLowerCase()} of $${Number(selectedTransaction.amount).toFixed(2)} has been processed and is now available in your wallet.`
        : `Your ${actionLabel.toLowerCase()} of $${Number(selectedTransaction.amount).toFixed(2)} has been cancelled.`;

      await supabase.from('notifications').insert({
        user_id: selectedTransaction.user_id,
        title: notificationTitle,
        message: notificationMessage,
        type: action === 'complete' ? 'payment' : 'info',
        link: '/wallet'
      });

      toast({
        title: action === 'complete' ? `${actionLabel} completed` : `${actionLabel} cancelled`,
        description: action === 'complete' 
          ? `$${selectedTransaction.amount} has been marked as paid. User's available balance has been updated.`
          : `${actionLabel} has been cancelled.`,
      });
      setIsProcessModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
    }

    setIsProcessing(false);
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const variants: Record<TransactionStatus, { class: string; icon: any }> = {
      pending: { class: 'bg-amber-500', icon: Clock },
      completed: { class: 'bg-success', icon: CheckCircle },
      failed: { class: 'bg-destructive', icon: XCircle },
      cancelled: { class: 'bg-secondary', icon: XCircle },
    };
    const v = variants[status];
    const Icon = v.icon;
    return (
      <Badge className={`${v.class} gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'prize':
        return <Trophy className="h-4 w-4 text-accent" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-primary" />;
      case 'bonus':
        return <DollarSign className="h-4 w-4 text-success" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: TransactionType) => {
    switch (type) {
      case 'prize':
        return 'Contest Prize';
      case 'withdrawal':
        return 'Withdrawal';
      case 'bonus':
        return 'Bonus';
      default:
        return type;
    }
  };

  const pendingTotal = transactions
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const completedThisMonth = transactions.filter((t) => {
    if (t.status !== 'completed') return false;
    const txDate = new Date(t.created_at);
    const now = new Date();
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  }).length;

  if (isError) {
    return (
      <ErrorState 
        title="Failed to load payments" 
        message="Could not load payment data." 
        onRetry={refetch} 
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Payments</h1>
          <p className="text-muted-foreground">Manage prize payouts and withdrawals</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="glass-card border-amber-500/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">${pendingTotal.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Pending Payouts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{completedThisMonth}</p>
                <p className="text-xs text-muted-foreground">Completed This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{transactions.length}</p>
                <p className="text-xs text-muted-foreground">Total Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['pending', 'completed', 'cancelled', 'all'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchParams({ status })}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : transactions.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Transactions Found</h3>
            <p className="text-muted-foreground">
              No {statusFilter !== 'all' ? statusFilter : ''} transactions to display.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-semibold">User</th>
                    <th className="text-left p-4 font-semibold">Type</th>
                    <th className="text-left p-4 font-semibold">Amount</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Date</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{tx.profile?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{tx.profile?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(tx.type)}
                          <span>{getTypeLabel(tx.type)}</span>
                        </div>
                        {tx.contest && (
                          <p className="text-xs text-muted-foreground">{tx.contest.title}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-bold">${Number(tx.amount).toFixed(2)}</span>
                      </td>
                      <td className="p-4">{getStatusBadge(tx.status)}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {tx.status === 'pending' && (
                          <Button size="sm" onClick={() => openProcessModal(tx)}>
                            Process
                          </Button>
                        )}
                        {tx.payment_reference && (
                          <p className="text-xs text-muted-foreground">Ref: {tx.payment_reference}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Process Payment Modal */}
      <Dialog open={isProcessModalOpen} onOpenChange={setIsProcessModalOpen}>
        <DialogContent>
          {selectedTransaction && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Process {selectedTransaction.type === 'prize' ? 'Prize Payout' : 'Withdrawal'}
                </DialogTitle>
                <DialogDescription>
                  {selectedTransaction.type === 'prize' 
                    ? 'Mark this contest prize as paid after completing the manual payment'
                    : 'Approve or cancel this withdrawal request'
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/30">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Recipient</p>
                      <p className="font-semibold">{selectedTransaction.profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{selectedTransaction.profile?.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-semibold text-lg">${Number(selectedTransaction.amount).toFixed(2)}</p>
                    </div>
                    {selectedTransaction.type === 'prize' && selectedTransaction.contest && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Contest</p>
                        <p className="font-semibold">{selectedTransaction.contest.title}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Details */}
                {(selectedTransaction.payment_details?.upi_id || selectedTransaction.payment_details?.bank_account_number) && (
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-sm font-semibold mb-2">Payment Details</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedTransaction.payment_details?.upi_id && (
                        <div>
                          <p className="text-muted-foreground">UPI ID</p>
                          <p className="font-semibold">{selectedTransaction.payment_details.upi_id}</p>
                        </div>
                      )}
                      {selectedTransaction.payment_details?.bank_account_number && (
                        <>
                          <div>
                            <p className="text-muted-foreground">Bank Account</p>
                            <p className="font-semibold">{selectedTransaction.payment_details.bank_account_number}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">IFSC</p>
                            <p className="font-semibold">{selectedTransaction.payment_details.bank_ifsc}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* What happens section */}
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-semibold mb-2">What happens when you mark as paid:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• User's <strong>Pending</strong> balance decreases by ${Number(selectedTransaction.amount).toFixed(2)}</li>
                    <li>• User's <strong>Available Balance</strong> increases by ${Number(selectedTransaction.amount).toFixed(2)}</li>
                    <li>• Transaction is marked as completed in user's history</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label>Payment Reference (Transaction ID)</Label>
                  <Input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Enter transaction reference number"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => processPayment('cancel')}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                    Cancel Payment
                  </Button>
                  <Button
                    onClick={() => processPayment('complete')}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Mark as Paid
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;
