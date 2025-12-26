import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useGlobalRefresh } from '@/hooks/useVisibilityRefresh';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PullToRefreshIndicator from '@/components/PullToRefreshIndicator';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import WalletSkeleton from '@/components/skeletons/WalletSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Info,
  AlertTriangle,
  CreditCard,
  Building2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

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
  const { user, isLoading: authLoading, paymentDetails } = useAuth();
  const [balances, setBalances] = useState<WalletBalances>({
    available: 0,
    pending: 0,
    totalEarned: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Real-time subscription for wallet updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('wallet-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Wallet transaction update:', payload);
          // Refetch wallet data when any transaction changes
          fetchWalletData();
          
          // Show toast for completed payments
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newTx = payload.new as { status: string; amount: number; type: string };
            if (newTx.status === 'completed' && newTx.type === 'prize') {
              toast.success(`Payment of $${newTx.amount} has been processed!`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchWalletData]);

  // Listen for global refresh events (tab visibility, network reconnection)
  useGlobalRefresh(fetchWalletData);

  const { pullDistance, isRefreshing, containerProps } = usePullToRefresh({
    onRefresh: fetchWalletData,
  });


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
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Once approved, the amount will be transferred to your registered payment method within 1-3 business days.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
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

            {/* Payment Method Summary */}
            <Card className="glass-card mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentDetails?.upi_id || paymentDetails?.bank_account_number ? (
                  <div className="space-y-3">
                    {paymentDetails.upi_id && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                        <div className="p-2 rounded-full bg-success/20">
                          <CheckCircle className="h-4 w-4 text-success" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">UPI ID</p>
                          <p className="font-medium">{paymentDetails.upi_id}</p>
                        </div>
                      </div>
                    )}
                    {paymentDetails.bank_account_number && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                        <div className="p-2 rounded-full bg-success/20">
                          <Building2 className="h-4 w-4 text-success" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Bank Account</p>
                          <p className="font-medium">
                            ****{paymentDetails.bank_account_number.slice(-4)}
                            {paymentDetails.bank_ifsc && (
                              <span className="text-muted-foreground ml-2">({paymentDetails.bank_ifsc})</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link to="/profile">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Update Payment Details
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="p-3 rounded-full bg-amber-500/10 w-fit mx-auto mb-3">
                      <AlertTriangle className="h-6 w-6 text-amber-500" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      No payment method configured. Add your UPI ID or bank details to receive prize payments.
                    </p>
                    <Button asChild>
                      <Link to="/profile">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Add Payment Method
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Withdrawal History */}
            {transactions.filter(tx => tx.type === 'withdrawal').length > 0 && (
              <Card className="glass-card mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-primary" />
                    Withdrawal History
                  </CardTitle>
                  <CardDescription>Track your withdrawal requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions
                      .filter(tx => tx.type === 'withdrawal')
                      .map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${
                              tx.status === 'completed' ? 'bg-success/10' : 
                              tx.status === 'pending' ? 'bg-amber-500/10' : 'bg-muted'
                            }`}>
                              {tx.status === 'completed' ? (
                                <CheckCircle className="h-5 w-5 text-success" />
                              ) : tx.status === 'pending' ? (
                                <Clock className="h-5 w-5 text-amber-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">${Number(tx.amount).toFixed(2)}</span>
                                {getStatusBadge(tx.status)}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Requested: {new Date(tx.created_at).toLocaleDateString('en-US', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                              {tx.payment_reference && tx.status === 'completed' && (
                                <p className="text-xs text-success mt-1">
                                  Payment Ref: {tx.payment_reference}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {tx.status === 'pending' && (
                              <p className="text-xs text-amber-500">Processing...</p>
                            )}
                            {tx.status === 'completed' && (
                              <p className="text-xs text-success">Paid</p>
                            )}
                            {tx.status === 'cancelled' && (
                              <p className="text-xs text-muted-foreground">Cancelled</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
    </div>
  );
};

export default Wallet;
