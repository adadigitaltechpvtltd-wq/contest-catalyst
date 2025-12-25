import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PullToRefreshIndicator from '@/components/PullToRefreshIndicator';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import WalletSkeleton from '@/components/skeletons/WalletSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Gift,
  Loader2
} from 'lucide-react';

type TransactionType = 'prize' | 'withdrawal' | 'bonus';
type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  notes: string | null;
  payment_reference: string | null;
  created_at: string;
  contest: {
    title: string;
  } | null;
}

interface WalletBalances {
  available: number;
  pending: number;
  totalEarned: number;
}

const Wallet = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [balances, setBalances] = useState<WalletBalances>({
    available: 0,
    pending: 0,
    totalEarned: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWalletData = useCallback(async () => {
    if (authLoading && !user) return;

    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch all three balance values in parallel
      const [availableResult, pendingResult, totalEarnedResult] = await Promise.all([
        supabase.rpc('get_wallet_balance', { _user_id: user.id }),
        supabase.rpc('get_pending_balance', { _user_id: user.id }),
        supabase.rpc('get_total_earned', { _user_id: user.id })
      ]);

      if (availableResult.error) {
        console.error('Error fetching available balance:', availableResult.error);
        toast.error('Failed to load wallet balance');
      }
      if (pendingResult.error) {
        console.error('Error fetching pending balance:', pendingResult.error);
      }
      if (totalEarnedResult.error) {
        console.error('Error fetching total earned:', totalEarnedResult.error);
      }

      setBalances({
        available: Number(availableResult.data) || 0,
        pending: Number(pendingResult.data) || 0,
        totalEarned: Number(totalEarnedResult.data) || 0
      });

      // Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from('wallet_transactions')
        .select(`
          id,
          type,
          amount,
          currency,
          status,
          notes,
          payment_reference,
          created_at,
          contest:contests(title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (txError) {
        console.error('Error fetching transactions:', txError);
        toast.error('Failed to load transactions');
        setTransactions([]);
      } else {
        setTransactions((txData as unknown as Transaction[]) || []);
      }
    } catch (e) {
      console.error('Exception fetching wallet data:', e);
      toast.error('Failed to load wallet data');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const { pullDistance, isRefreshing, containerProps } = usePullToRefresh({
    onRefresh: fetchWalletData,
  });

  const handleWithdrawalRequest = async () => {
    if (!user || balances.available < 100) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        type: 'withdrawal',
        amount: balances.available,
        currency: 'USD',
        status: 'pending',
        notes: 'Withdrawal request'
      });

      if (error) throw error;

      toast.success('Withdrawal request submitted', {
        description: 'Your request is being processed. You will be notified once complete.'
      });
      setIsWithdrawModalOpen(false);
      fetchWalletData();
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTransactionIcon = (type: TransactionType, status: TransactionStatus) => {
    if (status === 'cancelled' || status === 'failed') {
      return <XCircle className="h-5 w-5 text-muted-foreground" />;
    }
    switch (type) {
      case 'prize':
        return <Trophy className="h-5 w-5 text-accent" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-5 w-5 text-primary" />;
      case 'bonus':
        return <Gift className="h-5 w-5 text-success" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1 bg-amber-500/20 text-amber-500 border-amber-500/30"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'completed':
        return <Badge className="bg-success gap-1"><CheckCircle className="h-3 w-3" />Paid</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" />Cancelled</Badge>;
      default:
        return null;
    }
  };

  const getTransactionLabel = (type: TransactionType, status: TransactionStatus) => {
    if (type === 'prize') {
      return status === 'pending' ? 'Prize Won (Pending)' : status === 'completed' ? 'Prize Won' : 'Prize (Cancelled)';
    }
    if (type === 'withdrawal') {
      return status === 'pending' ? 'Withdrawal Requested' : status === 'completed' ? 'Withdrawal Complete' : 'Withdrawal Cancelled';
    }
    if (type === 'bonus') {
      return 'Bonus';
    }
    return type;
  };

  const getAmountColor = (type: TransactionType, status: TransactionStatus) => {
    if (status === 'cancelled' || status === 'failed') {
      return 'text-muted-foreground line-through';
    }
    if (type === 'withdrawal') {
      return 'text-primary';
    }
    return 'text-success';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" {...containerProps}>
      <Navbar />
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-display font-bold mb-8">Wallet & Rewards</h1>

        {isLoading ? (
          <WalletSkeleton />
        ) : (
          <>
            {/* Balance Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-success/10">
                      <WalletIcon className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Available Balance</p>
                      <p className="text-3xl font-bold">${balances.available.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-amber-500/10">
                      <Clock className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-3xl font-bold">${balances.pending.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-accent/10">
                      <Trophy className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earned</p>
                      <p className="text-3xl font-bold">${balances.totalEarned.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Withdraw Button */}
            <Card className="glass-card mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">Withdraw Your Earnings</h3>
                    <p className="text-sm text-muted-foreground">
                      Transfer your winnings to your bank account or UPI. Minimum withdrawal: $100
                    </p>
                  </div>
                  <Button 
                    disabled={balances.available < 100} 
                    className="gradient-primary"
                    onClick={() => setIsWithdrawModalOpen(true)}
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Request Withdrawal
                  </Button>
                </div>
                {balances.available < 100 && balances.available > 0 && (
                  <p className="text-xs text-muted-foreground mt-4">
                    You need ${(100 - balances.available).toFixed(2)} more to reach the minimum withdrawal amount.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All your earnings and withdrawals</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <WalletIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No Transactions Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Win a contest to see your first transaction here!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-background">
                            {getTransactionIcon(tx.type, tx.status)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{getTransactionLabel(tx.type, tx.status)}</span>
                              {getStatusBadge(tx.status)}
                            </div>
                            {tx.contest && (
                              <p className="text-sm text-muted-foreground">{tx.contest.title}</p>
                            )}
                            {tx.notes && (
                              <p className="text-xs text-muted-foreground">{tx.notes}</p>
                            )}
                            {tx.payment_reference && tx.status === 'completed' && (
                              <p className="text-xs text-muted-foreground">Ref: {tx.payment_reference}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.created_at).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className={`text-lg font-bold ${getAmountColor(tx.type, tx.status)}`}>
                          {tx.type === 'withdrawal' ? '-' : '+'}${Number(tx.amount).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
      <Footer />

      {/* Withdrawal Confirmation Modal */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Confirm your withdrawal request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/30">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Available Balance</p>
                  <p className="font-semibold text-lg">${balances.available.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount to Withdraw</p>
                  <p className="font-semibold text-lg text-success">${balances.available.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Your withdrawal request will be reviewed by our team. Once approved, the amount will be transferred to your registered payment method within 3-5 business days.
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsWithdrawModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleWithdrawalRequest}
                disabled={isSubmitting}
                className="flex-1 bg-success hover:bg-success/90"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Withdrawal
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wallet;
