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
import { toast } from 'sonner';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  IndianRupee,
  Gift
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
  created_at: string;
  contest: {
    title: string;
  } | null;
}

const Wallet = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [balance, setBalance] = useState<number>(0);
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
        // Fetch balance
        const { data: balanceData, error: balanceError } = await supabase.rpc(
          'get_wallet_balance',
          {
            _user_id: user.id,
          }
        );

        if (balanceError) {
          console.error('Error fetching wallet balance:', balanceError);
          toast.error(balanceError.message || 'Failed to load wallet balance');
        } else if (balanceData !== null) {
          setBalance(Number(balanceData));
        }

        // Fetch transactions
        const { data: txData, error: txError } = await supabase
          .from('wallet_transactions')
          .select(
            `
            id,
            type,
            amount,
            currency,
            status,
            notes,
            created_at,
            contest:contests(title)
          `
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (txError) {
          console.error('Error fetching transactions:', txError);
          toast.error(txError.message || 'Failed to load transactions');
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

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'prize':
        return <Trophy className="h-5 w-5 text-accent" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-5 w-5 text-primary" />;
      case 'bonus':
        return <Gift className="h-5 w-5 text-success" />;
      default:
        return <IndianRupee className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'completed':
        return <Badge className="bg-success gap-1"><CheckCircle className="h-3 w-3" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" />Cancelled</Badge>;
      default:
        return null;
    }
  };

  const getTransactionLabel = (type: TransactionType) => {
    switch (type) {
      case 'prize':
        return 'Prize Won';
      case 'withdrawal':
        return 'Withdrawal';
      case 'bonus':
        return 'Bonus';
      default:
        return type;
    }
  };

  const pendingBalance = transactions
    .filter((t) => t.type === 'prize' && t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount), 0);

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
                  <p className="text-3xl font-bold">₹{balance.toFixed(2)}</p>
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
                  <p className="text-3xl font-bold">₹{pendingBalance.toFixed(2)}</p>
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
                  <p className="text-3xl font-bold">
                    ₹{transactions
                      .filter((t) => t.type === 'prize' && t.status === 'completed')
                      .reduce((sum, t) => sum + Number(t.amount), 0)
                      .toFixed(2)}
                  </p>
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
                  Transfer your winnings to your bank account or UPI. Minimum withdrawal: ₹100
                </p>
              </div>
              <Button disabled={balance < 100} className="gradient-primary">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Request Withdrawal
              </Button>
            </div>
            {balance < 100 && balance > 0 && (
              <p className="text-xs text-muted-foreground mt-4">
                You need ₹{(100 - balance).toFixed(2)} more to reach the minimum withdrawal amount.
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
            {isLoading ? (
              <div className="flex justify-center py-8">
                <WalletIcon className="h-8 w-8 animate-pulse text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
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
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{getTransactionLabel(tx.type)}</span>
                          {getStatusBadge(tx.status)}
                        </div>
                        {tx.contest && (
                          <p className="text-sm text-muted-foreground">{tx.contest.title}</p>
                        )}
                        {tx.notes && (
                          <p className="text-xs text-muted-foreground">{tx.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${tx.type === 'withdrawal' ? 'text-primary' : 'text-success'}`}>
                      {tx.type === 'withdrawal' ? '-' : '+'}₹{Number(tx.amount).toFixed(2)}
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
