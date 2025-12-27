import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type TransactionType = 'prize' | 'withdrawal' | 'bonus';
type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
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

export interface WalletBalances {
  available: number;
  pending: number;
  totalEarned: number;
}

export const useWalletBalances = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['wallet-balances', userId],
    queryFn: async (): Promise<WalletBalances> => {
      if (!userId) {
        return { available: 0, pending: 0, totalEarned: 0 };
      }

      const [availableResult, pendingResult, totalEarnedResult] = await Promise.all([
        supabase.rpc('get_wallet_balance', { _user_id: userId }),
        supabase.rpc('get_pending_balance', { _user_id: userId }),
        supabase.rpc('get_total_earned', { _user_id: userId })
      ]);

      if (availableResult.error) throw availableResult.error;
      if (pendingResult.error) throw pendingResult.error;
      if (totalEarnedResult.error) throw totalEarnedResult.error;

      return {
        available: Number(availableResult.data) || 0,
        pending: Number(pendingResult.data) || 0,
        totalEarned: Number(totalEarnedResult.data) || 0,
      };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useWalletTransactions = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['wallet-transactions', userId],
    queryFn: async (): Promise<Transaction[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as Transaction[]) || [];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
